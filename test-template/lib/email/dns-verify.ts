import "server-only";

import { promises as dns } from "node:dns";
import type { InboxVendor } from "./dns-records";

/**
 * Status pr. forventet record-gruppe efter at have spurgt public DNS.
 *
 * "ok"        = vi fandt mindst én forventet værdi.
 * "missing"   = lookup gav intet — ikke propageret eller ikke oprettet.
 * "mismatch"  = der findes records, men ingen matcher forventningen.
 * "skipped"   = vi har ikke nok info til at verificere (fx vendor ikke valgt,
 *               eller record indeholder en placeholder vi ikke kender).
 * "error"     = uventet fejl (vi viser detail i UI så admin kan rapportere).
 */
export type DnsCheckStatus =
  | "ok"
  | "missing"
  | "mismatch"
  | "skipped"
  | "error";

export type DnsCheckResult = {
  id:
    | "vercel-a"
    | "vercel-cname-www"
    | "resend-dkim"
    | "resend-send-spf"
    | "spf-combined"
    | "dmarc"
    | "inbox-mx";
  label: string;
  status: DnsCheckStatus;
  /** Hvad vi fandt i public DNS (afkortet hvis langt) */
  found?: string[];
  /** Hvad vi forventede at se */
  expectedHint: string;
  /** Hvis status=error eller mismatch, en kort note til UI'et */
  detail?: string;
};

type VerifyArgs = {
  domain: string;
  inboxVendor: InboxVendor | null;
};

/**
 * Kør alle DNS-checks parallelt. Hver check er fail-soft — vi returnerer
 * en status pr. record-gruppe selvom andre fejler.
 *
 * Bemærk: vi spørger ALTID public DNS (system resolver) — ikke en specifik
 * authoritative server. Det betyder freshly-oprettede records kan tage
 * 5-30 min før de bliver synlige her. UI'et fortæller admin det.
 */
export async function verifyDomainDns({
  domain,
  inboxVendor,
}: VerifyArgs): Promise<DnsCheckResult[]> {
  const checks = await Promise.all([
    checkVercelA(domain),
    checkVercelCnameWww(domain),
    checkResendDkim(domain),
    checkResendSendSpf(domain),
    checkCombinedSpf(domain, inboxVendor),
    checkDmarc(domain),
    checkInboxMx(domain, inboxVendor),
  ]);
  return checks;
}

// ─── Individuelle checks ───────────────────────────────────────────────────

async function checkVercelA(domain: string): Promise<DnsCheckResult> {
  const expectedHint = "A @ → 76.76.21.21";
  try {
    const records = await dns.resolve4(domain);
    if (records.includes("76.76.21.21")) {
      return { id: "vercel-a", label: "Vercel A-record", status: "ok", found: records, expectedHint };
    }
    return {
      id: "vercel-a",
      label: "Vercel A-record",
      status: "mismatch",
      found: records,
      expectedHint,
      detail: "Apex peger ikke på Vercels IP — kontrollér registrar.",
    };
  } catch (err) {
    return mapDnsError("vercel-a", "Vercel A-record", expectedHint, err);
  }
}

async function checkVercelCnameWww(domain: string): Promise<DnsCheckResult> {
  const expectedHint = "CNAME www → cname.vercel-dns.com";
  try {
    const records = await dns.resolveCname(`www.${domain}`);
    const match = records.some((r) => r.includes("vercel-dns.com"));
    return {
      id: "vercel-cname-www",
      label: "Vercel www CNAME",
      status: match ? "ok" : "mismatch",
      found: records,
      expectedHint,
      detail: match
        ? undefined
        : "www peger ikke på Vercel — opdater CNAME hos din DNS-udbyder.",
    };
  } catch (err) {
    return mapDnsError("vercel-cname-www", "Vercel www CNAME", expectedHint, err);
  }
}

