import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  titleCase,
  patchBrandConfigContent,
  patchBrandConfigForTemplate,
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

  it("coffee flips webshop on, A2A off", () => {
    const out = patchBrandConfigForTemplate(BRAND_FRAGMENT, "coffee");
    expect(out).toContain(`industryTemplate: "coffee"`);
    expect(out).toContain(`mode: "webshop"`);
    expect(out).toContain(`webshop: true`);
    expect(out).toContain(`a2a: false`);
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
  });

  it("generic preserves webshop mode with no A2A flags on", () => {
    const out = patchBrandConfigForTemplate(BRAND_FRAGMENT, "generic");
    expect(out).toContain(`industryTemplate: "generic"`);
    expect(out).toContain(`mode: "webshop"`);
    expect(out).toContain(`webshop: true`);
    expect(out).toContain(`a2a: false`);
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
