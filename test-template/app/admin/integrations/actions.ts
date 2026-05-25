"use server";

import { generateText } from "ai";
import { Resend } from "resend";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import {
  invalidateApiKeyCache,
  chatModelResolved,
  getModelCapabilities,
  type ChatIntent,
} from "@/lib/ai/client";
import {
  getAiSettings,
  invalidateAiSettingsCache,
  type AiProvider,
  type LocalAiFallbackMode,
} from "@/lib/ai/settings";
import {
  getVoiceShopSettings,
  invalidateVoiceShopCache,
  readDailyUsage,
} from "@/lib/voice/settings";
import { CUSTOMER_TOOL_ALLOWLIST } from "@/lib/ai/client";
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

// ── Local-AI plan: AI provider config + Ollama-integration ──────────────────

const VALID_PROVIDERS = ["anthropic", "local", "auto"] as const;
const VALID_FALLBACK_MODES = ["off", "on-error", "after-3-failures"] as const;

function isValidProvider(v: unknown): v is AiProvider {
  return typeof v === "string" && (VALID_PROVIDERS as readonly string[]).includes(v);
}

function isValidFallbackMode(v: unknown): v is LocalAiFallbackMode {
  return (
    typeof v === "string" && (VALID_FALLBACK_MODES as readonly string[]).includes(v)
  );
}

/**
 * Hent nuværende AI-settings til UI-rendering. Returnerer en serialiserbar
 * shape uden secrets (apiKey vises kun som boolean configured-flag).
 */
export async function getAiSettingsForUi() {
  await requireAdmin();
  const s = await getAiSettings();
  return {
    provider: s.provider,
    anthropicModel: s.anthropicModel,
    localAiEndpoint: s.localAiEndpoint,
    localAiModel: s.localAiModel,
    localAiFallbackMode: s.localAiFallbackMode,
    anthropicConfigured: s.anthropicConfigured,
    localConfigured: s.localConfigured,
    lastDegradedAt: s.lastDegradedAt?.toISOString() ?? null,
  };
}

/**
 * Gem ny AI provider config. Validerer alle felter; tomme strenge bliver til
 * NULL i DB så getAiSettings() falder tilbage til env/defaults.
 */
export async function setAiSettingsAction(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();

  const provider = String(formData.get("provider") ?? "").trim();
  const anthropicModel = String(formData.get("anthropicModel") ?? "").trim();
  const localAiEndpoint = String(formData.get("localAiEndpoint") ?? "").trim();
  const localAiModel = String(formData.get("localAiModel") ?? "").trim();
  const localAiFallbackMode = String(
    formData.get("localAiFallbackMode") ?? "",
  ).trim();

  if (!isValidProvider(provider)) {
    return { ok: false, error: "Ugyldig provider (skal være anthropic/local/auto)" };
  }
  if (anthropicModel && (anthropicModel.length > 80 || !/^[a-z0-9._-]+$/i.test(anthropicModel))) {
    return { ok: false, error: "Ugyldigt Anthropic model-id" };
  }
  if (localAiEndpoint) {
    try {
      const url = new URL(localAiEndpoint);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return { ok: false, error: "Endpoint skal være http:// eller https://" };
      }
    } catch {
      return { ok: false, error: "Ugyldig endpoint-URL" };
    }
  }
  if (localAiModel && (localAiModel.length > 80 || !/^[a-z0-9._:-]+$/i.test(localAiModel))) {
    return { ok: false, error: "Ugyldigt local model-id (kun a-z, 0-9, . _ - :)" };
  }
  if (localAiFallbackMode && !isValidFallbackMode(localAiFallbackMode)) {
    return { ok: false, error: "Ugyldig fallback-mode" };
  }
  if (provider === "local" && (!localAiEndpoint || !localAiModel)) {
    return {
      ok: false,
      error:
        "Provider=local kræver både endpoint og model. Konfigurer dem først eller vælg auto/anthropic.",
    };
  }

  await prisma.integrationSettings.upsert({
    where: { id: 1 },
    update: {
      aiProvider: provider,
      anthropicModel: anthropicModel || null,
      localAiEndpoint: localAiEndpoint || null,
      localAiModel: localAiModel || null,
      localAiFallbackMode: localAiFallbackMode || null,
    },
    create: {
      id: 1,
      aiProvider: provider,
      anthropicModel: anthropicModel || null,
      localAiEndpoint: localAiEndpoint || null,
      localAiModel: localAiModel || null,
      localAiFallbackMode: localAiFallbackMode || null,
    },
  });

  invalidateAiSettingsCache();
  invalidateSetupStatusCache();
  revalidatePath("/admin/integrations");
  return { ok: true };
}

/**
 * Liste modeller tilgængelige på Ollama-endpointet. Tester samtidig at
 * endpointet er online. Returnerer model-navne + capability-tier så UI'et
 * kan vise hvilke modeller der har hvilken tool-cap (read-only/low-risk/all).
 */
