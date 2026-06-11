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
 *   - package.json dependencies: untouched so the committed lockfile keeps
 *     pinning tested versions.
 */
import { existsSync, readFileSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export type Profile = "light" | "full";
export const PROFILES: ReadonlyArray<Profile> = ["light", "full"];

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
  // ── FULL-ONLY: WebMCP (audit §3; layout mount removed via codemod) ───────
  "lib/webmcp",
  "components/WebMcpRegistrar.tsx",
  "components/WebMcpCheck.tsx",
  "app/[locale]/webmcp-check",
  "tests/unit/webmcp-paths.test.ts",
  // ── hoptify (audit §4 owner call; its design pack is pruned anyway) ──────
  "lib/hoptify",
  "app/admin/hoptify",
  "tests/unit/hoptify-design.test.ts",
  "tests/unit/hoptify-migrate.test.ts",
  // ── Non-curated design packs (re-install: `cartwright design install <slug>`)
  ...LIGHT_PRUNED_DESIGNS.map((d) => `designs/${d.slug}`),
  // Pins the FULL design registry (asserts hoptify is mixable) — invalid after the trim.
  "tests/unit/design-mixable.test.ts",
];

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

function applyCodemod(
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
