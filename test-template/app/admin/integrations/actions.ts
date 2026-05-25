"use server";

import { Resend } from "resend";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { invalidateApiKeyCache } from "@/lib/ai/client";
import {
  getGoogleGeminiApiKey,
  invalidateGeminiKeyCache,
} from "@/lib/ai/gemini";
import { invalidateStripeKeysCache } from "@/lib/stripe";
import { getResendApiKey, invalidateResendKeyCache } from "@/lib/mailer/resend";
import { getBrand, invalidateBrandCache } from "@/lib/brand";
import { encryptSecret, decryptSecret } from "@/lib/secret-encryption";
import { invalidateSetupStatusCache, parseChecklist } from "@/lib/setup-status";
import { verifyDomainDns, type DnsCheckResult } from "@/lib/email/dns-verify";
import type { InboxVendor } from "@/lib/email/dns-records";

const INBOX_VENDORS = ["cloudflare", "improvmx", "zoho", "m365"] as const;

function isValidInboxVendor(v: string): v is InboxVendor {
  return (INBOX_VENDORS as readonly string[]).includes(v);
}

/**
 * Hent settings + masked key. Plaintext-keyen returneres ALDRIG til
 * frontend — kun en preview ("sk-ant-...xx") så admin kan genkende
 * hvilken der er sat uden at exposere den fulde værdi i DOM.
 */
export async function getIntegrationStatus() {
  await requireAdmin();

  const row = await prisma.integrationSettings.findUnique({
    where: { id: 1 },
    select: { anthropicApiKey: true, googleGeminiApiKey: true, updatedAt: true },
  });

  // Decrypt for at kunne lave masked preview (review fund #9 — feltet er
  // krypteret i DB; vi viser stadig prefix/suffix til admin's visuelle match)
  const decrypted = row?.anthropicApiKey
    ? decryptSecret(row.anthropicApiKey)
    : null;
  const geminiDecrypted = row?.googleGeminiApiKey
    ? decryptSecret(row.googleGeminiApiKey)
    : null;
  const effectiveGeminiKey = await getGoogleGeminiApiKey();

  return {
    anthropic: {
      isSet: !!decrypted,
      preview: decrypted ? maskKey(decrypted) : null,
      updatedAt: row?.updatedAt ?? null,
      envFallback: !decrypted && !!process.env.ANTHROPIC_API_KEY,
    },
    gemini: {
      isSet: !!geminiDecrypted,
      preview: geminiDecrypted ? maskGeminiKey(geminiDecrypted) : null,
      updatedAt: row?.updatedAt ?? null,
      envFallback: !geminiDecrypted && !!effectiveGeminiKey,
    },
  };
}

export async function setAnthropicKeyAction(
  formData: FormData,
): Promise<{ ok: true; preview: string } | { ok: false; error: string }> {
  await requireAdmin();

  const raw = String(formData.get("apiKey") ?? "").trim();
  if (!raw) {
    return { ok: false, error: "Tom key — indtast en gyldig nøgle eller brug 'Fjern key'-knappen" };
  }
  if (!raw.startsWith("sk-ant-")) {
    return {
      ok: false,
      error:
        "Det ligner ikke en Anthropic-key (skal starte med 'sk-ant-'). Tjek at du har kopieret hele værdien.",
    };
  }
  if (raw.length < 40) {
    return { ok: false, error: "Key er for kort — har du fået den helt med?" };
  }

  // Krypter før storage (AES-256-GCM med KEK fra AUTH_SECRET).
  // DB-leak alene giver ikke funktionel key — angriber skal også have
  // serverens AUTH_SECRET (review fund #9).
  const encrypted = encryptSecret(raw);

  await prisma.integrationSettings.upsert({
    where: { id: 1 },
    create: { id: 1, anthropicApiKey: encrypted },
    update: { anthropicApiKey: encrypted },
  });

  invalidateApiKeyCache();
  invalidateSetupStatusCache();
  revalidatePath("/admin/integrations");

  return { ok: true, preview: maskKey(raw) };
}

export async function clearAnthropicKeyAction(): Promise<void> {
  await requireAdmin();

  await prisma.integrationSettings.upsert({
    where: { id: 1 },
    create: { id: 1, anthropicApiKey: null },
    update: { anthropicApiKey: null },
  });

  invalidateApiKeyCache();
  invalidateSetupStatusCache();
  revalidatePath("/admin/integrations");
}

