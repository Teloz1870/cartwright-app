import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import {
  type ScaffoldManifest,
  resolveProfileModules,
  computeMaterializationPlan,
  parseDesignIndexExports,
  parsePluginRegistryExports,
  rewritePackageJsonForSite,
  applyMaterializer,
  loadScaffoldManifest,
} from "./materializer.js";

/** Minimal but structurally faithful manifest fixture. */
function fixtureManifest(): ScaffoldManifest {
  return {
    schema: "cartwright-scaffold-manifest-v1",
    codemodTargets: [
      "designs/index.ts",
      "designs/options.ts",
      "plugins/registry.ts",
      "components/svg-items/design-motifs.ts",
    ],
    modules: [
      {
        slug: "core",
        kind: "core",
        dependsOn: [],
        files: ["app/page.static.tsx", "lib/resolvers/thing.static.ts", "designs/aurora"],
        seams: ["app/page.tsx", "lib/resolvers/thing.ts"],
        replaces: [],
        deps: [],
        devDeps: [],
        env: [],
        tests: [],
        docs: [],
      },
      {
        slug: "db",
        kind: "module",
        dependsOn: [],
        files: ["lib/db.ts", "prisma", "app/page.tsx"],
        seams: [],
        replaces: [{ target: "app/page.tsx", with: "app/page.tsx" }],
        deps: [],
        devDeps: [],
        env: [],
        tests: [],
        docs: [],
      },
      {
        slug: "admin",
        kind: "module",
        dependsOn: ["db"],
        // Directory claim CONTAINING a seam target — the copy-field
        // regression: the target must be recreated after the dir is deleted.
        files: ["lib/resolvers"],
        seams: [],
        replaces: [{ target: "lib/resolvers/thing.ts", with: "lib/resolvers/thing.ts" }],
        deps: [],
        devDeps: [],
        env: [],
        tests: [],
        docs: [],
      },
      {
        slug: "webshop",
        kind: "module",
        dependsOn: ["db", "admin"],
        files: ["designs/shop-pack", "lib/cart.ts"],
        seams: [],
        replaces: [],
        deps: [],
        devDeps: [],
        env: [],
        tests: [],
        docs: [],
      },
      {
        slug: "contact-form",
        kind: "module",
        dependsOn: [],
        files: ["app/contact"],
        seams: [],
        replaces: [],
        deps: [],
        devDeps: [],
        env: [],
        tests: [],
        docs: [],
      },
      {
        slug: "wishlist",
        kind: "plugin",
        dependsOn: ["db", "admin"],
        files: ["plugins/wishlist"],
        seams: [],
        replaces: [],
        deps: [],
        devDeps: [],
        env: [],
        tests: [],
        docs: [],
        flag: "wishlist",
      },
    ],
    profiles: [
      {
        name: "site",
        description: "core only",
        modules: [],
        aliases: [],
      },
      {
        name: "managed-site",
        description: "with db",
        modules: ["db", "admin"],
        aliases: ["light"],
      },
    ],
  };
}

describe("resolveProfileModules", () => {
  it("seeds core, resolves aliases and transitive deps", () => {
    const m = fixtureManifest();
    const bare = resolveProfileModules(m, "site");
    expect([...bare.included].sort()).toEqual(["core"]);

    const aliased = resolveProfileModules(m, "light");
    expect(aliased.profileName).toBe("managed-site");
    expect([...aliased.included].sort()).toEqual(["admin", "core", "db"]);

    const withForm = resolveProfileModules(m, "site", ["contact-form"]);
    expect([...withForm.included].sort()).toEqual(["contact-form", "core"]);
  });

  it("throws on unknown profile and unknown --with module", () => {
    const m = fixtureManifest();
    expect(() => resolveProfileModules(m, "nope")).toThrow(/Unknown profile/);
    expect(() => resolveProfileModules(m, "site", ["nope"])).toThrow(/Unknown --with/);
  });
});

