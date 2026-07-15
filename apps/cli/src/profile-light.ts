/**
 * `--profile light` — the DEFAULT scaffold profile for Cartwright Light.
 *
 * "A real site — design, database, backend — live in minutes."
 *
 * One engine, two scaffold profiles (never a separate light codebase):
 *   light (default) → website-mode scaffold with the curated design set and
 *                     the FULL-ONLY modules pruned (see LIGHT_EXCLUDED_PATHS).
 *   full            → everything, byte-identical to the pre-profile scaffold.
 *
 * What light prunes is driven by the engine's core audit
 * (cartwright-private/internal-docs/core-audit.md, owner-approved on engine
 * PR #207). The rule is CONSERVATIVE: only modules the audit marks FULL-ONLY
 * (A2A/agent-marketplace, UCP identity-linking, WebMCP) plus hoptify and the
 * non-curated design packs are removed. Every §2 "plugin" module (reviews,
 * blog, voice, three, phone-widget, …) stays compiled-in with its flag
 * default-off until `npx cartwright add <x>` exists to install it back.
 * Pruned designs are re-installable today via
 * `npx cartwright design install <slug>`.
 *
 * Every removal was verified against the v0.34.0 template: zero static (or
 * statically-resolved dynamic) imports from kept code into any pruned path,
 * except the two single-line WebMcpRegistrar references in
 * app/[locale]/layout.tsx, which `pruneWebMcpFromLayoutSource` removes.
 * Notably NOT pruned (verified unsafe / out of scope for v1):
 *   - lib/search + ProductEmbedding: core lib/tools/products.ts has
 *     build-resolved `await import("@/lib/search/…")` calls.
 *   - prisma/schema.prisma: untouched — unused models are harmless; schema
 *     pruning is the audit's explicit "risky" line.
 *   - package.json dependencies: only PROVEN ORPHANS are removed (see
 *     LIGHT_PRUNED_DEPENDENCIES / LIGHT_PRUNED_DEV_DEPENDENCIES — each entry
 *     carries its grep evidence). Every dep still imported by kept code stays,
 *     even flag-off ones (three, framer-motion, @sentry/nextjs, @google/genai,
 *     v0-sdk, jsdom, dompurify, botid …) — extracting those is the plugin
 *     program, not a scaffold trim. The committed pnpm-lock.yaml is kept:
 *     pnpm reconciles the removed entries on install while preserving the
 *     pinned resolutions of everything that remains (verified e2e — the
 *     installed next/stripe/prisma versions match an untrimmed scaffold).
 */
