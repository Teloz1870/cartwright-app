import "server-only";

import { getBrand } from "@/lib/brand";
import { getSetupStatus } from "@/lib/setup-status";

/**
 * Local-AI plan Fase 2.2: copilot context-injection.
 *
 * Bygger en kompakt one-line-ish state-snapshot der prependes til
 * OPERATOR_SYSTEM_PROMPT så admin copilot ved hvad der mangler/er aktivt
 * uden at skulle kalde tools for at finde ud af det.
 *
 * Format design-choice: tæt, parseable men menneske-læsbar. Max ~500 tokens
 * så det også fits i Gemma 3 4B's budget efter tool-schemas er injiceret.
 *
 * Eksempel output:
 *   [SETUP-STATE]
 *   domain: dit-domæne.dk · sender: orders@dit-domæne.dk · inbox: cloudflare
 *   setup: 9/12 ok · mangler: stripe-keys, email-dns-verified
 *   provider: local · gemma4:e4b
 *   [/SETUP-STATE]
 */

export async function buildSetupContext(): Promise<string> {
  const [brandData, setup] = await Promise.all([getBrand(), getSetupStatus()]);

  const missingItems = setup.items
    .filter((item) => item.status === "missing")
    .map((item) => item.id);

  const warningItems = setup.items
    .filter((item) => item.status === "warning")
    .map((item) => item.id);

  const lines: string[] = ["[SETUP-STATE]"];

  // Brand essentials
  const brandFacts = [
    brandData.domain && brandData.domain !== "example.com"
      ? `domain: ${brandData.domain}`
      : null,
    brandData.emails.from && brandData.emails.from !== "noreply@example.com"
      ? `sender: ${brandData.emails.from}`
      : null,
    brandData.inboxVendor ? `inbox: ${brandData.inboxVendor}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  if (brandFacts) lines.push(brandFacts);

  // Setup status snapshot
  lines.push(
    `setup: ${setup.okCount}/${setup.totalRequired} ok` +
      (missingItems.length > 0
        ? ` · mangler: ${missingItems.slice(0, 8).join(", ")}${missingItems.length > 8 ? ` (+${missingItems.length - 8})` : ""}`
        : ""),
  );

  if (warningItems.length > 0) {
    lines.push(
      `warnings: ${warningItems.slice(0, 5).join(", ")}${warningItems.length > 5 ? ` (+${warningItems.length - 5})` : ""}`,
    );
  }

  lines.push("[/SETUP-STATE]");
  return lines.join("\n");
}

/**
 * Returnér hint-strings til "suggested first message"-chips i AdminChatPanel.
 * Tilpasses ud fra hvad der mangler — hvis email-DNS er ok, vis ikke "hvorfor
 * er emails i spam".
 */
export type SuggestedPrompt = {
  id: string;
  label: string;
  prompt: string;
};

export async function getSuggestedFirstMessages(): Promise<SuggestedPrompt[]> {
  const setup = await getSetupStatus();
  const missingIds = new Set(
    setup.items.filter((i) => i.status === "missing").map((i) => i.id),
  );

  const out: SuggestedPrompt[] = [];

  // "Hvad mangler jeg?" — altid relevant hvis noget mangler
  if (setup.hasMissing) {
    out.push({
      id: "what-missing",
      label: "Hvad mangler i mit setup?",
      prompt: "Hvad mangler jeg at konfigurere i min Cartwright shop? Giv mig en prioriteret liste.",
    });
  }

  // "Hvorfor er emails i spam?" — kun hvis email faktisk er sat op men der
  // er DNS-warnings
  if (
    missingIds.has("email-dns-verified") ||
    missingIds.has("email-inbox-configured")
  ) {
    out.push({
      id: "email-spam",
      label: "Hvorfor lander mine emails i spam?",
      prompt:
        "Mine kvitterings-emails ender i spam-mappen. Hvilke DNS-records skal jeg tjekke?",
    });
  }

  // Setup-verifikation
  out.push({
    id: "verify-setup",
    label: "Verificér mit setup",
    prompt: "Kør en hurtig health-check af min shop og fortæl mig hvad jeg skal vide.",
  });

  // Next-step suggestion
  out.push({
    id: "next-step",
    label: "Foreslå næste skridt",
    prompt:
      "Hvad er det vigtigste jeg burde gøre lige nu for at gøre min shop klar til kunder?",
  });

  return out;
}