describe("computeMaterializationPlan", () => {
  it("copies statics for unprovided seams, exempts targets, collects codemod slugs", () => {
    const m = fixtureManifest();
    const { included } = resolveProfileModules(m, "site", ["contact-form"]);
    const plan = computeMaterializationPlan(m, included);

    // Both seams are unprovided (db + admin excluded) → static copies.
    expect(plan.seamCopies).toEqual([
      { from: "app/page.static.tsx", to: "app/page.tsx" },
      { from: "lib/resolvers/thing.static.ts", to: "lib/resolvers/thing.ts" },
    ]);
    // db's page.tsx claim is a surviving seam target → NOT deleted; its other
    // claims are. admin's dir claim IS deleted (the nested target is
    // recreated from memory by applyMaterializer).
    expect(plan.deletePaths).toContain("lib/db.ts");
    expect(plan.deletePaths).toContain("prisma");
    expect(plan.deletePaths).toContain("lib/resolvers");
    expect(plan.deletePaths).not.toContain("app/page.tsx");
    // Excluded design packs → codemod slugs; plugins likewise.
    expect(plan.excludedDesignSlugs).toEqual(["shop-pack"]);
    expect(plan.excludedPluginSlugs).toEqual(["wishlist"]);
    // Statics are cleanup targets regardless of module.
    expect(plan.staticCleanup).toEqual([
      "app/page.static.tsx",
      "lib/resolvers/thing.static.ts",
    ]);
  });

  it("keeps on-disk content when the provider is included (no copies)", () => {
    const m = fixtureManifest();
    const { included } = resolveProfileModules(m, "managed-site");
    const plan = computeMaterializationPlan(m, included);
    expect(plan.seamCopies).toEqual([]);
    expect(plan.deletePaths).toContain("designs/shop-pack");
    expect(plan.excludedDesignSlugs).toEqual(["shop-pack"]);
  });
});

describe("registry export parsing", () => {
  it("parses design index imports", () => {
    const src = [
      'import { auroraSite } from "./aurora-site";',
      'import { webshopBold } from "./webshop-bold";',
      'import { something } from "@/lib/other";',
    ].join("\n");
    const map = parseDesignIndexExports(src);
    expect(map.get("aurora-site")).toBe("auroraSite");
    expect(map.get("webshop-bold")).toBe("webshopBold");
    expect(map.size).toBe(2);
  });

  it("parses plugin registry imports", () => {
    const src = 'import { wishlistPlugin } from "./wishlist/manifest";\n';
    const map = parsePluginRegistryExports(src);
    expect(map.get("wishlist")).toBe("wishlistPlugin");
  });
});

describe("rewritePackageJsonForSite", () => {
  it("prunes deps from both tables, rewrites scripts, drops prisma hooks", () => {
    const src = JSON.stringify({
      scripts: {
        postinstall: "prisma generate",
        build: "prisma generate && pnpm gen:manifest && next build",
        "db:setup": "tsx scripts/db-setup.ts",
        test: "vitest run",
        dev: "next dev",
      },
      dependencies: { "next-auth": "^5", stripe: "^19", next: "^16" },
      devDependencies: { prisma: "^7", vitest: "^4" },
      prisma: { seed: "x" },
    });
    const { src: out, missing } = rewritePackageJsonForSite(src);
    const pkg = JSON.parse(out);
    expect(pkg.scripts.build).toBe("next build");
    expect(pkg.scripts.postinstall).toBeUndefined();
    expect(pkg.scripts["db:setup"]).toBeUndefined();
    expect(pkg.scripts.test).toBe("vitest run --passWithNoTests");
    expect(pkg.scripts.dev).toBe("next dev");
    expect(pkg.dependencies["next-auth"]).toBeUndefined();
    expect(pkg.dependencies.stripe).toBeUndefined();
    expect(pkg.dependencies.next).toBe("^16");
    expect(pkg.devDependencies.prisma).toBeUndefined();
    expect(pkg.devDependencies.vitest).toBe("^4");
    expect(pkg.prisma).toBeUndefined();
    // Everything not in the fixture reports as missing (fail-soft signal).
    expect(missing).toContain("@libsql/client");
  });
});

