import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  titleCase,
  patchBrandConfigContent,
  patchBrandConfigForTemplate,
  patchFooterContent,
  patchHeroVideoContent,
  patchCatalogFiltersContent,
  patchProxyContent,
  migratePrismaConfig,
  patchEnvLocal,
  isTemplateSlug,
  TEMPLATE_SLUGS,
  TEMPLATE_DEFAULTS,
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
