/**
 * B3 profile materializer — cuts a profile from the engine's module manifest
 * instead of hardcoded prune-lists (site-profile program, engine
 * `internal-docs/site-profile-ultraplan.md` §6).
 *
 * The engine ships `scaffold/manifest.json` (generated from
 * modules/registry.ts, drift-gated by its unit tests): every module's file
 * claims, the seam declarations (`seams`) and providers (`replaces`), the
 * four registry-codemod targets, and the named profiles. This module reads
 * that manifest from the downloaded template and applies the file math:
 *
 *   1. resolve profile → transitive module set (core always included)
 *   2. for every seam declared by an included module with NO included
 *      provider: copy the sibling `<name>.static.<ext>` over the target
 *   3. delete every excluded module's files (seam targets exempt)
 *   4. delete every leftover `*.static.*` seam variant
 *   5. registry codemods: de-register excluded design packs + plugins
 *      (reuses the proven profile-light codemods; export names are PARSED
 *      from the template's own registry sources, so new packs never drift)
 *   6. rewrite package.json (profile scripts + dep prune) and prune the
 *      whitelist zones (tests/, e2e/, db-coupled scripts/)
 *   7. write `.cartwright/profile.json` v2
 *
 * v1 scope (deliberate): only the `site` profile routes through the
 * materializer — `light`/`full` keep the existing prune-list path until the
 * engine's per-profile CI materialization (B4) proves the bigger sets.
 */