describe("applyMaterializer (fixture template)", () => {
  function writeFixture(): string {
    const dir = mkdtempSync(join(tmpdir(), "cw-mat-"));
    const write = (rel: string, content: string) => {
      mkdirSync(dirname(join(dir, rel)), { recursive: true });
      writeFileSync(join(dir, rel), content);
    };
    write("scaffold/manifest.json", JSON.stringify(fixtureManifest()));
    write("app/page.tsx", "// db variant\n");
    write("app/page.static.tsx", "// static variant\n");
    write("lib/db.ts", "// prisma\n");
    write("prisma/schema.prisma", "// schema\n");
    write("lib/resolvers/thing.ts", "// ai variant\n");
    write("lib/resolvers/thing.static.ts", "// static resolver\n");
    write("lib/cart.ts", "// cart\n");
    write("app/contact/page.tsx", "// contact\n");
    write("designs/aurora/index.ts", "// aurora\n");
    write("designs/shop-pack/index.ts", "// shop design\n");
    write("plugins/wishlist/manifest.ts", "export const wishlistPlugin = {};\n");
    write(
      "designs/index.ts",
      'import { aurora } from "./aurora";\nimport { shopPack } from "./shop-pack";\nexport const DESIGNS = {\n  aurora: aurora,\n  "shop-pack": shopPack,\n};\n',
    );
    write(
      "designs/options.ts",
      'export const DESIGN_OPTIONS = [\n  { slug: "aurora" },\n  { slug: "shop-pack" },\n];\n',
    );
    write(
      "plugins/registry.ts",
      'import { wishlistPlugin } from "./wishlist/manifest";\nexport const PLUGINS = [\n  wishlistPlugin,\n];\n',
    );
    write(
      "components/svg-items/design-motifs.ts",
      'export const DESIGN_MOTIFS = {\n  aurora: "a",\n  "shop-pack": "b",\n};\n',
    );
    write(
      "package.json",
      JSON.stringify({
        scripts: { build: "prisma generate && next build", test: "vitest run" },
        dependencies: { "next-auth": "^5" },
        devDependencies: { prisma: "^7" },
      }),
    );
    write("tests/unit/foo.test.ts", "// engine test\n");
    write("playwright.config.ts", "// pw\n");
    write(".cartwright/release.json", JSON.stringify({ version: "0.40.0" }));
    return dir;
  }

  it("performs the full file math incl. the nested-seam-target regression", () => {
    const dir = writeFixture();
    const report = applyMaterializer(dir, "site", { withModules: ["contact-form"] });

    // Seam targets carry the static content — INCLUDING the target nested
    // inside admin's deleted directory claim (the copy-field regression).
    expect(readFileSync(join(dir, "app/page.tsx"), "utf8")).toContain("static variant");
    expect(readFileSync(join(dir, "lib/resolvers/thing.ts"), "utf8")).toContain(
      "static resolver",
    );
    // Static variants are cleaned up; excluded claims are gone.
    expect(existsSync(join(dir, "app/page.static.tsx"))).toBe(false);
    expect(existsSync(join(dir, "lib/resolvers/thing.static.ts"))).toBe(false);
    expect(existsSync(join(dir, "lib/db.ts"))).toBe(false);
    expect(existsSync(join(dir, "prisma"))).toBe(false);
    expect(existsSync(join(dir, "lib/cart.ts"))).toBe(false);
    expect(existsSync(join(dir, "designs/shop-pack"))).toBe(false);
    expect(existsSync(join(dir, "plugins/wishlist"))).toBe(false);
    // Included module files survive.
    expect(existsSync(join(dir, "app/contact/page.tsx"))).toBe(true);
    expect(existsSync(join(dir, "designs/aurora/index.ts"))).toBe(true);
    // Registry codemods removed the excluded entries.
    const designsIndex = readFileSync(join(dir, "designs/index.ts"), "utf8");
    expect(designsIndex).not.toContain("shop-pack");
    expect(designsIndex).toContain("aurora");
    const registry = readFileSync(join(dir, "plugins/registry.ts"), "utf8");
    expect(registry).not.toContain("wishlistPlugin");
    const options = readFileSync(join(dir, "designs/options.ts"), "utf8");
    expect(options).not.toContain("shop-pack");
    // Zones + package.json rewrite.
    expect(existsSync(join(dir, "tests/unit"))).toBe(false);
    expect(existsSync(join(dir, "playwright.config.ts"))).toBe(false);
    const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
    expect(pkg.scripts.build).toBe("next build");
    expect(pkg.dependencies["next-auth"]).toBeUndefined();
    // Profile marker v2.
    const marker = JSON.parse(
      readFileSync(join(dir, ".cartwright/profile.json"), "utf8"),
    );
    expect(marker.schemaVersion).toBe(2);
    expect(marker.profile).toBe("site");
    expect(marker.engineVersion).toBe("0.40.0");
    expect(marker.modules).toEqual(["contact-form", "core"]);
    expect(report.seamCopies).toBe(2);
    expect(report.pluginsDeregistered).toEqual(["wishlist"]);
  });

  it("throws a clear error when the template has no manifest", () => {
    const dir = mkdtempSync(join(tmpdir(), "cw-mat-nomanifest-"));
    expect(loadScaffoldManifest(dir)).toBeNull();
    expect(() => applyMaterializer(dir, "site")).toThrow(/scaffold\/manifest\.json/);
  });
});