async function checkResendDkim(domain: string): Promise<DnsCheckResult> {
  const expectedHint = "TXT resend._domainkey → DKIM public key";
  try {
    const records = await dns.resolveTxt(`resend._domainkey.${domain}`);
    const flat = records.map((parts) => parts.join("")).filter((s) => s.includes("p="));
    if (flat.length > 0) {
      return {
        id: "resend-dkim",
        label: "Resend DKIM",
        status: "ok",
        found: flat.map(truncate),
        expectedHint,
      };
    }
    return {
      id: "resend-dkim",
      label: "Resend DKIM",
      status: "mismatch",
      found: records.map((p) => p.join("")).map(truncate),
      expectedHint,
      detail: "TXT findes men indeholder ikke en DKIM-public-key (p=...).",
    };
  } catch (err) {
    return mapDnsError("resend-dkim", "Resend DKIM", expectedHint, err);
  }
}

async function checkResendSendSpf(domain: string): Promise<DnsCheckResult> {
  const expectedHint = `TXT send → "v=spf1 include:amazonses.com ~all"`;
  try {
    const records = await dns.resolveTxt(`send.${domain}`);
    const flat = records.map((parts) => parts.join(""));
    const match = flat.some((s) => /v=spf1/i.test(s) && /amazonses\.com/i.test(s));
    return {
      id: "resend-send-spf",
      label: "Resend return-path SPF",
      status: match ? "ok" : "mismatch",
      found: flat.map(truncate),
      expectedHint,
      detail: match ? undefined : "Resend's send-subdomain SPF mangler include:amazonses.com.",
    };
  } catch (err) {
    return mapDnsError("resend-send-spf", "Resend return-path SPF", expectedHint, err);
  }
}

async function checkCombinedSpf(
  domain: string,
  vendor: InboxVendor | null,
): Promise<DnsCheckResult> {
  const expectedHint = vendor
    ? `TXT @ → "v=spf1 include:${vendorSpfInclude(vendor)} include:_spf.resend.com ~all"`
    : `TXT @ → "v=spf1 include:_spf.resend.com ~all"`;
  try {
    const records = await dns.resolveTxt(domain);
    const flat = records.map((parts) => parts.join("")).filter((s) => /v=spf1/i.test(s));

    if (flat.length === 0) {
      return {
        id: "spf-combined",
        label: "Kombineret SPF (@)",
        status: "missing",
        expectedHint,
        detail: "Ingen SPF-record fundet på apex.",
      };
    }
    if (flat.length > 1) {
      return {
        id: "spf-combined",
        label: "Kombineret SPF (@)",
        status: "mismatch",
        found: flat.map(truncate),
        expectedHint,
        detail:
          "DER ER FLERE SPF-RECORDS — det er den mest almindelige fejl. Slå dem sammen til én med flere include:.",
      };
    }

    const spf = flat[0];
    const hasResend = /include:_spf\.resend\.com/i.test(spf);
    const hasVendor = !vendor
      ? true
      : new RegExp(`include:${vendorSpfInclude(vendor).replace(/\./g, "\\.")}`, "i").test(spf);

    if (hasResend && hasVendor) {
      return {
        id: "spf-combined",
        label: "Kombineret SPF (@)",
        status: "ok",
        found: [truncate(spf)],
        expectedHint,
      };
    }

    const missing: string[] = [];
    if (!hasResend) missing.push("_spf.resend.com");
    if (!hasVendor && vendor) missing.push(vendorSpfInclude(vendor));
    return {
      id: "spf-combined",
      label: "Kombineret SPF (@)",
      status: "mismatch",
      found: [truncate(spf)],
      expectedHint,
      detail: `SPF mangler include: ${missing.join(", ")}`,
    };
  } catch (err) {
    return mapDnsError("spf-combined", "Kombineret SPF (@)", expectedHint, err);
  }
}