export async function setGeminiKeyAction(
  formData: FormData,
): Promise<{ ok: true; preview: string } | { ok: false; error: string }> {
  await requireAdmin();

  const raw = String(formData.get("apiKey") ?? "").trim();
  if (!raw) {
    return {
      ok: false,
      error: "Tom nøgle — indtast en gyldig nøgle eller brug 'Fjern nøgle'-knappen",
    };
  }
  if (!raw.startsWith("AIza")) {
    return {
      ok: false,
      error:
        "Det ligner ikke en Google Gemini API-nøgle (skal starte med 'AIza'). Tjek at du har kopieret hele værdien.",
    };
  }
  // Google AIza-keys er typisk 39 tegn men kontrakt-garanteret kun >= 35.
  // Vi accepterer 35-45 for at undgå at afvise legitime keys hvis Google
  // udvider formatet.
  if (raw.length < 35 || raw.length > 45) {
    return {
      ok: false,
      error: "Nøglen ser ikke ud til at have det rigtige format — tjek at du har kopieret hele værdien.",
    };
  }

  const encrypted = encryptSecret(raw);

  await prisma.integrationSettings.upsert({
    where: { id: 1 },
    create: { id: 1, googleGeminiApiKey: encrypted },
    update: { googleGeminiApiKey: encrypted },
  });

  invalidateGeminiKeyCache();
  invalidateSetupStatusCache();
  revalidatePath("/admin/integrations");

  return { ok: true, preview: maskGeminiKey(raw) };
}

export async function clearGeminiKeyAction(): Promise<void> {
  await requireAdmin();

  await prisma.integrationSettings.upsert({
    where: { id: 1 },
    create: { id: 1, googleGeminiApiKey: null },
    update: { googleGeminiApiKey: null },
  });

  invalidateGeminiKeyCache();
  invalidateSetupStatusCache();
  revalidatePath("/admin/integrations");
}

// ── Stripe keys (Phase 2-prep — ubrugte i runtime indtil Phase 3) ──

type StripeKeyKind = "secret" | "publishable" | "webhook";

const STRIPE_KEY_CONFIG: Record<
  StripeKeyKind,
  {
    prefix: string;
    minLen: number;
    maxLen: number;
    dbField: "stripeSecretKey" | "stripePublishableKey" | "stripeWebhookSecret";
    label: string;
  }
> = {
  secret: {
    prefix: "sk_",
    minLen: 30,
    maxLen: 150,
    dbField: "stripeSecretKey",
    label: "Stripe Secret Key (sk_test_... eller sk_live_...)",
  },
  publishable: {
    prefix: "pk_",
    minLen: 30,
    maxLen: 150,
    dbField: "stripePublishableKey",
    label: "Stripe Publishable Key (pk_test_... eller pk_live_...)",
  },
  webhook: {
    prefix: "whsec_",
    minLen: 30,
    maxLen: 150,
    dbField: "stripeWebhookSecret",
    label: "Stripe Webhook Secret (whsec_...)",
  },
};

export async function setStripeKeyAction(
  kind: StripeKeyKind,
  formData: FormData,
): Promise<{ ok: true; preview: string } | { ok: false; error: string }> {
  await requireAdmin();
  const cfg = STRIPE_KEY_CONFIG[kind];

  const raw = String(formData.get("apiKey") ?? "").trim();
  if (!raw) {
    return { ok: false, error: "Tom nøgle — indtast en gyldig værdi" };
  }
  if (!raw.startsWith(cfg.prefix)) {
    return {
      ok: false,
      error: `Forkert format — skal starte med '${cfg.prefix}'`,
    };
  }
  if (raw.length < cfg.minLen || raw.length > cfg.maxLen) {
    return {
      ok: false,
      error: `Nøglen ser ikke ud til at have det rigtige format (${cfg.minLen}–${cfg.maxLen} tegn).`,
    };
  }

  const encrypted = encryptSecret(raw);
  await prisma.integrationSettings.upsert({
    where: { id: 1 },
    create: { id: 1, [cfg.dbField]: encrypted },
    update: { [cfg.dbField]: encrypted },
  });

  invalidateStripeKeysCache();
  invalidateSetupStatusCache();
  revalidatePath("/admin/integrations");
  return { ok: true, preview: maskGenericKey(raw) };
}

export async function clearStripeKeyAction(kind: StripeKeyKind): Promise<void> {
  await requireAdmin();
  const cfg = STRIPE_KEY_CONFIG[kind];
  await prisma.integrationSettings.upsert({
    where: { id: 1 },
    create: { id: 1, [cfg.dbField]: null },
    update: { [cfg.dbField]: null },
  });
  invalidateStripeKeysCache();
  invalidateSetupStatusCache();
  revalidatePath("/admin/integrations");
}

// ── Resend (email-service) ──────────────────────────────────────────────

