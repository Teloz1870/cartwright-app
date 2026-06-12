import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  titleCase,
  patchBrandConfigContent,
  patchBrandConfigForTemplate,
  patchBrandConfigForEnglishFirst,
  patchBrandConfigForFirstRunWelcome,
  patchBrandConfigGithubUrl,
  patchBrandConfigDesignSlug,
  patchWebsiteCopyForScaffold,
  patchSeedSetupComplete,
  patchFooterContent,
  patchFooterGithubUrlGate,
  patchMessagesCartwrightCopy,
  patchAIStylistButtonContent,
  patchHeroVideoContent,
  patchCatalogFiltersContent,
  patchProxyContent,
  migratePrismaConfig,
  patchEnvLocal,
  isTemplateSlug,
  TEMPLATE_SLUGS,
  TEMPLATE_DEFAULTS,
  patchLogoForScaffold,
  patchHeroImagesForScaffold,
} from "./scaffold";

describe("patchEnvLocal", () => {
  it("writes AUTH_SECRET into .env.local and mirrors DATABASE_URL into .env for Prisma", () => {
    const dir = mkdtempSync(join(tmpdir(), "cw-env-"));
    try {
      writeFileSync(
        join(dir, ".env.example"),
        `DATABASE_URL="file:./dev.db"\nAUTH_SECRET=changeme\nANTHROPIC_API_KEY=\n`,
      );

      patchEnvLocal(dir, "deadbeef");

      const local = readFileSync(join(dir, ".env.local"), "utf8");
      expect(local).toContain(`AUTH_SECRET="deadbeef"`);
      expect(local).toContain(`DATABASE_URL="file:./dev.db"`);

      // Regression: Prisma CLI only reads .env, so DATABASE_URL must be there too.
      expect(existsSync(join(dir, ".env"))).toBe(true);
      const env = readFileSync(join(dir, ".env"), "utf8");
      expect(env).toContain(`DATABASE_URL="file:./dev.db"`);
      expect(env).not.toContain("AUTH_SECRET");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("scaffold helpers", () => {
  it("titleCase laver projektnavn til storeName", () => {
    expect(titleCase("nord-kaffe")).toBe("Nord Kaffe");
  });

  it("patchBrandConfigContent erstatter storeName og storeSlug", () => {
    const input = `{ storeName: "Demo", storeSlug: "demo" }`;
    const out = patchBrandConfigContent(input, "min-shop");
    expect(out).toContain(`storeName: "Min Shop"`);
    expect(out).toContain(`storeSlug: "min-shop"`);
  });

  it("patchBrandConfigContent fjerner Teloz-identitet (domain, url, emails, SEO)", () => {
    const input = [
      `  storeName: "Teloz",`,
      `  storeSlug: "teloz",`,
      `  domain: "teloz.net",`,
      `  url: "https://teloz.net",`,
      `  emails: {`,
      `    from: "noreply@teloz.net",`,
      `    fromName: "Teloz",`,
      `    support: "support@teloz.net",`,
      `    admin: "admin@teloz.net",`,
      `  },`,
      `  metadata: {`,
      `    title: "Teloz Agency",`,
      `    description:`,
      `      "Vi bygger lynhurtige AI og e-commerce løsninger.",`,
      `  },`,
    ].join("\n");
    const out = patchBrandConfigContent(input, "hegn-og-laage");

    // No origin-brand leakage anywhere
    expect(out).not.toContain("teloz.net");
    expect(out).not.toContain("Teloz Agency");
    // Customer identity applied
    expect(out).toContain(`title: "Hegn Og Laage"`);
    expect(out).toContain(`fromName: "Hegn Og Laage"`);
    expect(out).toContain(`admin: "admin@example.com"`);
    expect(out).toContain(`domain: "example.com"`);
    expect(out).toContain(`url: "https://example.com"`);
    // The Teloz tagline must be gone from metadata.description
    expect(out).not.toContain("lynhurtige AI");
    // legalName / disclaimer "Teloz ApS" → store name
    expect(out).not.toContain("Teloz ApS");
  });
});

describe("patchFooterContent", () => {
  const FOOTER = [
    `<p>© {brand.footer.copyrightYear} {brand.storeName}</p>`,
    `<p>`,
    `  Ejet og drevet af{" "}`,
    `  <a href="https://teloz.net" target="_blank" rel="noopener noreferrer" className="font-bold">`,
    `    Teloz ApS`,
    `  </a>`,
    `</p>`,
    `<p>`,
    `  <a href="https://github.com/Teloz1870" target="_blank" rel="noopener noreferrer" className="font-bold">`,
    `    <svg className="h-4 w-4"><path d="M12 2C6" /></svg>`,
    `    GitHub Profile`,
    `  </a>`,
    `</p>`,
  ].join("\n");

  it("removes the personal GitHub link and rebrands the operated-by line", () => {
    const out = patchFooterContent(FOOTER, "Mit Hegn");
    expect(out).not.toContain("Teloz ApS");
    expect(out).not.toContain("teloz.net");
    expect(out).not.toContain("github.com/Teloz1870");
    expect(out).not.toContain("GitHub Profile");
    // Customer identity present, surrounding markup intact
    expect(out).toContain("Ejet og drevet af");
    expect(out).toContain("Mit Hegn");
    expect(out).toContain("https://example.com");
  });
});

// ── First-impression patches (English-first + first-run welcome) ───────────
// Fixtures mirror the exact field shapes in the v0.35.1 template's
// brand.config.ts / prisma/seed.ts (verified against cartwright-private).

const I18N_FRAGMENT = [
  `  locales: ["da", "en"] as const,`,
  `  defaultLocale: "da",`,
  `  tagline: "AI & Modern Commerce Agency",`,
  `  footer: {`,
  `    tagline:`,
  `      "Bygget med Cartwright Engine — en AI-drevet platform til moderne e-commerce og SaaS.",`,
  `    disclaimer: "Teloz ApS · CVR: Indsæt CVR · Alle rettigheder forbeholdes.",`,
  `    copyrightYear: 2026,`,
  `  },`,
].join("\n");

describe("patchBrandConfigForEnglishFirst", () => {
  it("flips locales to en-only, defaultLocale to en, footer copy to English", () => {
    const { src, warnings } = patchBrandConfigForEnglishFirst(I18N_FRAGMENT, "Mit Hegn");
    expect(warnings).toEqual([]);
    expect(src).toContain(`locales: ["en"] as const,`);
    expect(src).toContain(`defaultLocale: "en",`);
    expect(src).toContain("Built with the Cartwright Engine");
    expect(src).not.toContain("Bygget med Cartwright Engine");
    expect(src).toContain(`disclaimer: "Mit Hegn · All rights reserved.",`);
    expect(src).not.toContain("Alle rettigheder forbeholdes");
    // brand.tagline (root) untouched — only footer.tagline is targeted
    expect(src).toContain(`tagline: "AI & Modern Commerce Agency",`);
    expect(src).toContain("copyrightYear: 2026");
  });

  it("a store name containing $ is inserted literally (no regex-pattern mishap)", () => {
    const { src } = patchBrandConfigForEnglishFirst(I18N_FRAGMENT, "Bob$ Burgers");
    expect(src).toContain(`disclaimer: "Bob$ Burgers · All rights reserved.",`);
  });

  it("warns (per anchor) without crashing on drifted template text", () => {
    const drifted = `  someOtherField: true,\n  defaultLanguage: "da",\n`;
    const { src, warnings } = patchBrandConfigForEnglishFirst(drifted, "Shop");
    expect(src).toBe(drifted); // untouched
    expect(warnings).toHaveLength(4); // locales, defaultLocale, tagline, disclaimer
    for (const w of warnings) expect(w).toContain("skipped");
  });
});

const WEBSITE_COPY_FRAGMENT = [
  `  website: {`,
  `    eyebrow: "v0.6 launch" as string,`,
  `    headline: "Ship software that ships itself" as string,`,
  `    headlineAccent: "" as string,`,
  `    tagline:`,
  `      "A studio template built on Cartwright — the AI-first commerce + site engine." as string,`,
  `    valuePropsTitle: "Three promises. No asterisks." as string,`,
  `    valueProps: [`,
  `      { title: "Yours, forever", body: "Not a SaaS. Not a fork." },`,
  `    ],`,
  `  },`,
].join("\n");

describe("patchWebsiteCopyForScaffold", () => {
  it("clears the stale eyebrow and welcomes the customer's store by name", () => {
    const { src, warnings } = patchWebsiteCopyForScaffold(WEBSITE_COPY_FRAGMENT, "Nord Kaffe");
    expect(warnings).toEqual([]);
    expect(src).toContain(`eyebrow: "" as string,`);
    expect(src).toContain(`headline: "Welcome to Nord Kaffe" as string,`);
    expect(src).toContain(`"A fast, AI-ready site — make it say anything you want." as string,`);
    expect(src).not.toContain("Ship software that ships itself");
    expect(src).not.toContain("A studio template built on Cartwright");
  });

  it("does NOT touch valueProps/features/steps arrays", () => {
    const { src } = patchWebsiteCopyForScaffold(WEBSITE_COPY_FRAGMENT, "Nord Kaffe");
    expect(src).toContain(`valuePropsTitle: "Three promises. No asterisks." as string,`);
    expect(src).toContain(`{ title: "Yours, forever", body: "Not a SaaS. Not a fork." },`);
  });

  it("warns (per anchor) without crashing when the copy already changed", () => {
    const drifted = `  website: {\n    eyebrow: "" as string,\n    headline: "My own headline" as string,\n  },\n`;
    const { src, warnings } = patchWebsiteCopyForScaffold(drifted, "Shop");
    expect(src).toBe(drifted);
    expect(warnings).toHaveLength(3); // eyebrow, headline, tagline
    for (const w of warnings) expect(w).toContain("skipped");
  });
});

describe("patchSeedSetupComplete", () => {
  it("flips setupComplete: true → false (arms wizard + welcome canvas)", () => {
    const seed = [
      `    create: {`,
      `      id: 1,`,
      `      storeName: brand.storeName,`,
      `      // Solbrillen.dk har data fra før wizard-gate — markér setupComplete=true`,
      `      setupComplete: true,`,
      `    },`,
    ].join("\n");
    const { src, warnings } = patchSeedSetupComplete(seed);
    expect(warnings).toEqual([]);
    expect(src).toContain("setupComplete: false,");
    expect(src).not.toContain("setupComplete: true,");
    // surrounding seed code untouched
    expect(src).toContain("storeName: brand.storeName,");
  });

  it("is anchored — does not touch other *Complete fields or strings", () => {
    const seed = `      onboardingComplete: true,\n      setupComplete: true,\n`;
    const { src } = patchSeedSetupComplete(seed);
    expect(src).toContain("onboardingComplete: true,");
    expect(src).toContain("setupComplete: false,");
  });

  it("warns without crashing when the seed no longer sets setupComplete: true", () => {
    const drifted = `      setupComplete: false,\n`;
    const { src, warnings } = patchSeedSetupComplete(drifted);
    expect(src).toBe(drifted);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("skipped");
  });
});

describe("patchBrandConfigForFirstRunWelcome", () => {
  it("flips firstRunWelcome: false → true on templates that ship the flag", () => {
    const input = `    welcomeGuide: true,\n    firstRunWelcome: false,\n    blog: false,\n`;
    const { src, warnings } = patchBrandConfigForFirstRunWelcome(input);
    expect(warnings).toEqual([]);
    expect(src).toContain("firstRunWelcome: true,");
    // neighbours untouched
    expect(src).toContain("welcomeGuide: true,");
    expect(src).toContain("blog: false,");
  });

  it("is idempotent when the flag is already true", () => {
    const input = `    firstRunWelcome: true,\n`;
    const { src, warnings } = patchBrandConfigForFirstRunWelcome(input);
    expect(src).toBe(input);
    expect(warnings).toEqual([]);
  });

  it("CROSS-PR COMPAT: warns + skips when the flag does not exist (template ≤ v0.35.1)", () => {
    const v0351 = `    welcomeGuide: true,\n    blog: false,\n`;
    const { src, warnings } = patchBrandConfigForFirstRunWelcome(v0351);
    expect(src).toBe(v0351); // byte-identical — never invents the key
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("firstRunWelcome flag not found");
  });
});

describe("patchBrandConfigGithubUrl", () => {
  it("neutralizes the Teloz default URL to \"\" (keeps the cast + neighbours)", () => {
    const input = [
      `    ownerUrl: "https://example.com" as string,`,
      `    /** GitHub-profil-link i footerens bottom-row. */`,
      `    githubUrl: "https://github.com/Teloz1870" as string,`,
    ].join("\n");
    const { src, warnings } = patchBrandConfigGithubUrl(input);
    expect(warnings).toEqual([]);
    expect(src).toContain(`githubUrl: "" as string,`);
    expect(src).not.toContain("github.com/Teloz1870");
    expect(src).toContain(`ownerUrl: "https://example.com" as string,`);
  });

  it("is a silent no-op when the field already holds a non-Teloz value", () => {
    const input = `    githubUrl: "https://github.com/my-shop" as string,\n`;
    const { src, warnings } = patchBrandConfigGithubUrl(input);
    expect(src).toBe(input);
    expect(warnings).toEqual([]);
  });

  it("CROSS-TEMPLATE COMPAT: warns + skips when the field does not exist (pre-v0.36.0)", () => {
    const v0350 = `    ownerUrl: "https://example.com" as string,\n`;
    const { src, warnings } = patchBrandConfigGithubUrl(v0350);
    expect(src).toBe(v0350); // byte-identical — never invents the key
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("githubUrl not found");
  });
});

describe("patchBrandConfigDesignSlug (--look)", () => {
  it("sets the look's skin on the template's undefined designSlug (keeps the cast + neighbours)", () => {
    const input = [
      `  industryTemplate: "saas",`,
      `  designSlug: undefined as string | undefined,`,
      `  mode: "website" as "website" | "webshop" | "agent-marketplace",`,
    ].join("\n");
    const { src, warnings } = patchBrandConfigDesignSlug(input, "fable");
    expect(warnings).toEqual([]);
    expect(src).toContain(`designSlug: "fable" as string | undefined,`);
    // neighbours untouched
    expect(src).toContain(`industryTemplate: "saas",`);
    expect(src).toContain(`mode: "website" as "website" | "webshop" | "agent-marketplace",`);
  });

  it("overwrites a previously-set quoted slug (idempotent re-apply)", () => {
    const input = `  designSlug: "engineered" as string | undefined,\n`;
    const { src, warnings } = patchBrandConfigDesignSlug(input, "fable");
    expect(warnings).toEqual([]);
    expect(src).toContain(`designSlug: "fable" as string | undefined,`);
    expect(src).not.toContain("engineered");

    // Re-applying the same skin is a no-op.
    const again = patchBrandConfigDesignSlug(src, "fable");
    expect(again.src).toBe(src);
    expect(again.warnings).toEqual([]);
  });

  it("warns + skips on template drift (no designSlug anchor)", () => {
    const drifted = `  industryTemplate: "saas",\n  mode: "website",\n`;
    const { src, warnings } = patchBrandConfigDesignSlug(drifted, "fable");
    expect(src).toBe(drifted); // byte-identical — never invents the key
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("designSlug anchor not found");
  });
});

const FOOTER_GITHUB_FRAGMENT = [
  `            <p>`,
  `              <a href={brand.footer.githubUrl} target="_blank" rel="noopener noreferrer" className="font-bold">`,
  `                <svg className="h-4 w-4" aria-hidden="true">`,
  `                  <path d="M12 2C6.477 2" />`,
  `                </svg>`,
  `                GitHub Profile`,
  `              </a>`,
  `            </p>`,
].join("\n");

describe("patchFooterGithubUrlGate", () => {
  it("wraps the GitHub block in a {brand.footer.githubUrl && (…)} gate", () => {
    const { src, warnings } = patchFooterGithubUrlGate(`\n${FOOTER_GITHUB_FRAGMENT}\n`);
    expect(warnings).toEqual([]);
    expect(src).toContain("{brand.footer.githubUrl && (");
    // The whole original block survives inside the gate, closed after </p>
    expect(src).toMatch(/\{brand\.footer\.githubUrl && \(\s*\n\s*<p>[\s\S]*GitHub Profile[\s\S]*<\/p>\s*\n\s*\)\}/);
  });

  it("produces balanced JSX (one opening gate, one closing)", () => {
    const { src } = patchFooterGithubUrlGate(`\n${FOOTER_GITHUB_FRAGMENT}\n`);
    expect(src.split("{brand.footer.githubUrl && (")).toHaveLength(2);
    expect(src.split(")}")).toHaveLength(2);
  });

  it("warns + skips on pre-v0.36.0 templates (hardcoded href, no config anchor)", () => {
    const legacy = `<p>\n  <a href="https://github.com/Teloz1870">GitHub</a>\n</p>\n`;
    const { src, warnings } = patchFooterGithubUrlGate(legacy);
    expect(src).toBe(legacy);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("anchor not found");
  });
});

describe("patchMessagesCartwrightCopy", () => {
  const EN_TELOZ =
    "Just like in the crypto world, where you have full control of your wallet without a middleman, Cartwright gives you true ownership of your site. We don't believe you should pay monthly licenses for a basic system. At Teloz, you only pay for our time to set up, design and tailor the platform.";
  const DA_TELOZ =
    "Ligesom i krypto-verdenen, hvor du har fuld kontrol over din wallet uden en tredjemand, giver Cartwright dig ægte ejerskab over dit site. Vi mener ikke, du skal betale månedlige licenser for et basis-system. Hos Teloz betaler du udelukkende for vores tid til at opsætte, designe og skræddersy platformen.";

  it("replaces the English Teloz agency paragraph with a neutral product-true one", () => {
    const input = `{\n  "SaaSHome": {\n    "cartwrightDesc2": ${JSON.stringify(EN_TELOZ)}\n  }\n}\n`;
    const { src, warnings } = patchMessagesCartwrightCopy(input);
    expect(warnings).toEqual([]);
    expect(src).not.toContain("Teloz");
    expect(src).toContain("you own the code and pay no platform license");
    expect(() => JSON.parse(src)).not.toThrow(); // still valid JSON
  });

  it("replaces the Danish twin in da.json", () => {
    const input = `{\n  "SaaSHome": {\n    "cartwrightDesc2": ${JSON.stringify(DA_TELOZ)}\n  }\n}\n`;
    const { src, warnings } = patchMessagesCartwrightCopy(input);
    expect(warnings).toEqual([]);
    expect(src).not.toContain("Teloz");
    expect(src).toContain("du ejer koden og betaler ingen platformslicens");
    expect(() => JSON.parse(src)).not.toThrow();
  });

  it("warns + skips when the paragraph drifted or was removed upstream", () => {
    const drifted = `{\n  "SaaSHome": {\n    "cartwrightDesc2": "Own your stack."\n  }\n}\n`;
    const { src, warnings } = patchMessagesCartwrightCopy(drifted);
    expect(src).toBe(drifted);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("skipped");
  });
});

describe("patchAIStylistButtonContent", () => {
  const BUTTON_FRAGMENT = [
    `  const label = ecommerceEnabled ? brand.ai.assistantLabel : "AI Konsulent";`,
    `  const openText = ecommerceEnabled ? brand.ai.assistantOpenText : "Spørg AI Konsulenten";`,
    `  const cls = ecommerceEnabled ? "bg-sol-accent" : "bg-[#1E1B4B]";`,
  ].join("\n");

  it("routes both texts through brand.ai.* (no Danish website-mode fallback)", () => {
    const { src, warnings } = patchAIStylistButtonContent(BUTTON_FRAGMENT);
    expect(warnings).toEqual([]);
    expect(src).toContain(`const label = brand.ai.assistantLabel;`);
    expect(src).toContain(`const openText = brand.ai.assistantOpenText;`);
    expect(src).not.toContain("Konsulent");
    // ecommerceEnabled stays in use elsewhere (className ternary) — build-safe
    expect(src).toContain(`const cls = ecommerceEnabled ? "bg-sol-accent" : "bg-[#1E1B4B]";`);
  });

  it("warns (per anchor) without crashing on drifted template text", () => {
    const drifted = `  const label = brand.ai.assistantLabel;\n`;
    const { src, warnings } = patchAIStylistButtonContent(drifted);
    expect(src).toBe(drifted);
    expect(warnings).toHaveLength(2); // label, openText
    for (const w of warnings) expect(w).toContain("skipped");
  });
});

// ── Footer ↔ brand-config interaction across template generations ──────────
// The engine "first impression" PR moves the footer owner line into config
// fields (brand.legalName + brand.footer.ownerUrl) rendered via i18n. Both
// generations must come out de-Telozified, fail-soft both ways.
describe("footer owner line — current vs future template", () => {
  it("FUTURE template: config fields are de-Telozified by patchBrandConfigContent", () => {
    const futureConfig = [
      `  contact: {`,
      `    legalName: "Teloz ApS" as string,`,
      `  },`,
      `  footer: {`,
      `    ownerUrl: "https://teloz.net",`,
      `    copyrightYear: 2026,`,
      `  },`,
    ].join("\n");
    const out = patchBrandConfigContent(futureConfig, "mit-hegn");
    expect(out).toContain(`legalName: "Mit Hegn" as string,`);
    expect(out).toContain(`ownerUrl: "https://example.com",`);
    expect(out).not.toContain("Teloz");
  });

  it("FUTURE template: patchFooterContent silently no-ops on a config-driven Footer.tsx", () => {
    const futureFooter = [
      `<p>`,
      `  {t("ownedBy")}{" "}`,
      `  <a href={brand.footer.ownerUrl}>{brand.legalName}</a>`,
      `</p>`,
    ].join("\n");
    // no crash, no change — the brand-config patch owns the identity now
    expect(patchFooterContent(futureFooter, "Mit Hegn")).toBe(futureFooter);
  });
});

// Sample brand.config.ts fragments that mirror the actual shape produced
// by cartwright-private after Phase 4. Keeping these here (vs. importing
// the real file) lets the CLI tests stay independent of the template repo.
const BRAND_FRAGMENT = `
  industryTemplate: "saas",
  mode: "website" as "website" | "webshop" | "agent-marketplace",
  ecommerceEnabled: false,
  features: {
    webshop: false,
    acp: false,
    a2a: false,
    adminAgenticDashboard: false,
    tryOn: false,
    aiStylist: true,
  },
`;

describe("isTemplateSlug", () => {
  for (const slug of TEMPLATE_SLUGS) {
    it(`recognises "${slug}"`, () => {
      expect(isTemplateSlug(slug)).toBe(true);
    });
  }

  it("rejects unknown slugs", () => {
    expect(isTemplateSlug("not-a-template")).toBe(false);
    expect(isTemplateSlug("")).toBe(false);
    expect(isTemplateSlug(undefined)).toBe(false);
    expect(isTemplateSlug(42)).toBe(false);
  });
});

describe("patchBrandConfigForTemplate", () => {
  it("agent-marketplace flips A2A+ACP+dashboard on, webshop off", () => {
    const out = patchBrandConfigForTemplate(BRAND_FRAGMENT, "agent-marketplace");
    expect(out).toContain(`industryTemplate: "agent-marketplace"`);
    expect(out).toContain(`mode: "agent-marketplace"`);
    expect(out).toContain(`webshop: false`);
    expect(out).toContain(`acp: true`);
    expect(out).toContain(`a2a: true`);
    expect(out).toContain(`adminAgenticDashboard: true`);
  });

  it("coffee flips webshop on, A2A off, ecommerceEnabled tracks webshop", () => {
    const out = patchBrandConfigForTemplate(BRAND_FRAGMENT, "coffee");
    expect(out).toContain(`industryTemplate: "coffee"`);
    expect(out).toContain(`mode: "webshop"`);
    expect(out).toContain(`webshop: true`);
    expect(out).toContain(`a2a: false`);
    // #5 regression: webshop mode must enable ecommerce, not leave it false.
    expect(out).toContain(`ecommerceEnabled: true`);
  });

  it("sunglasses → webshop mode, legacy template name in industryTemplate", () => {
    const out = patchBrandConfigForTemplate(BRAND_FRAGMENT, "sunglasses");
    expect(out).toContain(`industryTemplate: "sunglasses"`);
    expect(out).toContain(`mode: "webshop"`);
    expect(out).toContain(`webshop: true`);
  });

  it("website-corporate → website mode, all A2A/webshop off", () => {
    const out = patchBrandConfigForTemplate(BRAND_FRAGMENT, "website-corporate");
    expect(out).toContain(`industryTemplate: "website-corporate"`);
    expect(out).toContain(`mode: "website"`);
    expect(out).toContain(`webshop: false`);
    expect(out).toContain(`a2a: false`);
    expect(out).toContain(`adminAgenticDashboard: false`);
    // website mode must keep ecommerce off
    expect(out).toContain(`ecommerceEnabled: false`);
  });

  it("generic preserves webshop mode with no A2A flags on", () => {
    const out = patchBrandConfigForTemplate(BRAND_FRAGMENT, "generic");
    expect(out).toContain(`industryTemplate: "generic"`);
    expect(out).toContain(`mode: "webshop"`);
    expect(out).toContain(`webshop: true`);
    expect(out).toContain(`a2a: false`);
    // #5 regression: the default generic scaffold must be a real webshop.
    expect(out).toContain(`ecommerceEnabled: true`);
    // #15 regression: industryTemplate must be union-cast, not a bare literal,
    // or `brand.industryTemplate === "saas"` comparisons fail `next build`.
    expect(out).toMatch(
      /industryTemplate: "generic" as "saas" \| "coffee" \| .*"agent-marketplace"/,
    );
  });

  it("does not touch unrelated feature flags (tryOn, aiStylist)", () => {
    const out = patchBrandConfigForTemplate(BRAND_FRAGMENT, "coffee");
    expect(out).toContain(`tryOn: false`);
    expect(out).toContain(`aiStylist: true`);
  });
});

describe("TEMPLATE_DEFAULTS — invariants", () => {
  it("every template has all four mode-features defined", () => {
    for (const slug of TEMPLATE_SLUGS) {
      const d = TEMPLATE_DEFAULTS[slug];
      expect(typeof d.features.webshop).toBe("boolean");
      expect(typeof d.features.acp).toBe("boolean");
      expect(typeof d.features.a2a).toBe("boolean");
      expect(typeof d.features.adminAgenticDashboard).toBe("boolean");
    }
  });

  it("agent-marketplace is the only template that turns a2a on", () => {
    for (const slug of TEMPLATE_SLUGS) {
      const a2aOn = TEMPLATE_DEFAULTS[slug].features.a2a;
      if (slug === "agent-marketplace") {
        expect(a2aOn).toBe(true);
      } else {
        expect(a2aOn).toBe(false);
      }
    }
  });
});

describe("patchHeroVideoContent", () => {
  it("removes the missing hero-video <source> tags, keeps the video element", () => {
    const input = [
      `<video poster="/hero/hero-poster-v4.jpg" onCanPlay={handleCanPlay}>`,
      `  <source src="/hero/hero-v4.webm" type="video/webm" />`,
      `  <source src="/hero/hero-v4.mp4" type="video/mp4" />`,
      `</video>`,
    ].join("\n");
    const out = patchHeroVideoContent(input);
    expect(out).not.toContain("hero-v4.webm");
    expect(out).not.toContain("hero-v4.mp4");
    expect(out).not.toContain("<source");
    expect(out).toContain("<video");
    expect(out).toContain("handleCanPlay");
  });
});

describe("patchCatalogFiltersContent", () => {
  it("wraps Frame/Lens colour filters in a length guard", () => {
    const input = [
      `{/* Frame color */}`,
      `<div>`,
      `  <label>Frame color</label>`,
      `  <select>{frameColors.map((fc) => fc)}</select>`,
      `</div>`,
      ``,
      `{/* Lens color */}`,
      `<div>`,
      `  <label>Lens color</label>`,
      `  <select>{lensColors.map((lc) => lc)}</select>`,
      `</div>`,
      ``,
      `{/* Price range */}`,
    ].join("\n");
    const out = patchCatalogFiltersContent(input);
    expect(out).toContain("frameColors.length > 0 &&");
    expect(out).toContain("lensColors.length > 0 &&");
    // vars still referenced (build-safe)
    expect(out).toContain("frameColors.map");
    expect(out).toContain("lensColors.map");
    // balanced parens added
    expect((out.match(/&& \(/g) || []).length).toBe(2);
  });
});

describe("patchProxyContent", () => {
  it("adds icon to the matcher exclusion so /icon is not locale-redirected", () => {
    const input = `export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\\\..*|hero).*)'] };`;
    const out = patchProxyContent(input);
    expect(out).toContain("favicon.ico|icon|");
    // idempotent
    expect(patchProxyContent(out)).toBe(out);
  });
});

describe("migratePrismaConfig", () => {
  it("writes prisma.config.ts and removes package.json#prisma", () => {
    const dir = mkdtempSync(join(tmpdir(), "cw-prisma-"));
    try {
      writeFileSync(
        join(dir, "package.json"),
        JSON.stringify({ name: "x", prisma: { seed: "ts-node prisma/seed.ts" } }, null, 2),
      );
      migratePrismaConfig(dir);
      const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
      expect(pkg.prisma).toBeUndefined();
      const cfg = readFileSync(join(dir, "prisma.config.ts"), "utf8");
      expect(cfg).toContain('from "prisma/config"');
      expect(cfg).toContain("ts-node prisma/seed.ts");
      expect(cfg).toContain('loadEnv({ path: ".env.local" })');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("is a no-op when there is no package.json#prisma key", () => {
    const dir = mkdtempSync(join(tmpdir(), "cw-prisma2-"));
    try {
      writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "x" }));
      migratePrismaConfig(dir);
      expect(existsSync(join(dir, "prisma.config.ts"))).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("patchLogoForScaffold", () => {
  const template = `  logo: {
    markViewBox: "0 0 24 24",
    markPaths: [
      "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
    ],
    faviconBg: "#1e3f5a",
    faviconFg: "#f4efe6",
  },`;

  it("swaps the Teloz layers mark for the Cartwright wheel + neutral favicon", () => {
    const { src, warnings } = patchLogoForScaffold(template);
    expect(warnings).toEqual([]);
    expect(src).not.toContain("M12 2L2 7l10 5");
    expect(src).toContain("M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z");
    expect(src).toContain("M12 10.5a1.5 1.5 0 1 0 0 3");
    expect(src).toContain('faviconBg: "#18181b"');
    expect(src).toContain('faviconFg: "#fafafa"');
  });

  it("warns without clobbering when the mark has drifted (customer customized)", () => {
    const customized = template.replace("M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5", "M1 1h22v22H1z");
    const { src, warnings } = patchLogoForScaffold(customized);
    expect(src).toContain("M1 1h22v22H1z");
    expect(warnings.some((w) => w.includes("logo markPaths anchor not found"))).toBe(true);
  });

  it("warns on favicon drift independently", () => {
    const drifted = template.replace("#1e3f5a", "#ff0000");
    const { warnings } = patchLogoForScaffold(drifted);
    expect(warnings.some((w) => w.includes("favicon color anchors"))).toBe(true);
  });
});

describe("patchHeroImagesForScaffold", () => {
  const template = `  images: {
    hero: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600",
    lifestyle:
      "https://images.unsplash.com/photo-1481437156560-3205f6a55735?w=1200",
  },`;

  it("swaps the clothing-store hero + lifestyle defaults for neutral images", () => {
    const { src, warnings } = patchHeroImagesForScaffold(template);
    expect(warnings).toEqual([]);
    expect(src).not.toContain("1441986300917");
    expect(src).not.toContain("1481437156560");
    expect(src).toContain("photo-1487700160041-babef9c3cb55");
    expect(src).toContain("photo-1497032628192-86f99bcd76bc");
  });

  it("warns per image without clobbering customized values", () => {
    const customized = template.replace("photo-1441986300917-64674bd600d8?w=1600", "https://cdn.example.com/my-hero.jpg");
    const { src, warnings } = patchHeroImagesForScaffold(customized);
    expect(src).toContain("my-hero.jpg");
    expect(warnings.some((w) => w.includes("images.hero"))).toBe(true);
    expect(warnings.some((w) => w.includes("images.lifestyle"))).toBe(false);
  });
});