async function checkDmarc(domain: string): Promise<DnsCheckResult> {
  const expectedHint = `TXT _dmarc → "v=DMARC1; p=none; rua=mailto:..."`;
  try {
    const records = await dns.resolveTxt(`_dmarc.${domain}`);
    const flat = records.map((parts) => parts.join(""));
    const dmarc = flat.find((s) => /v=DMARC1/i.test(s));
    if (!dmarc) {
      return {
        id: "dmarc",
        label: "DMARC-policy",
        status: "missing",
        expectedHint,
      };
    }
    const hasRua = /rua=/i.test(dmarc);
    return {
      id: "dmarc",
      label: "DMARC-policy",
      status: hasRua ? "ok" : "mismatch",
      found: [truncate(dmarc)],
      expectedHint,
      detail: hasRua
        ? undefined
        : "DMARC fundet men mangler rua= — du får ingen aggregerede rapporter.",
    };
  } catch (err) {
    return mapDnsError("dmarc", "DMARC-policy", expectedHint, err);
  }
}

async function checkInboxMx(
  domain: string,
  vendor: InboxVendor | null,
): Promise<DnsCheckResult> {
  if (!vendor) {
    return {
      id: "inbox-mx",
      label: "Indbakke MX",
      status: "skipped",
      expectedHint: "Vælg en indbakke-løsning for at verificere MX",
    };
  }
  const expected = inboxMxPattern(vendor);
  const expectedHint = `MX @ → ${expected.description}`;
  try {
    const records = await dns.resolveMx(domain);
    const match = records.some((r) => expected.regex.test(r.exchange));
    return {
      id: "inbox-mx",
      label: "Indbakke MX",
      status: match ? "ok" : records.length > 0 ? "mismatch" : "missing",
      found: records.map((r) => `${r.exchange} (priority ${r.priority})`),
      expectedHint,
      detail:
        records.length === 0
          ? "Ingen MX-records fundet — kunder kan ikke skrive til dig endnu."
          : match
            ? undefined
            : `MX peger på en anden udbyder end ${vendor}. Slet de gamle records først.`,
    };
  } catch (err) {
    return mapDnsError("inbox-mx", "Indbakke MX", expectedHint, err);
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function vendorSpfInclude(vendor: InboxVendor): string {
  switch (vendor) {
    case "cloudflare":
      return "_spf.mx.cloudflare.net";
    case "improvmx":
      return "spf.improvmx.com";
    case "zoho":
      return "zoho.eu"; // skift til zoho.com hvis non-EU; UI kan tilbyde region-switch senere
    case "m365":
      return "spf.protection.outlook.com";
  }
}

function inboxMxPattern(vendor: InboxVendor): {
  regex: RegExp;
  description: string;
} {
  switch (vendor) {
    case "cloudflare":
      return { regex: /mx\.cloudflare\.net$/i, description: "route<N>.mx.cloudflare.net" };
    case "improvmx":
      return { regex: /mx\d?\.improvmx\.com$/i, description: "mx{1,2}.improvmx.com" };
    case "zoho":
      return { regex: /mx[\d]*\.zoho\.(eu|com)$/i, description: "mx[N].zoho.eu / zoho.com" };
    case "m365":
      return { regex: /\.mail\.protection\.outlook\.com$/i, description: "<tenant>.mail.protection.outlook.com" };
  }
}

function mapDnsError(
  id: DnsCheckResult["id"],
  label: string,
  expectedHint: string,
  err: unknown,
): DnsCheckResult {
  const code = (err as { code?: string } | undefined)?.code;
  // ENOTFOUND / ENODATA = recorden findes ikke, ikke en fejl
  if (code === "ENOTFOUND" || code === "ENODATA") {
    return { id, label, status: "missing", expectedHint };
  }
  return {
    id,
    label,
    status: "error",
    expectedHint,
    detail: err instanceof Error ? err.message : String(err),
  };
}

function truncate(s: string, max = 120): string {
  return s.length > max ? `${s.slice(0, max)}…` : s;
}