export async function setResendKeyAction(
  formData: FormData,
): Promise<{ ok: true; preview: string } | { ok: false; error: string }> {
  await requireAdmin();
  const raw = String(formData.get("apiKey") ?? "").trim();
  if (!raw) {
    return { ok: false, error: "Tom nøgle — indtast en gyldig værdi" };
  }
  if (!raw.startsWith("re_")) {
    return {
      ok: false,
      error: "Forkert format — Resend keys starter med 're_'",
    };
  }
  if (raw.length < 20 || raw.length > 200) {
    return {
      ok: false,
      error: "Nøglen ser ikke ud til at have det rigtige format (20-200 tegn).",
    };
  }

  const encrypted = encryptSecret(raw);
  await prisma.integrationSettings.upsert({
    where: { id: 1 },
    create: { id: 1, resendApiKey: encrypted },
    update: { resendApiKey: encrypted },
  });
  invalidateResendKeyCache();
  invalidateSetupStatusCache();
  revalidatePath("/admin/integrations");
  return { ok: true, preview: maskGenericKey(raw) };
}

export async function clearResendKeyAction(): Promise<void> {
  await requireAdmin();
  await prisma.integrationSettings.upsert({
    where: { id: 1 },
    create: { id: 1, resendApiKey: null },
    update: { resendApiKey: null },
  });
  invalidateResendKeyCache();
  invalidateSetupStatusCache();
  revalidatePath("/admin/integrations");
}

/**
 * Send en testmail via den konfigurerede Resend-key + brand.emails.from.
 *
 * Validerer end-to-end-flowet uden at kræve en rigtig ordre:
 *   - Resend-key er gyldig
 *   - From-adressen er verificeret i Resend (ellers afviser API'en)
 *   - DNS/SPF/DKIM er propageret (ellers ender den i spam — vi logger ikke det,
 *     men admin kan tjekke headers manuelt)
 *
 * Sender til en adresse admin selv skriver i form'en — så man kan teste til
 * sin egen Gmail/Outlook uden at involvere en kunde.
 */
export async function sendTestResendEmailAction(
  formData: FormData,
): Promise<{ ok: true; sentTo: string } | { ok: false; error: string }> {
  await requireAdmin();

  const rawTo = String(formData.get("to") ?? "").trim().toLowerCase();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(rawTo) || rawTo.length > 254) {
    return { ok: false, error: "Ugyldig email-adresse" };
  }

  const key = await getResendApiKey();
  if (!key) {
    return {
      ok: false,
      error: "Ingen Resend-key konfigureret — gem en key først.",
    };
  }

  const brandData = await getBrand();
  const fromAddress = `${brandData.emails.fromName} <${brandData.emails.from}>`;
  const replyTo = brandData.emails.support || brandData.emails.from;

  const resend = new Resend(key);
  try {
    const result = await resend.emails.send({
      from: fromAddress,
      to: rawTo,
      replyTo,
      subject: `[Test] Cartwright email-opsætning for ${brandData.domain ?? brandData.storeName}`,
      text: [
        "Denne testmail bekræfter at din Resend-opsætning virker.",
        "",
        `Afsender:  ${fromAddress}`,
        `Reply-To:  ${replyTo}`,
        `Domæne:    ${brandData.domain ?? "(ikke sat)"}`,
        "",
        "Hvis mailen lander uden problemer er din konfiguration klar til at sende",
        "ordrebekræftelser og magic-links.",
        "",
        "Næste skridt — verificér i mail-headerne:",
        "  Authentication-Results: ... spf=pass dkim=pass dmarc=pass",
        "",
        "Hvis du ser fejl: https://cartwright.app/docs/email/troubleshooting",
      ].join("\n"),
    });
    if (result.error) {
      return {
        ok: false,
        error: `Resend afviste mailen: ${result.error.message}. Tjek at ${brandData.emails.from} er verificeret i Resend dashboardet.`,
      };
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Ukendt fejl ved afsendelse",
    };
  }

  return { ok: true, sentTo: rawTo };
}

// ── Lag 2: indbakke-udbyder + DNS verify ────────────────────────────────

/**
 * Skift kundens valgte indbakke-løsning fra EmailDomainPanel uden at sende
 * dem tilbage til wizard'en.
 */