import { existsSync, readFileSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import {
  applyCodemod,
  pruneDesignIndexSource,
  pruneDesignOptionsSource,
  pruneDesignMotifsSource,
  prunePluginsRegistrySource,
} from "./profile-light.js";

// ── Manifest types (cartwright-scaffold-manifest-v1) ─────────────────────────

export type ManifestModule = {
  slug: string;
  kind: "core" | "module" | "plugin";
  dependsOn: string[];
  files: string[];
  seams: string[];
  replaces: Array<{ target: string; with: string }>;
  deps: Array<{ name: string; version?: string; dev?: boolean }>;
  devDeps: Array<{ name: string; version?: string }>;
  env: Array<{ name: string; required: boolean; example?: string; docs?: string }>;
  tests: string[];
  docs: string[];
  flag?: string;
  knownDeviations?: string[];
};

export type ScaffoldManifest = {
  schema: "cartwright-scaffold-manifest-v1";
  codemodTargets: string[];
  modules: ManifestModule[];
  profiles: Array<{
    name: string;
    description: string;
    modules: string[];
    aliases: string[];
  }>;
};

export function loadScaffoldManifest(targetDir: string): ScaffoldManifest | null {
  const p = join(targetDir, "scaffold", "manifest.json");
  if (!existsSync(p)) return null;
  try {
    const parsed = JSON.parse(readFileSync(p, "utf8")) as ScaffoldManifest;
    if (parsed.schema !== "cartwright-scaffold-manifest-v1") return null;
    return parsed;
  } catch {
    return null;
  }
}

// ── Module-set resolution ────────────────────────────────────────────────────

/**
 * Profile (or alias) + `--with` extras → transitive module set. `core` is
 * always seeded (the manifest's contract: a profile is "core + modules").
 */
export function resolveProfileModules(
  manifest: ScaffoldManifest,
  profileNameOrAlias: string,
  withModules: readonly string[] = [],
): { profileName: string; included: Set<string> } {
  const profile = manifest.profiles.find(
    (p) => p.name === profileNameOrAlias || p.aliases.includes(profileNameOrAlias),
  );
  if (!profile) {
    throw new Error(
      `Unknown profile "${profileNameOrAlias}" — this template supports: ${manifest.profiles
        .map((p) => p.name)
        .join(", ")}`,
    );
  }
  const bySlug = new Map(manifest.modules.map((m) => [m.slug, m]));
  for (const w of withModules) {
    if (!bySlug.has(w)) {
      throw new Error(
        `Unknown --with module "${w}" — available: ${manifest.modules
          .filter((m) => m.kind === "module")
          .map((m) => m.slug)
          .join(", ")}`,
      );
    }
  }
  const included = new Set<string>();
  const queue = ["core", ...profile.modules, ...withModules];
  while (queue.length) {
    const slug = queue.pop()!;
    if (included.has(slug)) continue;
    const m = bySlug.get(slug);
    if (!m) throw new Error(`Manifest inconsistency: unknown module "${slug}"`);
    included.add(slug);
    queue.push(...m.dependsOn);
  }
  return { profileName: profile.name, included };
}

// ── Materialization plan (pure — unit-tested) ────────────────────────────────

export type MaterializationPlan = {
  /** Files/dirs to delete (excluded modules' claims, seam targets exempt). */
  deletePaths: string[];
  /** Static seam variants to copy over their targets (unprovided seams). */
  seamCopies: Array<{ from: string; to: string }>;
  /** Every `*.static.*` seam-variant file to remove after copying. */
  staticCleanup: string[];
  /** Design-pack slugs to de-register from designs/index.ts + options.ts. */
  excludedDesignSlugs: string[];
  /** Plugin slugs to de-register from plugins/registry.ts. */
  excludedPluginSlugs: string[];
};

const staticVariantOf = (seam: string) => seam.replace(/(\.[a-z]+)$/i, ".static$1");

export function computeMaterializationPlan(
  manifest: ScaffoldManifest,
  included: ReadonlySet<string>,
): MaterializationPlan {
  const excluded = manifest.modules.filter((m) => !included.has(m.slug));
  const includedModules = manifest.modules.filter((m) => included.has(m.slug));

  // Seams declared by included modules; provider = any OTHER module whose
  // `replaces` targets it. Unprovided → copy the static sibling.
  const seamCopies: Array<{ from: string; to: string }> = [];
  const survivingSeamTargets = new Set<string>();
  for (const m of includedModules) {
    for (const seam of m.seams) {
      const providerIncluded = manifest.modules.some(
        (p) => p.slug !== m.slug && included.has(p.slug) && p.replaces.some((r) => r.target === seam),
      );
      if (providerIncluded) continue;
      seamCopies.push({ from: staticVariantOf(seam), to: seam });
      survivingSeamTargets.add(seam);
    }
  }

  // Excluded claims → delete, except seam targets that just got static content.
  const deletePaths = excluded
    .flatMap((m) => m.files)
    .filter((p) => !survivingSeamTargets.has(p));

  // Every static variant in the tree is a copy-source, not a shippable file.
  const staticCleanup = manifest.modules
    .flatMap((m) => m.files)
    .filter((p) => /\.static\.[a-z]+$/i.test(p));

  // Design packs / plugins to de-register (their claims live under designs/<slug>
  // or they are kind:"plugin").
  const excludedDesignSlugs = excluded
    .flatMap((m) => m.files)
    .filter((p) => /^designs\/[a-z0-9-]+$/.test(p))
    .map((p) => p.split("/")[1]);
  const excludedPluginSlugs = excluded.filter((m) => m.kind === "plugin").map((m) => m.slug);

  return {
    deletePaths: [...new Set(deletePaths)].sort(),
    seamCopies,
    staticCleanup: [...new Set(staticCleanup)].sort(),
    excludedDesignSlugs: [...new Set(excludedDesignSlugs)].sort(),
    excludedPluginSlugs: [...new Set(excludedPluginSlugs)].sort(),
  };
}

// ── Registry export-name parsing (drift-proof codemod inputs) ────────────────

/**
 * Parse `import { <exportName> } from "./<slug>";` lines from
 * designs/index.ts — the codemods need the export name per slug, and parsing
 * the template's own source means newly added packs never drift a hardcoded
 * table.
 */
export function parseDesignIndexExports(src: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of src.matchAll(
    /^import\s*\{\s*([A-Za-z0-9_]+)\s*\}\s*from\s*"\.\/([a-z0-9-]+)";/gm,
  )) {
    out.set(m[2], m[1]);
  }
  return out;
}

