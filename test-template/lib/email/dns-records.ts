/**
 * Pure-data registry over de DNS-records en kunde skal oprette for at få:
 *
 *   - Vercel website (alle scenarier)
 *   - Resend udgående mail (alle scenarier)
 *   - En valgt indbakke-løsning (cloudflare / improvmx / zoho / m365)
 *   - DMARC (alle scenarier)
 *
 * Bruges af EmailDomainPanel til at render copy-pastable record-lister og af
 * verifyEmailDnsAction til at sammenligne forventet vs. faktisk DNS state.
 *
 * Holdt 1:1 i synk med apps/web/content/docs/email/dns-records.mdx — hvis du
 * ændrer record-formaterne der, skal du opdatere her også (og omvendt).
 */

export type InboxVendor = "cloudflare" | "improvmx" | "zoho" | "m365";

export const INBOX_VENDOR_LABELS: Record<InboxVendor, string> = {
  cloudflare: "Cloudflare Email Routing",
  improvmx: "ImprovMX",
  zoho: "Zoho Mail",
  m365: "Microsoft 365",
};

export type DnsRecordType = "A" | "CNAME" | "TXT" | "MX";

export type DnsRecord = {
  type: DnsRecordType;
  host: string;
  value: string;
  priority?: number;
  /** Free-text note shown under the record (e.g. "kun hvis Vercel beder om det") */
  note?: string;
  /**
   * Identifier brugt af verify-funktionen til at mappe expected → actual.
   * Tomt felt betyder vi viser recorden men verificerer den ikke automatisk
   * (fx token-værdier vi ikke kender på forhånd).
   */
  verifyKey?:
    | "vercel-a"
    | "vercel-cname-www"
    | "resend-dkim"
    | "resend-send-mx"
    | "resend-send-spf"
    | "spf-combined"
    | "dmarc"
    | "inbox-mx";
};

export type DnsRecordGroup = {
  title: string;
  description?: string;
  records: DnsRecord[];
};

type BuildArgs = {
  domain: string;
  inboxVendor: InboxVendor | null;
  /** SES region som Resend bruger (eu-west-1 / us-east-1). Default eu-west-1. */
  resendRegion?: string;
};

/**
 * Bygger den komplette liste af forventede DNS-records for en given kunde.
 *
 * Returnerer altid Vercel + Resend + DMARC. Hvis inboxVendor er sat,
 * tilføjes også vendor-specifikke MX + den kombinerede SPF. Hvis ikke valgt,
 * vises Resend-only SPF som fallback.
 */
export function buildExpectedRecords({
  domain,
  inboxVendor,
  resendRegion = "eu-west-1",
}: BuildArgs): DnsRecordGroup[] {
  const groups: DnsRecordGroup[] = [];

  // ─── Vercel website (alle scenarier) ─────────────────────────────────────
  groups.push({
    title: "Vercel — website",
    description: "Disse records peger selve sitet og gælder uanset mail-løsning.",
    records: [
      {
        type: "A",
        host: "@",
        value: "76.76.21.21",
        verifyKey: "vercel-a",
      },
      {
        type: "CNAME",
        host: "www",
        value: "cname.vercel-dns.com",
        verifyKey: "vercel-cname-www",
      },
    ],
  });

  // ─── Resend sending (alle scenarier) ─────────────────────────────────────
  groups.push({
    title: "Resend — udgående mail",
    description:
      "Lader Cartwright sende ordrebekræftelser og magic-links fra dit domæne. Tilføj uanset indbakke-valg.",
    records: [
      {
        type: "TXT",
        host: "resend._domainkey",
        value: "<DKIM-public-key-fra-Resend>",
        verifyKey: "resend-dkim",
        note: "Kopier eksakt fra Resend dashboardet efter du har tilføjet dit domæne.",
      },
      {
        type: "MX",
        host: "send",
        value: `feedback-smtp.${resendRegion}.amazonses.com`,
        priority: 10,
        verifyKey: "resend-send-mx",
      },
      {
        type: "TXT",
        host: "send",
        value: `"v=spf1 include:amazonses.com ~all"`,
        verifyKey: "resend-send-spf",
      },
    ],
  });

  // ─── Vendor-specifik MX + kombineret SPF + evt. ekstra records ───────────
  const inboxGroup = buildInboxGroup(domain, inboxVendor);
  if (inboxGroup) groups.push(inboxGroup);

  // ─── DMARC (alle scenarier) ──────────────────────────────────────────────
  const reportTo = inboxVendor ? `dmarc@${domain}` : `postmaster@${domain}`;
  groups.push({
    title: "DMARC — start blødt",
    description:
      "Start altid med p=none i 2-4 uger. Læs rua-rapporterne, ret evt. fejlende strømme, og stram derefter til p=quarantine og senere p=reject.",
    records: [
      {
        type: "TXT",
        host: "_dmarc",
        value: `"v=DMARC1; p=none; rua=mailto:${reportTo}; pct=100; adkim=r; aspf=r"`,
        verifyKey: "dmarc",
      },
    ],
  });

  return groups;
}

