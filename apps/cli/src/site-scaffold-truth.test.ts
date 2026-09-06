import { describe, expect, it } from "vitest";
import { pruneDeadScriptReferences } from "./materializer";
import { patchBrandConfigContent } from "./scaffold";

/**
 * What a customer's repo says about itself after a scaffold. Both defects here
 * were measured on a real `create-cartwright@2.9.4 --profile site` scaffold,
 * not imagined:
 *
 *  - five scripts pointed at files the profile had removed (`admin:create`,
 *    `capture:gallery`, `dev:screenshot`, `capture:locales` and
 *    `verify:design` — DESIGN.md tells the owner to run that last one);
 *  - `brand.config.ts` shipped `domain: "cartwright.app"`,
 *    `url: "https://cartwright.app"` and noreply@/support@/admin@ addresses at
 *    our domain. The strip that was supposed to prevent this only knew
 *    `teloz.net`, which the engine's own config stopped using.
 */
describe("dead script references", () => {
  const pkg = JSON.stringify(
    {
      scripts: {
        dev: "next dev",
        build: "next build",
        "admin:create": "tsx scripts/admin-reset.ts --create",
        "verify:design": "node scripts/dev-screenshot.mjs",
        "gen:something": "node scripts/kept.mjs",
        mixed: "node scripts/kept.mjs && node scripts/gone.mjs",
      },
    },
    null,
    2,
  );
  const exists = (rel: string) => rel === "scripts/kept.mjs";

  it("drops exactly the scripts whose files the profile removed", () => {
    const out = pruneDeadScriptReferences(pkg, exists);
    const scripts = (JSON.parse(out.src) as { scripts: Record<string, string> }).scripts;
    expect(out.dropped.sort()).toEqual(["admin:create", "verify:design"]);
    expect(scripts["admin:create"]).toBeUndefined();
    expect(scripts["verify:design"]).toBeUndefined();
    // Untouched: no script path at all, and a script whose file is still there.
    expect(scripts.dev).toBe("next dev");
    expect(scripts["gen:something"]).toBe("node scripts/kept.mjs");
    // A command that still has ONE working target keeps working — dropping it
    // would remove a script the owner can use.
    expect(scripts.mixed).toBe("node scripts/kept.mjs && node scripts/gone.mjs");
  });

  it("leaves a tree where nothing was pruned exactly as it found it", () => {
    const out = pruneDeadScriptReferences(pkg, () => true);
    expect(out.dropped).toEqual([]);
    expect(out.src).toBe(pkg);
  });

  it("survives an unparsable package.json instead of throwing mid-scaffold", () => {
    const out = pruneDeadScriptReferences("{ not json", () => true);
    expect(out.dropped).toEqual([]);
    expect(out.src).toBe("{ not json");
  });
});

describe("the template's own identity never ships as the customer's", () => {
  const config = `export const brand = {
  storeName: "Cartwright",
  storeSlug: "cartwright",
  domain: "cartwright.app",
  url: "https://cartwright.app",
  emails: {
    from: "noreply@cartwright.app",
    support: "support@cartwright.app",
    admin: "admin@cartwright.app",
  },
  // Pricing lands on cartwright.app — prose, and it stays.
  badge: { ownerUrl: "https://cartwright.app" as string },
};
`;
  const out = patchBrandConfigContent(config, "annas-trip");

  it("replaces the domain, the canonical URL and every address at our domain", () => {
    expect(out).toContain('domain: "example.com"');
    expect(out).toContain('url: "https://example.com"');
    expect(out).not.toMatch(/@cartwright\.app/);
    expect(out).toContain("noreply@example.com");
    // In a database-backed profile the seed creates its admin from this one.
    expect(out).toContain("admin@example.com");
  });

  it("keeps the Built-with-Cartwright link and prose pointing at us", () => {
    expect(out).toContain('ownerUrl: "https://cartwright.app"');
    expect(out).toContain("Pricing lands on cartwright.app");
  });

  it("still does its original job for a template that predates the move", () => {
    const legacy = patchBrandConfigContent(
      'export const brand = { storeName: "X", domain: "teloz.net", emails: { admin: "admin@teloz.net" } };',
      "my-site",
    );
    expect(legacy).toContain('domain: "example.com"');
    expect(legacy).toContain("admin@example.com");
  });
});