/** Same for `import { <exportName> } from "./<slug>/manifest";` in plugins/registry.ts. */
export function parsePluginRegistryExports(src: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of src.matchAll(
    /^import\s*\{\s*([A-Za-z0-9_]+)\s*\}\s*from\s*"\.\/([a-z0-9-]+)\/manifest";/gm,
  )) {
    out.set(m[2], m[1]);
  }
  return out;
}

// ── package.json rewrite (site profile) ──────────────────────────────────────

/**
 * Dependencies that exist ONLY for excluded-module code in a `site`
 * materialization. Curated v1 list (module `deps` inventories are a B4
 * fill-in); the release scaffold-gate's site leg (install → typecheck →
 * build → boot) is the proof that the remaining tree never imports these.
 */
export const SITE_PRUNED_DEPENDENCIES: readonly string[] = [
  "prisma",
  "@prisma/client",
  "@prisma/adapter-libsql",
  "@prisma/adapter-pg",
  "@libsql/client",
  "next-auth",
  "@auth/prisma-adapter",
  "bcryptjs",
  "stripe",
  "@stripe/stripe-js",
  "@stripe/react-stripe-js",
  "ai",
  "@ai-sdk/anthropic",
  "@ai-sdk/google",
  "@ai-sdk/openai",
  "@ai-sdk/react",
  "@google/genai",
  "resend",
  "@vercel/blob",
  "@upstash/ratelimit",
  "@upstash/redis",
  "three",
];

export const SITE_PRUNED_DEV_DEPENDENCIES: readonly string[] = [
  "@types/three",
  "@types/bcryptjs",
  "fast-check",
  "ts-node",
  "@playwright/test",
];

/** package.json script entries a no-DB site scaffold must not carry. */
const SITE_PRUNED_SCRIPT_KEYS: readonly string[] = [
  "postinstall", // prisma generate
  "db:push",
  "db:verify",
  "db:setup",
  "db:deploy",
  "seed",
  "admin:reset",
  "embeddings:backfill",
  "pgvector:setup",
  "test:e2e",
  "gen:manifest",
  "build:registry",
  "typecheck:native",
];

export function rewritePackageJsonForSite(src: string): { src: string; missing: string[] } {
  const missing: string[] = [];
  let pkg: Record<string, unknown>;
  try {
    pkg = JSON.parse(src) as Record<string, unknown>;
  } catch {
    return { src, missing: ["<unparsable package.json>"] };
  }

  // Each name is pruned from BOTH tables (templates move packages between
  // dependencies/devDependencies over time — e.g. prisma is a devDep today).
  const deps = pkg.dependencies as Record<string, string> | undefined;
  const devDeps = pkg.devDependencies as Record<string, string> | undefined;
  for (const name of [...SITE_PRUNED_DEPENDENCIES, ...SITE_PRUNED_DEV_DEPENDENCIES]) {
    let found = false;
    for (const table of [deps, devDeps]) {
      if (table && name in table) {
        delete table[name];
        found = true;
      }
    }
    if (!found) missing.push(name);
  }

  const scripts = (pkg.scripts ?? {}) as Record<string, string>;
  for (const key of SITE_PRUNED_SCRIPT_KEYS) delete scripts[key];
  // The engine build chain runs prisma generate + registry/marketplace
  // generators — none exist in a site scaffold.
  scripts.build = "next build";
  // The engine test-suite travels with modules (B4); an empty suite must not
  // fail the scaffold's CI safety net.
  if (scripts.test) scripts.test = "vitest run --passWithNoTests";
  pkg.scripts = scripts;

  // Prisma seed hook (if the template still carries one).
  delete (pkg as Record<string, unknown>).prisma;

  return { src: JSON.stringify(pkg, null, 2) + "\n", missing };
}

// ── Whitelist zones (tests / e2e / db-coupled scripts) ───────────────────────

/**
 * The engine tsconfig includes every .ts file, so every surviving file must typecheck. The
 * engine's test-suite and db-coupled scripts assume the full tree — module-
 * travelling tests are a B4 fill-in (`tests` inventories are empty today),
 * so a site materialization prunes the zones wholesale, keeping only the
 * pure generators that still compile against the site tree.
 */