export async function setInboxVendorAction(
  vendor: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const normalized = vendor.trim();
  if (normalized === "") {
    await prisma.brandingSettings.upsert({
      where: { id: 1 },
      update: { inboxVendor: null },
      create: { id: 1, storeName: "Min shop", heroImage: "", announcement: "", inboxVendor: null },
    });
  } else if (isValidInboxVendor(normalized)) {
    await prisma.brandingSettings.upsert({
      where: { id: 1 },
      update: { inboxVendor: normalized },
      create: { id: 1, storeName: "Min shop", heroImage: "", announcement: "", inboxVendor: normalized },
    });
  } else {
    return { ok: false, error: "Ugyldig indbakke-løsning" };
  }
  invalidateBrandCache();
  invalidateSetupStatusCache();
  revalidatePath("/admin/integrations");
  return { ok: true };
}

/**
 * Verificér public DNS state mod den forventede record-konfiguration. Læser
 * domæne + vendor fra brand-cache så vi altid bruger den aktuelle valgte
 * løsning.
 *
 * Returnerer pr-record status så UI'et kan vise hvilke records der mangler
 * eller er forkert konfigureret.
 */
export async function verifyEmailDnsAction(): Promise<
  | { ok: true; domain: string; checks: DnsCheckResult[] }
  | { ok: false; error: string }
> {
  await requireAdmin();
  const brandData = await getBrand();
  const domain = brandData.domain?.trim();
  if (!domain || domain === "example.com") {
    return {
      ok: false,
      error: "Sæt dit domæne i /admin/setup før du kan verificere DNS.",
    };
  }
  const vendor = brandData.inboxVendor as InboxVendor | null;
  const checks = await verifyDomainDns({ domain, inboxVendor: vendor });
  return { ok: true, domain, checks };
}

export async function toggleManualChecklistItemAction(
  id: string,
  done: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();

  const normalized = id.trim();
  if (!normalized || normalized.length > 80) {
    return { ok: false, error: "Ugyldigt checklist-id" };
  }

  const row = await prisma.integrationSettings.findUnique({
    where: { id: 1 },
    select: { setupChecklist: true },
  });
  const items = parseChecklist(row?.setupChecklist);

  if (done) {
    items.add(normalized);
  } else {
    items.delete(normalized);
  }

  await prisma.integrationSettings.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      setupChecklist: JSON.stringify([...items].sort()),
    },
    update: {
      setupChecklist: JSON.stringify([...items].sort()),
    },
  });

  invalidateSetupStatusCache();
  revalidatePath("/admin/integrations");
  return { ok: true };
}

export async function getResendStatus() {
  await requireAdmin();
  const row = await prisma.integrationSettings.findUnique({
    where: { id: 1 },
    select: { resendApiKey: true },
  });
  const key = row?.resendApiKey ? decryptSecret(row.resendApiKey) : null;
  return {
    isSet: !!key,
    preview: key ? maskGenericKey(key) : null,
  };
}

export async function getStripeStatus() {
  await requireAdmin();
  const row = await prisma.integrationSettings.findUnique({
    where: { id: 1 },
    select: {
      stripeSecretKey: true,
      stripePublishableKey: true,
      stripeWebhookSecret: true,
    },
  });
  const decode = (v: string | null | undefined) => (v ? decryptSecret(v) : null);
  const secret = decode(row?.stripeSecretKey);
  const publishable = decode(row?.stripePublishableKey);
  const webhook = decode(row?.stripeWebhookSecret);
  return {
    secret: {
      isSet: !!secret,
      preview: secret ? maskGenericKey(secret) : null,
    },
    publishable: {
      isSet: !!publishable,
      preview: publishable ? maskGenericKey(publishable) : null,
    },
    webhook: {
      isSet: !!webhook,
      preview: webhook ? maskGenericKey(webhook) : null,
    },
    allReady: !!(secret && publishable && webhook),
  };
}

/**
 * Maskering: vis prefix + suffix, skjul midten. Følger samme mønster som
 * GitHub/Stripe-dashboards så admin har et visuelt match-clue ved
 * troubleshooting men kan ikke kopiere keyen ud.
 */
function maskKey(key: string): string {
  if (key.length < 12) return "•".repeat(key.length);
  const prefix = key.slice(0, 10); // "sk-ant-..."
  const suffix = key.slice(-4);
  return `${prefix}${"•".repeat(20)}${suffix}`;
}

function maskGenericKey(key: string): string {
  if (key.length < 12) return "•".repeat(key.length);
  // Detect prefix-længde dynamisk: alt før første underscore + det første tegn efter
  const underscoreIdx = key.indexOf("_");
  const prefixEnd = underscoreIdx > 0 ? underscoreIdx + 1 : 4;
  const prefix = key.slice(0, Math.min(prefixEnd + 4, 10));
  const suffix = key.slice(-4);
  return `${prefix}${"•".repeat(20)}${suffix}`;
}

function maskGeminiKey(key: string): string {
  if (key.length < 8) return "•".repeat(key.length);
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}