function buildInboxGroup(
  domain: string,
  vendor: InboxVendor | null,
): DnsRecordGroup | null {
  if (!vendor) {
    return {
      title: "Indbakke — vælg en udbyder",
      description:
        "Du har ikke valgt en indbakke-løsning endnu. Indtil du gør, kan kunder ikke skrive til hello@dit-domæne. Tilføj kun den midlertidige SPF nedenfor; udskift med kombineret SPF når du vælger en udbyder.",
      records: [
        {
          type: "TXT",
          host: "@",
          value: `"v=spf1 include:_spf.resend.com ~all"`,
          verifyKey: "spf-combined",
          note: "Resend-only — kun udgående virker. Modtag kræver MX fra en indbakke-udbyder.",
        },
      ],
    };
  }

  switch (vendor) {
    case "cloudflare":
      return {
        title: "Indbakke — Cloudflare Email Routing",
        description:
          "Kræver Cloudflare som DNS-udbyder. Aktiver under Cloudflare dashboard → Email → Email Routing før records går live.",
        records: [
          { type: "MX", host: "@", value: "route1.mx.cloudflare.net", priority: 13, verifyKey: "inbox-mx" },
          { type: "MX", host: "@", value: "route2.mx.cloudflare.net", priority: 86, verifyKey: "inbox-mx" },
          { type: "MX", host: "@", value: "route3.mx.cloudflare.net", priority: 24, verifyKey: "inbox-mx" },
          {
            type: "TXT",
            host: "@",
            value: `"v=spf1 include:_spf.mx.cloudflare.net include:_spf.resend.com ~all"`,
            verifyKey: "spf-combined",
            note: "Kombineret SPF — ÉN record, aldrig to.",
          },
        ],
      };

    case "improvmx":
      return {
        title: "Indbakke — ImprovMX",
        description:
          "Virker med enhver DNS-udbyder. Gratis tier giver én forwarding-adresse; opret aliases på improvmx.com.",
        records: [
          { type: "MX", host: "@", value: "mx1.improvmx.com", priority: 10, verifyKey: "inbox-mx" },
          { type: "MX", host: "@", value: "mx2.improvmx.com", priority: 20, verifyKey: "inbox-mx" },
          {
            type: "TXT",
            host: "@",
            value: `"v=spf1 include:spf.improvmx.com include:_spf.resend.com ~all"`,
            verifyKey: "spf-combined",
            note: "Kombineret SPF — ÉN record, aldrig to.",
          },
        ],
      };

    case "zoho":
      return {
        title: "Indbakke — Zoho Mail (EU-region)",
        description:
          "Rigtig indbakke (ikke forwarding) — gratis for op til 5 brugere. Brug .com endpoints hvis du IKKE valgte EU data-residency.",
        records: [
          { type: "MX", host: "@", value: "mx.zoho.eu", priority: 10, verifyKey: "inbox-mx" },
          { type: "MX", host: "@", value: "mx2.zoho.eu", priority: 20, verifyKey: "inbox-mx" },
          { type: "MX", host: "@", value: "mx3.zoho.eu", priority: 50, verifyKey: "inbox-mx" },
          {
            type: "TXT",
            host: "@",
            value: `"v=spf1 include:zoho.eu include:_spf.resend.com ~all"`,
            verifyKey: "spf-combined",
            note: "Kombineret SPF — ÉN record, aldrig to.",
          },
          {
            type: "TXT",
            host: "zoho._domainkey",
            value: "<DKIM-key-fra-Zoho-admin>",
            note: "Hent under Zoho Mail Admin → Email Configuration → DKIM. Nødvendig hvis du sender FRA Zoho-indbakken.",
          },
        ],
      };

    case "m365": {
      const m365Slug = domain.replace(/\./g, "-");
      return {
        title: "Indbakke — Microsoft 365",
        description:
          "Professionel mail (Outlook, Teams, kalender). MX-værdien og DKIM-tenant udskiftes med din faktiske tenant slug fra M365 Admin Center.",
        records: [
          {
            type: "MX",
            host: "@",
            value: `${m365Slug}.mail.protection.outlook.com`,
            priority: 0,
            verifyKey: "inbox-mx",
          },
          {
            type: "TXT",
            host: "@",
            value: `"v=spf1 include:spf.protection.outlook.com include:_spf.resend.com ~all"`,
            verifyKey: "spf-combined",
            note: "Kombineret SPF — ÉN record, aldrig to.",
          },
          {
            type: "CNAME",
            host: "selector1._domainkey",
            value: `selector1-${m365Slug}._domainkey.<tenant>.onmicrosoft.com`,
            note: "Erstat <tenant> med din M365 tenant slug fra Admin Center.",
          },
          {
            type: "CNAME",
            host: "selector2._domainkey",
            value: `selector2-${m365Slug}._domainkey.<tenant>.onmicrosoft.com`,
            note: "Erstat <tenant> med din M365 tenant slug.",
          },
          {
            type: "CNAME",
            host: "autodiscover",
            value: "autodiscover.outlook.com",
          },
        ],
      };
    }
  }
}