export const SITE_PRUNED_ZONES: readonly string[] = [
  "tests/unit",
  "tests/e2e",
  "playwright.config.ts",
];

export const SITE_PRUNED_SCRIPTS: readonly string[] = [
  "scripts/capture-gallery.mjs",
  "scripts/dev-screenshot.mjs",
  "scripts/admin-reset.ts",
  "scripts/backfill-embeddings.ts",
  "scripts/backfill-media-assets.ts",
  "scripts/backup-turso.ts",
  "scripts/db-setup.ts",
  "scripts/design-import.ts",
  "scripts/gen-marketplace-manifests.ts",
  "scripts/migrate-turso.ts",
  "scripts/p2k-scan.ts",
  "scripts/pgvector-setup.ts",
  "scripts/restore-turso.ts",
  "scripts/build-registry-source.ts",
];

// ── Apply ────────────────────────────────────────────────────────────────────

export type MaterializerReport = {
  profileName: string;
  modules: string[];
  removedPaths: string[];
  seamCopies: number;
  designsDeregistered: string[];
  pluginsDeregistered: string[];
  warnings: string[];
};

/**
 * Run the full materialization against a downloaded template directory.
 * Fail-soft on template drift (missing paths are warnings, never fatal) —
 * the scaffold-gate proves the result functionally.
 */