import { existsSync, readFileSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export type Profile = "light" | "full" | "site";
export const PROFILES: ReadonlyArray<Profile> = ["light", "full", "site"];

export function isProfile(value: unknown): value is Profile {
  return typeof value === "string" && PROFILES.includes(value as Profile);
}

/**
 * The curated design set that ships in light (owner decision, engine PR #207):
 * 8 curated packs + 2 structural keeps that pruning would break:
 *   - aurora-shop: the webshop-mode default (`inferDesignFromIndustry` returns
 *     it whenever ecommerce is enabled — light ships the full mode-gated
 *     webshop, so flipping mode must keep working).
 *   - studio: designs/studio/sections/ is the shared section library that the
 *     CORE builder (lib/builder/section-registry.tsx), aurora-site and jungle
 *     homepages, and scripts/build-registry-source.ts all import from.
 */
export const LIGHT_KEPT_DESIGNS: readonly string[] = [
  "aurora-site",
  "fable",
  "stillwater",
  "halo",
  "jungle",
  "meridian",
  "brutalist",
  "apex",
  // structural keeps
  "aurora-shop",
  "studio",
  // the Blank Canvas pack (template v0.36.0+) — the build-from-scratch path;
  // not in LIGHT_PRUNED_DESIGNS so it survives either way, listed for the contract.
  "blank",
];

/** slug → exported DesignPack const in designs/<slug>/index.ts (template v0.34.0). */
export const LIGHT_PRUNED_DESIGNS: ReadonlyArray<{ slug: string; exportName: string }> = [
  { slug: "saas-dark", exportName: "saasDarkDesign" },
  { slug: "corporate-baseline", exportName: "corporateBaselineDesign" },
  { slug: "webshop-classic", exportName: "webshopClassicDesign" },
  { slug: "webshop-minimal", exportName: "webshopMinimalDesign" },
  { slug: "webshop-editorial", exportName: "webshopEditorialDesign" },
  { slug: "webshop-bold", exportName: "webshopBoldDesign" },
  { slug: "northern-coffee", exportName: "northernCoffeeDesign" },
  { slug: "atelier", exportName: "atelierDesign" },
  { slug: "stack", exportName: "stackDesign" },
  { slug: "hoptify", exportName: "hoptifyDesign" },
  { slug: "engineered", exportName: "engineeredDesign" },
  { slug: "editorial-ink", exportName: "editorialInkDesign" },
  { slug: "nocturne", exportName: "nocturneDesign" },
  { slug: "aerospace", exportName: "aerospaceDesign" },
  { slug: "flux", exportName: "fluxDesign" },
  { slug: "drive", exportName: "driveDesign" },
];

/**
 * slug → exported manifest const in plugins/<slug>/manifest.ts. A full-only
 * plugin is de-registered from plugins/registry.ts (prunePluginsRegistrySource)
 * AND its dir removed (via LIGHT_EXCLUDED_PATHS below). Without this, the light
 * profile prunes hoptify's impl (lib/hoptify, app/admin/hoptify) but leaves the
 * hoptify entry in the registry, so the shipped tests/unit/plugins.test.ts
 * "every declared file exists" + "route mounts wired" invariants fail on a
 * fresh light scaffold. hoptify is the only registry plugin whose files the
 * light profile prunes (a2a/ucp/webmcp are pruned modules, not registry plugins).
 */
export const LIGHT_PRUNED_PLUGINS: ReadonlyArray<{ slug: string; exportName: string }> = [
  { slug: "hoptify", exportName: "hoptifyPlugin" },
];

/**
 * Paths (relative to the scaffold root) removed by the light profile.
 * Grouped by audit classification. Missing paths are skipped silently so a
 * future template that already dropped (or moved) a module doesn't error.
 */
export const LIGHT_EXCLUDED_PATHS: readonly string[] = [
  // ── FULL-ONLY: A2A / agent-marketplace (audit §3) ─────────────────────────
  "lib/a2a",
  "lib/escrow",
  "lib/negotiation",
  "app/api/agent-card",
  "app/api/negotiate",
  "app/api/escrow",
  "app/admin/agentic",
  "tests/unit/a2a",
  "tests/unit/escrow",
  "tests/unit/negotiation",
  // ── FULL-ONLY: UCP identity-linking (audit §3) ────────────────────────────
  "lib/ucp",
  "app/oauth",
  "app/api/ucp",
  "app/.well-known/oauth-authorization-server",
  "app/.well-known/oauth-protected-resource",
  "app/.well-known/ucp",
  "tests/unit/ucp-oauth.test.ts",
  "tests/unit/ucp-capability-profile.test.ts",
  // ── FULL-ONLY: WebMCP (audit §3; layout mount removed via codemod) ───────
  "lib/webmcp",
  "components/WebMcpRegistrar.tsx",
  "components/WebMcpCheck.tsx",
  "app/[locale]/webmcp-check",
  "tests/unit/webmcp-paths.test.ts",
  // ── hoptify (audit §4 owner call) — full-only, removed entirely from light:
  //    design pack via LIGHT_PRUNED_DESIGNS; impl (lib/ + app/admin) + the PLUGIN
  //    dir below; its plugins/registry.ts entry via LIGHT_PRUNED_PLUGINS (the
  //    registry codemod, so /api/admin/plugins doesn't list a pruned plugin).
  //    tests/unit/plugins.test.ts pins the FULL plugin registry — both generic
  //    invariants ("every declared file exists", "mounts wired") that trip over
  //    hoptify's pruned files AND hoptify-specific assertions via
  //    getPluginManifest("hoptify") — so it's pruned, like design-mixable.test.ts
  //    pins the full design registry.
  "lib/hoptify",
  "app/admin/hoptify",
  "tests/unit/hoptify-design.test.ts",
  "tests/unit/hoptify-migrate.test.ts",
  "tests/unit/plugins.test.ts",
  // ── B3 module-manifest tests (engine #385) pin the FULL module graph: the
  //    scaffold-manifest drift test asserts every claimed file exists on disk
  //    (light prunes design packs), and the site-profile import-closure test
  //    walks the complete tree. Both belong to the manifest-driven `site`
  //    path — the prune-list light profile is not a materialization, so the
  //    graph invariants do not hold there by design.
  "tests/unit/modules.test.ts",
  "tests/unit/scaffold-manifest.test.ts",
  "tests/unit/site-profile-imports.test.ts",
  ...LIGHT_PRUNED_PLUGINS.map((p) => `plugins/${p.slug}`),
  // ── Teloz/saas agency pages — pricing, case studies, services. These are the
  //    holding company's OWN corporate pages: isSaas-gated (industryTemplate
  //    "saas"), so they 404 on a website-corporate scaffold, and their nav links
  //    in Header/MobileMenu are {isSaas &&}-gated. A customer website scaffold
  //    has no use for them, so the light profile drops them (the engine keeps
  //    them for the Teloz canary). Re-install via `--profile full`.
  "app/[locale]/priser",
  "app/[locale]/cases",
  "app/[locale]/services",
  // ── Non-curated design packs (re-install: `cartwright design install <slug>`)
  ...LIGHT_PRUNED_DESIGNS.map((d) => `designs/${d.slug}`),
  // Pins the FULL design registry (asserts hoptify is mixable) — invalid after the trim.
  "tests/unit/design-mixable.test.ts",
];

/**
 * package.json `dependencies` that are PROVEN ORPHANS in a light scaffold —
 * zero `import`/`require`/string references anywhere outside package.json
 * (grep over the full v0.34.0 light scaffold, both quote styles, including
 * subpath imports and config files).
 *
 *   - "@ai-sdk/openai": the engine only ever imports
 *     "@ai-sdk/openai-compatible" (lib/ai/client.ts, lib/ai/embeddings.ts) —
 *     the plain provider package is referenced nowhere, in light OR full.
 *     ~3.6 MB in node_modules.
 *
 * NOT pruned despite zero direct imports: `pg` (runtime peer of
 * "@prisma/adapter-pg", which lib/db.ts dynamic-imports for the Postgres DB
 * option — DB flexibility is core) and every `@types/*` package (ambient
 * types for tsc, never imported by name).
 */
export const LIGHT_PRUNED_DEPENDENCIES: readonly string[] = ["@ai-sdk/openai"];

/**
 * package.json `devDependencies` that are orphaned in a light scaffold:
 *
 *   - "fast-check": its sole consumer is
 *     tests/unit/negotiation/monotonicity.property.test.ts — a pruned path
 *     (negotiation is FULL-ONLY). The fast-check@3 that prisma pulls in
 *     transitively is unaffected. ~1.4 MB.
 *   - "ts-node": referenced nowhere — the seed/scripts all run via tsx, and
 *     prisma.config.ts explicitly documents "tsx, NOT ts-node". Orphaned in
 *     full too (engine-level cleanup candidate). ~1.1 MB + transitive deps.
 */
export const LIGHT_PRUNED_DEV_DEPENDENCIES: readonly string[] = ["fast-check", "ts-node"];

// ── Pure codemods (unit-tested) ─────────────────────────────────────────────

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type PruneResult = { src: string; missing: string[] };

/**
 * Remove pruned designs' import lines + DESIGNS-map entries from
 * designs/index.ts source. Line-anchored (the inverse of design-install's
 * addToIndexSource). Slugs whose lines aren't found are reported in `missing`
 * (template drift) — never fatal.
 */
export function pruneDesignIndexSource(
  src: string,
  pruned: ReadonlyArray<{ slug: string; exportName: string }> = LIGHT_PRUNED_DESIGNS,
): PruneResult {
  let out = src;
  const missing: string[] = [];
  for (const { slug, exportName } of pruned) {
    const importRe = new RegExp(
      `^import\\s*\\{\\s*${escapeRe(exportName)}\\s*\\}\\s*from\\s*"\\./${escapeRe(slug)}";[ \\t]*\\r?\\n`,
      "m",
    );
    // Map entry key is either quoted ("editorial-ink":) or a bare ident (atelier:).
    const entryRe = new RegExp(
      `^\\s*(?:"${escapeRe(slug)}"|${escapeRe(slug)}):\\s*${escapeRe(exportName)},[ \\t]*\\r?\\n`,
      "m",
    );
    const hadImport = importRe.test(out);
    const hadEntry = entryRe.test(out);
    out = out.replace(importRe, "").replace(entryRe, "");
    if (!hadImport && !hadEntry) missing.push(slug);
  }
  return { src: out, missing };
}

/**
 * Remove pruned plugins' import lines + PLUGINS-array entries from
 * plugins/registry.ts source. Mirrors pruneDesignIndexSource: a full-only
 * plugin is de-registered so the shipped plugins.test.ts invariants
 * ("every declared file exists", "route mounts wired") stay green once its
 * files are pruned. Slugs whose lines aren't found are reported in `missing`
 * (template drift) — never fatal.
 */
export function prunePluginsRegistrySource(
  src: string,
  pruned: ReadonlyArray<{ slug: string; exportName: string }> = LIGHT_PRUNED_PLUGINS,
): PruneResult {
  let out = src;
  const missing: string[] = [];
  for (const { slug, exportName } of pruned) {
    const importRe = new RegExp(
      `^import\\s*\\{\\s*${escapeRe(exportName)}\\s*\\}\\s*from\\s*"\\./${escapeRe(slug)}/manifest";[ \\t]*\\r?\\n`,
      "m",
    );
    // Bare-identifier entry on its own line in the PLUGINS array.
    const entryRe = new RegExp(`^[ \\t]*${escapeRe(exportName)},[ \\t]*\\r?\\n`, "m");
    const hadImport = importRe.test(out);
    const hadEntry = entryRe.test(out);
    out = out.replace(importRe, "").replace(entryRe, "");
    if (!hadImport && !hadEntry) missing.push(slug);
  }
  return { src: out, missing };
}

/**
 * Remove pruned designs' DESIGN_OPTIONS entries (flat `{ slug: "x", … },`
 * object literals — no nested braces) and any MIXABLE_DESIGN_SLUGS lines
 * from designs/options.ts source.
 */
export function pruneDesignOptionsSource(
  src: string,
  slugs: readonly string[] = LIGHT_PRUNED_DESIGNS.map((d) => d.slug),
): PruneResult {
  let out = src;
  const missing: string[] = [];
  for (const slug of slugs) {
    const entryRe = new RegExp(
      `^[ \\t]*\\{[^{}]*?\\bslug:\\s*"${escapeRe(slug)}"[^{}]*?\\},[ \\t]*\\r?\\n`,
      "m",
    );
    const had = entryRe.test(out);
    out = out.replace(entryRe, "");
    if (!had) missing.push(slug);
    // Mixable-set membership (e.g. "hoptify") — plain string line inside the Set.
    out = out.replace(new RegExp(`^\\s*"${escapeRe(slug)}",[ \\t]*\\r?\\n`, "m"), "");
  }
  return { src: out, missing };
}

/**
 * Remove pruned designs' DESIGN_MOTIFS entries from
 * components/svg-items/design-motifs.ts source (pure-data map; the
 * marketplace-manifest invariant test requires every key to be a registered
 * design). Keys are quoted ("editorial-ink":) or bare idents (engineered:).
 */
export function pruneDesignMotifsSource(
  src: string,
  slugs: readonly string[] = LIGHT_PRUNED_DESIGNS.map((d) => d.slug),
): string {
  let out = src;
  for (const slug of slugs) {
    out = out.replace(
      new RegExp(`^\\s*(?:"${escapeRe(slug)}"|${escapeRe(slug)}):\\s*"[^"]*",[ \\t]*\\r?\\n`, "m"),
      "",
    );
  }
  return out;
}

/**
 * Remove the two WebMcpRegistrar lines from app/[locale]/layout.tsx source:
 * the import and the flag-gated JSX mount. Both are single, self-contained
 * lines containing the token, so a line filter is exact.
 */
export function pruneWebMcpFromLayoutSource(src: string): string {
  return src
    .split("\n")
    .filter((line) => !line.includes("WebMcpRegistrar"))
    .join("\n");
}

/**
 * Remove the proven-orphan deps (see LIGHT_PRUNED_DEPENDENCIES /
 * LIGHT_PRUNED_DEV_DEPENDENCIES) from a package.json source string. Runs
 * BEFORE install, so the scaffold never downloads them. Deps not present
 * (template drift) are reported in `missing` — never fatal. Formatting
 * follows the existing package.json convention (2-space JSON + newline,
 * same as migratePrismaConfig).
 */
export function prunePackageJsonForLight(
  src: string,
  deps: readonly string[] = LIGHT_PRUNED_DEPENDENCIES,
  devDeps: readonly string[] = LIGHT_PRUNED_DEV_DEPENDENCIES,
): PruneResult {
  const missing: string[] = [];
  let pkg: Record<string, unknown>;
  try {
    pkg = JSON.parse(src) as Record<string, unknown>;
  } catch {
    return { src, missing: [...deps, ...devDeps] };
  }
  const sections: ReadonlyArray<[string, readonly string[]]> = [
    ["dependencies", deps],
    ["devDependencies", devDeps],
  ];
  let changed = false;
  for (const [section, names] of sections) {
    const table = pkg[section] as Record<string, string> | undefined;
    for (const name of names) {
      if (table && name in table) {
        delete table[name];
        changed = true;
      } else {
        missing.push(name);
      }
    }
  }
  return { src: changed ? JSON.stringify(pkg, null, 2) + "\n" : src, missing };
}

/**
 * Remove the pruned deps' root-importer entries from pnpm-lock.yaml source so
 * the lockfile matches the pruned package.json. Without this, the first
 * `pnpm install` detects the mismatch and re-runs the resolution step
 * (measured ~+7 s warm, more on real networks); with it, pnpm reports
 * "Lockfile is up to date, resolution step is skipped" and never downloads
 * the pruned packages — verified e2e, pnpm does not rewrite the result.
 *
 * Scope: ONLY the `importers` section (everything before the top-level
 * `packages:`/`snapshots:` key). The now-unreachable entries left in
 * `packages:`/`snapshots:` are tolerated by pnpm (extra entries are ignored;
 * missing ones are not) and get pruned on its next natural lockfile write.
 * Each importer block is `      <name>:` (6-space key, alone on its line —
 * snapshot dep lines put the version on the same line, so they can't match)
 * followed by 8-space `specifier`/`version` lines. Fail-soft: a non-matching
 * name is reported in `missing`; a failed prune just means pnpm falls back to
 * the (slower) reconcile install, which the e2e proved keeps all pins.
 */
export function pruneLockfileForLight(
  src: string,
  names: readonly string[] = [...LIGHT_PRUNED_DEPENDENCIES, ...LIGHT_PRUNED_DEV_DEPENDENCIES],
): PruneResult {
  const boundary = src.search(/^(?:packages|snapshots):/m);
  let head = boundary === -1 ? src : src.slice(0, boundary);
  const tail = boundary === -1 ? "" : src.slice(boundary);
  const missing: string[] = [];
  for (const name of names) {
    const esc = escapeRe(name);
    const blockRe = new RegExp(
      `^      (?:'${esc}'|"${esc}"|${esc}):[ \\t]*\\r?\\n(?: {8}.*\\r?\\n)+`,
      "m",
    );
    if (blockRe.test(head)) head = head.replace(blockRe, "");
    else missing.push(name);
  }
  return { src: head + tail, missing };
}

/**
 * Light brand.config defaults on top of the website-corporate template patch:
 * the only plugin-tier flag the template ships default-ON is `newsletter` —
 * flip it off (the module stays; light is default-quiet). Everything else the
 * audit marks plugin/full-only is already false in the template (verified at
 * v0.34.0); core flags (aiStylist, mcpPublic, cartwrightBadge, welcomeGuide,
 * motion trio) keep their shipped defaults.
 */
export function patchBrandConfigForLightContent(src: string): string {
  return src.replace(/(\bnewsletter:\s*)true\b/, "$1false");
}

// ── Runner ──────────────────────────────────────────────────────────────────

export type LightProfileReport = {
  removedPaths: string[];
  warnings: string[];
};

export function applyCodemod(
  targetDir: string,
  relPath: string,
  transform: (src: string) => string,
  warnings: string[],
): void {
  const path = join(targetDir, relPath);
  if (!existsSync(path)) {
    warnings.push(`${relPath} not found — codemod skipped.`);
    return;
  }
  const original = readFileSync(path, "utf8");
  const patched = transform(original);
  if (patched !== original) writeFileSync(path, patched);
  else warnings.push(`${relPath} — codemod made no change (template drift?).`);
}

/**
 * Apply the light profile to a freshly downloaded scaffold. Fail-soft by
 * design: a missing path or non-matching codemod produces a warning, never a
 * crash — the scaffold must always complete. Writes .cartwright/profile.json
 * so future tooling (`npx cartwright add <x>`) can see what this project is.
 */
export function applyLightProfile(targetDir: string): LightProfileReport {
  const warnings: string[] = [];
  const removedPaths: string[] = [];

  for (const rel of LIGHT_EXCLUDED_PATHS) {
    const abs = join(targetDir, rel);
    if (!existsSync(abs)) continue;
    rmSync(abs, { recursive: true, force: true });
    removedPaths.push(rel);
  }

  applyCodemod(targetDir, join("designs", "index.ts"), (src) => {
    const r = pruneDesignIndexSource(src);
    for (const slug of r.missing) warnings.push(`designs/index.ts — no entry for "${slug}".`);
    return r.src;
  }, warnings);

  applyCodemod(targetDir, join("designs", "options.ts"), (src) => {
    const r = pruneDesignOptionsSource(src);
    for (const slug of r.missing) warnings.push(`designs/options.ts — no entry for "${slug}".`);
    return r.src;
  }, warnings);

  applyCodemod(targetDir, join("plugins", "registry.ts"), (src) => {
    const r = prunePluginsRegistrySource(src);
    for (const slug of r.missing) warnings.push(`plugins/registry.ts — no entry for "${slug}".`);
    return r.src;
  }, warnings);

  applyCodemod(
    targetDir,
    join("components", "svg-items", "design-motifs.ts"),
    (src) => pruneDesignMotifsSource(src),
    warnings,
  );

  applyCodemod(
    targetDir,
    join("app", "[locale]", "layout.tsx"),
    pruneWebMcpFromLayoutSource,
    warnings,
  );

  applyCodemod(targetDir, "brand.config.ts", patchBrandConfigForLightContent, warnings);

  applyCodemod(targetDir, "package.json", (src) => {
    const r = prunePackageJsonForLight(src);
    // Already-absent deps are the EXPECTED state once the engine removes them
    // at the source (e.g. @ai-sdk/openai + ts-node, engine PR #212) — staying
    // silent keeps the scaffold output clean for AIs that treat warnings as
    // findings. The prune itself remains fail-soft either way.
    return r.src;
  }, warnings);

  // Keep pnpm-lock.yaml in sync with the pruned package.json so the first
  // install skips the resolution step. Only relevant for pnpm users (other
  // package managers get no lockfile from tryInstall anyway); if the template
  // ever stops shipping a pnpm lockfile this is a skipped no-op.
  if (existsSync(join(targetDir, "pnpm-lock.yaml"))) {
    applyCodemod(targetDir, "pnpm-lock.yaml", (src) => {
      const r = pruneLockfileForLight(src);
      for (const name of r.missing) {
        warnings.push(`pnpm-lock.yaml — no importer entry for "${name}".`);
      }
      return r.src;
    }, warnings);
  }

  // Profile marker for future `cartwright add` tooling.
  try {
    const markerDir = join(targetDir, ".cartwright");
    mkdirSync(markerDir, { recursive: true });
    writeFileSync(
      join(markerDir, "profile.json"),
      JSON.stringify(
        {
          profile: "light",
          generatedBy: "create-cartwright",
          keptDesigns: LIGHT_KEPT_DESIGNS,
          excludedPaths: removedPaths,
          prunedDependencies: [
            ...LIGHT_PRUNED_DEPENDENCIES,
            ...LIGHT_PRUNED_DEV_DEPENDENCIES,
          ],
        },
        null,
        2,
      ) + "\n",
    );
  } catch {
    warnings.push(".cartwright/profile.json could not be written.");
  }

  return { removedPaths, warnings };
}

/** Human summary for the scaffold note. */
export function lightProfileNote(): string {
  return [
    "Profile: light (default) — a real site: design, database, backend — live in minutes.",
    "Excluded from this scaffold: A2A/agent-marketplace, UCP identity-linking, WebMCP,",
    `hoptify, and ${LIGHT_PRUNED_DESIGNS.length} non-curated design packs (kept: ${LIGHT_KEPT_DESIGNS.filter((s) => s !== "studio" && s !== "aurora-shop").join(", ")}).`,
    "Add a design back any time:  npx cartwright design install <slug>",
    "Want everything? Re-scaffold with:  npx create-cartwright --profile full",
  ].join("\n");
}