export async function listOllamaModelsAction(
  endpoint: string,
): Promise<
  | { ok: true; models: Array<{ name: string; tier: string }>; latencyMs: number }
  | { ok: false; error: string }
> {
  await requireAdmin();

  const trimmed = endpoint.trim();
  if (!trimmed) {
    return { ok: false, error: "Endpoint er tomt" };
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { ok: false, error: "Ugyldig endpoint-URL" };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, error: "Endpoint skal være http:// eller https://" };
  }

  // Ollama's tags-endpoint er på root (ikke /v1). Hvis admin har skrevet
  // /v1 i URL'en, normaliserer vi det væk.
  const baseUrl = trimmed.replace(/\/v1\/?$/, "").replace(/\/$/, "");
  const tagsUrl = `${baseUrl}/api/tags`;

  const start = Date.now();
  let response: Response;
  try {
    response = await fetch(tagsUrl, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error && err.name === "TimeoutError"
          ? `Timeout (5s) — er Ollama startet på ${baseUrl}?`
          : `Kan ikke nå ${baseUrl}: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
  const latencyMs = Date.now() - start;

  if (!response.ok) {
    return {
      ok: false,
      error: `Ollama returnerede ${response.status} — er endpoint korrekt?`,
    };
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { ok: false, error: "Ollama returnerede ikke gyldig JSON" };
  }

  // Ollama-format: { models: [{ name: "gemma3:12b", ... }, ...] }
  if (
    !body ||
    typeof body !== "object" ||
    !Array.isArray((body as { models?: unknown[] }).models)
  ) {
    return {
      ok: false,
      error: "Uventet Ollama-response (forventede {models: []})",
    };
  }
  const rawModels = (body as { models: Array<{ name?: unknown }> }).models;
  const models = rawModels
    .map((m) => (typeof m.name === "string" ? m.name : null))
    .filter((n): n is string => n !== null)
    .map((name) => ({
      name,
      tier: getModelCapabilities(name).tools,
    }));

  return { ok: true, models, latencyMs };
}

/**
 * Send en minimal test-prompt til den konfigurerede provider og returnér
 * svar + latency. Bruges af "Test forbindelse"-knap i LocalAiForm OG af
 * Fase 1.8 ai-test page.
 *
 * intent="chat" så det respekterer aiProvider; intent="vibe" tvinges altid
 * til Anthropic (bruges hvis vi vil bevise at vibe-routing virker).
 */
export async function testAiProviderAction(
  intent: ChatIntent = "chat",
  prompt: string = "Sig præcis: OK",
): Promise<
  | {
      ok: true;
      provider: string;
      model: string;
      response: string;
      latencyMs: number;
    }
  | { ok: false; error: string }
> {
  await requireAdmin();

  let resolved: Awaited<ReturnType<typeof chatModelResolved>>;
  try {
    resolved = await chatModelResolved(intent);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Provider ikke konfigureret",
    };
  }

  const start = Date.now();
  try {
    const result = await generateText({
      model: resolved.handle,
      prompt: prompt.slice(0, 500),
    });
    return {
      ok: true,
      provider: resolved.provider,
      model: resolved.model,
      response: result.text.slice(0, 500),
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Ukendt fejl ved test-kald",
    };
  }
}

// ─── Voice Shop (Gemini Live) ────────────────────────────────────────────────

const VOICE_MODELS = [
  "gemini-2.5-flash-live",
  "gemini-3.1-flash-live-preview",
] as const;

const VOICE_VOICES = [
  "Puck",
  "Charon",
  "Kore",
  "Fenrir",
  "Aoede",
  "Leda",
  "Orus",
  "Zephyr",
] as const;

export async function getVoiceShopSettingsForUi() {
  await requireAdmin();
  const s = await getVoiceShopSettings();
  const usage = await readDailyUsage();
  return {
    enabled: s.enabled,
    apiKeyConfigured: !!s.apiKey,
    model: s.model,
    voice: s.voice,
    allowedTools: s.allowedTools,
    maxMinutesPerSession: s.maxMinutesPerSession,
    maxMinutesPerDay: s.maxMinutesPerDay,
    visionEnabled: s.visionEnabled,
    todayUsage: usage,
    availableTools: [...CUSTOMER_TOOL_ALLOWLIST],
    availableModels: [...VOICE_MODELS],
    availableVoices: [...VOICE_VOICES],
  };
}

export async function setVoiceShopSettingsAction(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();

  const enabled = formData.get("enabled") === "on";
  const model = String(formData.get("model") ?? "").trim();
  const voice = String(formData.get("voice") ?? "").trim();
  const maxMinutesPerSession = Number(
    formData.get("maxMinutesPerSession") ?? "5",
  );
  const maxMinutesPerDay = Number(formData.get("maxMinutesPerDay") ?? "60");
  const visionEnabled = formData.get("visionEnabled") === "on";
  const allowedTools = formData.getAll("allowedTools").map(String);

  if (!(VOICE_MODELS as readonly string[]).includes(model)) {
    return { ok: false, error: "Ugyldig model" };
  }
  if (!(VOICE_VOICES as readonly string[]).includes(voice)) {
    return { ok: false, error: "Ugyldig voice" };
  }
  if (
    !Number.isFinite(maxMinutesPerSession) ||
    maxMinutesPerSession < 1 ||
    maxMinutesPerSession > 60
  ) {
    return {
      ok: false,
      error: "Session-cap skal være mellem 1 og 60 minutter",
    };
  }
  if (
    !Number.isFinite(maxMinutesPerDay) ||
    maxMinutesPerDay < 1 ||
    maxMinutesPerDay > 10000
  ) {
    return { ok: false, error: "Daglig cap skal være 1-10000 min" };
  }

  // Sanitize allowedTools mod CUSTOMER_TOOL_ALLOWLIST (typed-array-cast)
  const customerSet = new Set<string>(CUSTOMER_TOOL_ALLOWLIST);
  const sanitizedTools = allowedTools.filter((t) => customerSet.has(t));

  await prisma.integrationSettings.upsert({
    where: { id: 1 },
    update: {
      voiceShopEnabled: enabled,
      voiceShopModel: model,
      voiceShopVoice: voice,
      voiceShopAllowedToolsJson:
        sanitizedTools.length > 0 ? JSON.stringify(sanitizedTools) : null,
      voiceShopMaxMinutesPerSession: maxMinutesPerSession,
      voiceShopMaxMinutesPerDay: maxMinutesPerDay,
      voiceShopVisionEnabled: visionEnabled,
    },
    create: {
      id: 1,
      voiceShopEnabled: enabled,
      voiceShopModel: model,
      voiceShopVoice: voice,
      voiceShopAllowedToolsJson:
        sanitizedTools.length > 0 ? JSON.stringify(sanitizedTools) : null,
      voiceShopMaxMinutesPerSession: maxMinutesPerSession,
      voiceShopMaxMinutesPerDay: maxMinutesPerDay,
      voiceShopVisionEnabled: visionEnabled,
    },
  });

  invalidateVoiceShopCache();
  revalidatePath("/admin/integrations");
  return { ok: true };
}

/**
 * Validér at en voice-session kan mintet med nuværende settings. Returnerer
 * latency + diagnostics uden faktisk at åbne en WS (vi mint'er bare en token
 * og lukker den med det samme). Catcher: invalid API key, allowedTools tom,
 * cap-fejl.
 */
export async function testVoiceShopAction(): Promise<
  | { ok: true; latencyMs: number; effectiveTools: number; model: string }
  | { ok: false; error: string }
> {
  await requireAdmin();

  const s = await getVoiceShopSettings();
  if (!s.enabled) {
    return { ok: false, error: "Voice shop er ikke aktiveret." };
  }
  if (!s.apiKey) {
    return {
      ok: false,
      error: "Mangler Google Gemini API-nøgle. Gem den ovenfor først.",
    };
  }

  const { buildVoiceShopTools } = await import("@/lib/voice/tools");
  const { GoogleGenAI } = await import("@google/genai");
  const { getBrand } = await import("@/lib/brand");
  const { buildVoiceShopPrompt } = await import("@/lib/voice/prompts");

  const bundle = buildVoiceShopTools(s.allowedTools);
  if (bundle.effectiveTools.length === 0) {
    return {
      ok: false,
      error:
        "Ingen voice-tools tilgængelige — vælg mindst ét tool i listen.",
    };
  }

  const brand = await getBrand();
  const systemPrompt = buildVoiceShopPrompt(brand);

  const start = Date.now();
  try {
    const ai = new GoogleGenAI({ apiKey: s.apiKey });
    const expireTime = new Date(Date.now() + 60 * 1000).toISOString();
    const newSessionExpireTime = new Date(Date.now() + 60 * 1000).toISOString();

    await (
      ai as unknown as {
        authTokens: {
          create: (input: {
            config: Record<string, unknown>;
          }) => Promise<{ name: string }>;
        };
      }
    ).authTokens.create({
      config: {
        uses: 1,
        expireTime,
        newSessionExpireTime,
        httpOptions: { apiVersion: "v1alpha" },
        liveConnectConstraints: {
          model: `models/${s.model}`,
          config: {
            responseModalities: ["AUDIO"],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            tools: bundle.geminiTools,
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: s.voice } },
            },
          },
        },
        lockAdditionalFields: [
          "tools",
          "systemInstruction",
          "responseModalities",
        ],
      },
    });
    return {
      ok: true,
      latencyMs: Date.now() - start,
      effectiveTools: bundle.effectiveTools.length,
      model: s.model,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Test-mint fejlede",
    };
  }
}