export function applyMaterializer(
  targetDir: string,
  profileNameOrAlias: string,
  opts: { withModules?: readonly string[] } = {},
): MaterializerReport {
  const manifest = loadScaffoldManifest(targetDir);
  if (!manifest) {
    throw new Error(
      "This template ref has no scaffold/manifest.json — the site profile needs a newer engine (>= the B3 release). Use --ref next or a newer tag.",
    );
  }
  const { profileName, included } = resolveProfileModules(
    manifest,
    profileNameOrAlias,
    opts.withModules ?? [],
  );
  const plan = computeMaterializationPlan(manifest, included);
  const warnings: string[] = [];
  const removedPaths: string[] = [];

  // 1. Read every seam variant into memory FIRST — a variant (or even its
  // TARGET, when it lives inside a directory claim like admin's
  // lib/genome/resolvers) may sit inside a path we delete in step 2. The
  // write in step 3 then recreates the target regardless.
  const seamContents: Array<{ to: string; content: Buffer }> = [];
  for (const { from, to } of plan.seamCopies) {
    const fromAbs = join(targetDir, from);
    if (!existsSync(fromAbs)) {
      warnings.push(`seam variant missing: ${from}`);
      continue;
    }
    seamContents.push({ to, content: readFileSync(fromAbs) as Buffer });
  }

  // 2. Delete excluded claims (top-level seam targets already exempted in
  // the plan; targets nested in deleted directories are rewritten in 3).
  for (const p of plan.deletePaths) {
    const abs = join(targetDir, p);
    if (!existsSync(abs)) continue;
    rmSync(abs, { recursive: true, force: true });
    removedPaths.push(p);
  }

  // 3. Write the static content over every unprovided seam target.
  let seamCopies = 0;
  for (const { to, content } of seamContents) {
    const toAbs = join(targetDir, to);
    mkdirSync(dirname(toAbs), { recursive: true });
    writeFileSync(toAbs, content);
    seamCopies++;
  }

  // 4. Remove every leftover static variant (copy-sources, not shippables).
  for (const p of plan.staticCleanup) {
    const abs = join(targetDir, p);
    if (existsSync(abs)) {
      rmSync(abs, { force: true });
      removedPaths.push(p);
    }
  }

  // 5. Registry codemods — de-register excluded design packs + plugins.
  const indexPath = join(targetDir, "designs", "index.ts");
  const indexSrc = existsSync(indexPath) ? readFileSync(indexPath, "utf8") : "";
  const designExports = parseDesignIndexExports(indexSrc);
  const designPairs = plan.excludedDesignSlugs
    .filter((slug) => {
      if (designExports.has(slug)) return true;
      warnings.push(`design ${slug}: no import line in designs/index.ts`);
      return false;
    })
    .map((slug) => ({ slug, exportName: designExports.get(slug)! }));

  applyCodemod(
    targetDir,
    "designs/index.ts",
    (src) => {
      const r = pruneDesignIndexSource(src, designPairs);
      for (const m of r.missing) warnings.push(`designs/index.ts: no entry for ${m}`);
      return r.src;
    },
    warnings,
  );
  applyCodemod(
    targetDir,
    "designs/options.ts",
    (src) => {
      const r = pruneDesignOptionsSource(src, plan.excludedDesignSlugs);
      for (const m of r.missing) warnings.push(`designs/options.ts: no entry for ${m}`);
      return r.src;
    },
    warnings,
  );
  applyCodemod(
    targetDir,
    "components/svg-items/design-motifs.ts",
    (src) => pruneDesignMotifsSource(src, plan.excludedDesignSlugs),
    warnings,
  );

  const registryPath = join(targetDir, "plugins", "registry.ts");
  const registrySrc = existsSync(registryPath) ? readFileSync(registryPath, "utf8") : "";
  const pluginExports = parsePluginRegistryExports(registrySrc);
  const pluginPairs = plan.excludedPluginSlugs
    .filter((slug) => {
      if (pluginExports.has(slug)) return true;
      warnings.push(`plugin ${slug}: no import line in plugins/registry.ts`);
      return false;
    })
    .map((slug) => ({ slug, exportName: pluginExports.get(slug)! }));
  applyCodemod(
    targetDir,
    "plugins/registry.ts",
    (src) => {
      const r = prunePluginsRegistrySource(src, pluginPairs);
      for (const m of r.missing) warnings.push(`plugins/registry.ts: no entry for ${m}`);
      return r.src;
    },
    warnings,
  );

  // 6. Site-profile package.json + zone pruning.
  if (profileName === "site") {
    const pkgPath = join(targetDir, "package.json");
    if (existsSync(pkgPath)) {
      const r = rewritePackageJsonForSite(readFileSync(pkgPath, "utf8"));
      for (const m of r.missing) warnings.push(`package.json: ${m} not present`);
      writeFileSync(pkgPath, r.src);
    }
    for (const zone of [...SITE_PRUNED_ZONES, ...SITE_PRUNED_SCRIPTS]) {
      const abs = join(targetDir, zone);
      if (existsSync(abs)) {
        rmSync(abs, { recursive: true, force: true });
        removedPaths.push(zone);
      }
    }
    // No database → no Prisma config or migrations tooling.
    for (const p of ["prisma.config.ts", ".admin-credentials"]) {
      const abs = join(targetDir, p);
      if (existsSync(abs)) {
        rmSync(abs, { force: true });
        removedPaths.push(p);
      }
    }
  }

  // 7. Profile marker v2 — the resolved module graph, additive upgrades'
  // anchor (ultraplan §1). engineVersion comes from the release marker.
  let engineVersion: string | undefined;
  try {
    const release = JSON.parse(
      readFileSync(join(targetDir, ".cartwright", "release.json"), "utf8"),
    ) as { version?: string };
    engineVersion = release.version;
  } catch {
    // No release marker (dev snapshot) — omit.
  }
  const modules = [...included].sort();
  const marker = {
    schemaVersion: 2,
    profile: profileName,
    generatedBy: "create-cartwright",
    ...(engineVersion ? { engineVersion } : {}),
    modules,
    removedPaths: removedPaths.sort(),
  };
  const markerDir = join(targetDir, ".cartwright");
  mkdirSync(markerDir, { recursive: true });
  writeFileSync(join(markerDir, "profile.json"), JSON.stringify(marker, null, 2) + "\n");

  return {
    profileName,
    modules,
    removedPaths,
    seamCopies,
    designsDeregistered: designPairs.map((d) => d.slug),
    pluginsDeregistered: pluginPairs.map((p) => p.slug),
    warnings,
  };
}
