import { existsSync, readFileSync, writeFileSync, unlinkSync, rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import pc from "picocolors";

export type Database = "turso" | "postgres" | "sqlite";
export type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

/**
 * Industry templates the CLI knows about. Each maps to:
 *   - the seed-data slug in industry-templates/<slug>/seed-data.ts
 *   - a set of default brand.mode + brand.features values
 *
 * Customers can still override any field after scaffold by editing
 * brand.config.ts directly. These are starting points, not constraints.
 */
export type TemplateSlug =
  | "website-corporate"
  | "coffee"
  | "sunglasses"
  | "agent-marketplace"
  | "generic";

export const TEMPLATE_SLUGS: ReadonlyArray<TemplateSlug> = [
  "website-corporate",
  "coffee",
  "sunglasses",
  "agent-marketplace",
  "generic",
];

/**
 * Per-template defaults written into brand.config.ts after download.
 * Keys mirror brand.config.ts shape (mode + features.*).
 */
export type TemplateDefaults = {
  mode: "website" | "webshop" | "agent-marketplace";
  features: {
    webshop: boolean;
    acp: boolean;
    a2a: boolean;
    adminAgenticDashboard: boolean;
  };
};

export const TEMPLATE_DEFAULTS: Readonly<Record<TemplateSlug, TemplateDefaults>> = {
  "website-corporate": {
    mode: "website",
    features: {
      webshop: false,
      acp: false,
      a2a: false,
      adminAgenticDashboard: false,
    },
  },
  coffee: {
    mode: "webshop",
    features: {
      webshop: true,
      acp: false,
      a2a: false,
      adminAgenticDashboard: false,
    },
  },
  sunglasses: {
    mode: "webshop",
    features: {
      webshop: true,
      acp: false,
      a2a: false,
      adminAgenticDashboard: false,
    },
  },
  "agent-marketplace": {
    mode: "agent-marketplace",
    features: {
      webshop: false,
      acp: true,
      a2a: true,
      adminAgenticDashboard: true,
    },
  },
  generic: {
    mode: "webshop",
    features: {
      webshop: true,
      acp: false,
      a2a: false,
      adminAgenticDashboard: false,
    },
  },
};

export function isTemplateSlug(value: unknown): value is TemplateSlug {
  return typeof value === "string" && TEMPLATE_SLUGS.includes(value as TemplateSlug);
}

export function detectPackageManager(): PackageManager {
  const ua = process.env.npm_config_user_agent ?? "";
  if (ua.startsWith("pnpm")) return "pnpm";
  if (ua.startsWith("yarn")) return "yarn";
  if (ua.startsWith("bun")) return "bun";
  return "npm";
}

export function generateAuthSecret(): string {
  return randomBytes(32).toString("hex");
}

export function patchEnvLocal(targetDir: string, authSecret: string): void {
  const envExamplePath = join(targetDir, ".env.example");
  if (!existsSync(envExamplePath)) return;
  const example = readFileSync(envExamplePath, "utf8");
  const patched = example.replace(
    /^AUTH_SECRET=.*/m,
    `AUTH_SECRET="${authSecret}"`,
  );
  writeFileSync(join(targetDir, ".env.local"), patched);

  // The Prisma CLI (migrate/seed) only auto-loads `.env` — never `.env.local`,
  // which is a Next.js-only convention. Without this, the documented next
  // steps (`prisma migrate deploy` + `prisma db seed`) fail out of the box
  // with "Environment variable not found: DATABASE_URL". Mirror DATABASE_URL
  // into `.env` so the CLI finds it; Next.js still reads .env.local at runtime.
  const dbUrl = patched.match(/^DATABASE_URL=.*/m);
  if (dbUrl) {
    writeFileSync(
      join(targetDir, ".env"),
      `# Prisma CLI reads .env (not .env.local). DATABASE_URL lives here so\n` +
        `# \`prisma migrate\` / \`prisma db seed\` work; Next.js reads .env.local at runtime.\n` +
        `${dbUrl[0]}\n`,
    );
  }
}

export function titleCase(projectName: string): string {
  return projectName
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

export function patchBrandConfigContent(original: string, projectName: string): string {
  const storeName = titleCase(projectName);
  let out = original
    .replace(/storeName:\s*"[^"]*"/, `storeName: "${storeName}"`)
    .replace(/storeSlug:\s*"[^"]*"/, `storeSlug: "${projectName}"`);

  // Strip the upstream template's own brand identity. The engine repo doubles
  // as the live Teloz site, so its brand.config.ts ships Teloz values. Without
  // this every scaffold leaks "Teloz Agency" as the SEO/OG title, teloz.net as
  // the domain + canonical URL, and @teloz.net contact + seeded-admin emails
  // (the seed creates its admin user from brand.emails.admin).
  out = out
    // domain, url and every @teloz.net email → neutral, RFC-2606 placeholder
    .replace(/teloz\.net/g, "example.com")
    // legal/company name (legalName + footer disclaimer) → the store name
    .replaceAll("Teloz ApS", storeName)
    // SEO/OG title (consumed by layout, manifest, PDP/PLP, mcp.json)
    .replace(/(metadata:\s*\{[^}]*?\btitle:\s*)"[^"]*"/, `$1"${storeName}"`)
    // SEO/OG description (also feeds llms.txt + AI prompts)
    .replace(/(metadata:\s*\{[^}]*?\bdescription:\s*)"[^"]*"/, `$1"${storeName}"`)
    // email sender display name
    .replace(/fromName:\s*"[^"]*"/, `fromName: "${storeName}"`);

  return out;
}

/**
 * Strip the upstream template's hardcoded Teloz footer attribution from a
 * components/Footer.tsx source string. The footer hardcodes "Ejet og drevet af
 * Teloz ApS" (→ teloz.net) plus a personal GitHub link (Teloz1870) — correct
 * for the engine repo (which IS the Teloz site) but wrong on every customer's
 * footer. These are pure-text replacements, so they never introduce unused
 * variables or break the customer's build.
 *
 * FORWARD-COMPAT (engine "first impression" PR): the engine is moving the
 * footer owner line into brand-config fields (`brand.legalName` +
 * `brand.footer.ownerUrl`) and rendering them via i18n. On such templates
 * Footer.tsx no longer hardcodes any Teloz text, so every replacement below
 * silently no-ops — which is correct, because the config fields are already
 * de-Telozified by patchBrandConfigContent (its global "Teloz ApS"→storeName
 * and teloz.net→example.com replacements cover legalName + ownerUrl). Both
 * template generations are therefore handled fail-soft with no extra code.
 */
export function patchFooterContent(original: string, storeName: string): string {
  return original
    // Remove the upstream personal GitHub link block entirely
    .replace(
      /\s*<p>\s*<a href="https:\/\/github\.com\/Teloz1870"[\s\S]*?<\/a>\s*<\/p>/,
      "",
    )
    .replaceAll("Teloz ApS", storeName)
    .replace(/teloz\.net/g, "example.com");
}

/**
 * Apply the per-template defaults to a brand.config.ts source string.
 * Patches:
 *   - industryTemplate: "<slug>"
 *   - mode: "<mode>"
 *   - features.webshop, features.acp, features.a2a, features.adminAgenticDashboard
 *
 * The replacements are regex-anchored to the exact field shape produced by
 * the upstream brand.config.ts. If that shape ever changes the regexes here
 * will silently no-op (no replacement) — the corresponding unit test catches
 * that case.
 */
export function patchBrandConfigForTemplate(
  original: string,
  template: TemplateSlug,
): string {
  const defaults = TEMPLATE_DEFAULTS[template];
  let out = original;

  // industryTemplate: "xxx"   (single-line)
  //
  // CRITICAL: emit a union-typed cast, not a bare literal. The template ships
  // `industryTemplate: "saas"` (a literal), and 7+ files compare it like
  // `brand.industryTemplate === "saas"`. If we patch it to a bare literal
  // ("generic" etc.), TypeScript narrows the type and every such comparison
  // becomes a "no overlap" error — `next build` (and any Vercel deploy) fails,
  // even though `next dev` silently tolerates it. The `as <union>` cast keeps
  // every comparison valid. (Mirrors the existing `mode` cast and CLAUDE.md's
  // demo-refresh note.) The regex also swallows any pre-existing `as ...` cast
  // so we never double-cast.
  out = out.replace(
    /industryTemplate:\s*"[^"]*"(?:\s+as\s+[^,\n]+)?/,
    `industryTemplate: "${template}" as "saas" | "coffee" | "sunglasses" | "studio" | "generic" | "website-corporate" | "agent-marketplace"`,
  );

  // mode: "xxx" as "website" | "webshop" | "agent-marketplace"
  // We replace just the literal value inside the leading quotes, preserving
  // the `as ...` type assertion if present.
  out = out.replace(
    /mode:\s*"(?:website|webshop|agent-marketplace)"/,
    `mode: "${defaults.mode}"`,
  );

  // features.webshop|acp|a2a|adminAgenticDashboard: <bool>
  for (const [key, value] of Object.entries(defaults.features)) {
    const re = new RegExp(`(${key}:\\s*)(?:true|false)`, "g");
    out = out.replace(re, `$1${value}`);
  }

  // ecommerceEnabled must track the webshop feature. The upstream template
  // ships `ecommerceEnabled: false` (Teloz is website-mode), so a webshop
  // scaffold would otherwise render with cart + product nav gated OFF while
  // mode === "webshop" — an internally inconsistent config. Keep them in sync.
  out = out.replace(
    /ecommerceEnabled:\s*(?:true|false)/,
    `ecommerceEnabled: ${defaults.features.webshop}`,
  );

  return out;
}

/**
 * Result of a fail-soft "first impression" codemod: the (possibly) patched
 * source plus human-readable warnings for every anchor that didn't match
 * (template drift). Warnings are shown in a non-fatal note — the scaffold
 * must always complete (same philosophy as profile-light's PruneResult).
 */
export type PatchResult = { src: string; warnings: string[] };

/**
 * English-first scaffolds (owner decision 2026-06-11: scaffolds are born
 * en-only; the engine repo keeps da-first because it IS the live Teloz site).
 * Patches brand.config.ts:
 *   - locales: ["da", "en"] as const  → ["en"] as const
 *   - defaultLocale: "da"             → "en"
 *   - footer.tagline (Danish "Bygget med Cartwright Engine …") → English
 *   - footer.disclaimer               → "<storeName> · All rights reserved."
 *
 * i18n/routing.ts reads locales + defaultLocale straight from brand config,
 * so nothing else needs to move. Every replacement is anchored to the shape
 * the v0.35.x template ships; a non-matching anchor warns and skips (never
 * crashes), so the CLI keeps working against future templates that already
 * changed these fields.
 */
export function patchBrandConfigForEnglishFirst(
  original: string,
  storeName: string,
): PatchResult {
  const warnings: string[] = [];
  let out = original;

  const apply = (label: string, re: RegExp, replacement: () => string): void => {
    if (!re.test(out)) {
      warnings.push(`${label} — anchor not found, skipped (template drift?).`);
      return;
    }
    // Replacement via callback so storeName containing "$" can never be
    // misread as a regex replacement pattern.
    out = out.replace(re, replacement);
  };

  apply(
    "locales",
    /locales:\s*\[[^\]]*\]\s*as\s*const/,
    () => `locales: ["en"] as const`,
  );
  apply("defaultLocale", /defaultLocale:\s*"[^"]*"/, () => `defaultLocale: "en"`);
  // footer.tagline — anchored on the Danish copy itself ("tagline:" alone is
  // ambiguous: brand.tagline, website.tagline and heroSubtagline also exist).
  apply(
    "footer.tagline",
    /"Bygget med Cartwright Engine[^"]*"/,
    () =>
      `"Built with the Cartwright Engine — an AI-powered platform for modern sites and commerce."`,
  );
  // footer.disclaimer — the `disclaimer:` key is unique in brand.config.ts.
  // patchBrandConfigContent has usually already swapped "Teloz ApS" for the
  // store name here; this replaces the whole Danish CVR boilerplate.
  apply(
    "footer.disclaimer",
    /disclaimer:\s*"[^"]*"/,
    () => `disclaimer: "${storeName} · All rights reserved."`,
  );

  return { src: out, warnings };
}

/**
 * De-Teloz the website-mode hero copy (brand.config.ts `website` object) so a
 * fresh scaffold's first H1 isn't Teloz's studio pitch:
 *   - eyebrow "v0.6 launch"                     → "" (stale launch badge)
 *   - headline "Ship software that ships itself" → "Welcome to <storeName>"
 *   - tagline "A studio template built on …"     → neutral one-liner
 *
 * Deliberately anchored on the EXACT Teloz strings (not the keys) so a
 * template whose copy already changed warns + skips instead of clobbering.
 * valueProps/features/steps arrays are NOT touched — multi-line regex over
 * those is fragile, and the engine's first-run Welcome Canvas owns the first
 * render anyway (setup/AI rewrites the rest).
 */
export function patchWebsiteCopyForScaffold(
  original: string,
  storeName: string,
): PatchResult {
  const warnings: string[] = [];
  let out = original;

  const apply = (label: string, re: RegExp, replacement: () => string): void => {
    if (!re.test(out)) {
      warnings.push(`${label} — anchor not found, skipped (template drift?).`);
      return;
    }
    out = out.replace(re, replacement);
  };

  apply("website.eyebrow", /"v0\.6 launch"/, () => `""`);
  apply(
    "website.headline",
    /"Ship software that ships itself"/,
    () => `"Welcome to ${storeName}"`,
  );
  apply(
    "website.tagline",
    /"A studio template built on Cartwright[^"]*"/,
    () => `"A fast, AI-ready site — make it say anything you want."`,
  );

  return { src: out, warnings };
}

/**
 * Arm the first-run experience in the scaffolded prisma/seed.ts:
 * `setupComplete: true` → `setupComplete: false`.
 *
 * The template's seed marks setupComplete=true (Solbrillen-legacy: an
 * existing shop must not re-trigger the wizard), which on a FRESH scaffold
 * means the documented "first login → /admin/setup wizard" never fires AND
 * the engine's first-run Welcome Canvas predicate can never arm. Flipping it
 * repairs both. Safe on re-seed: the upsert's `update: {}` never un-completes
 * a shop that finished setup. Fail-soft: warns on drift, never crashes.
 */
export function patchSeedSetupComplete(original: string): PatchResult {
  const re = /(\bsetupComplete:\s*)true\b/;
  if (!re.test(original)) {
    return {
      src: original,
      warnings: [
        "setupComplete: true — anchor not found, skipped (seed already fixed upstream, or template drift).",
      ],
    };
  }
  return { src: original.replace(re, "$1false"), warnings: [] };
}

/**
 * Flip `firstRunWelcome: false` → `true` in the scaffolded brand.config.ts so
 * the engine's first-run Welcome Canvas shows on the customer's first visit.
 *
 * CROSS-PR COMPATIBILITY: the flag ships with the engine's Welcome Canvas PR
 * (default false → canaries immune). Templates at or below v0.35.1 don't have
 * the key at all — in that case this warns + skips so the CLI works against
 * both current and future templates (the established drift philosophy).
 * Already-true is a silent no-op (idempotent).
 */
export function patchBrandConfigForFirstRunWelcome(original: string): PatchResult {
  if (/\bfirstRunWelcome:\s*true\b/.test(original)) {
    return { src: original, warnings: [] };
  }
  const re = /(\bfirstRunWelcome:\s*)false\b/;
  if (!re.test(original)) {
    return {
      src: original,
      warnings: [
        "firstRunWelcome flag not found — skipped (template predates the first-run Welcome Canvas; the flag ships with a newer engine release).",
      ],
    };
  }
  return { src: original.replace(re, "$1true"), warnings: [] };
}

/**
 * The template's HeroVideo hardcodes <source> tags for /hero/hero-v4.webm+mp4,
 * which are demo-specific assets NOT shipped in the base template — so a fresh
 * scaffold 404s on both. Removing the <source> tags leaves a poster-only <video>
 * (no network request, no 404); all refs/state stay used so the build is safe.
 */
export function patchHeroVideoContent(original: string): string {
  return original.replace(
    /\s*<source\s+src="\/hero\/hero-v4\.(?:webm|mp4)"[^>]*\/>/g,
    "",
  );
}

/**
 * The catalog filters render "Frame color" / "Lens color" selects
 * unconditionally — eyewear-specific fields that show as empty dropdowns on
 * non-eyewear shops. Wrap each block in a length guard so it only renders when
 * the shop actually has those attributes (eyewear keeps them; everyone else
 * hides them). Wrapping (not deleting) keeps frameColors/lensColors used.
 */
export function patchCatalogFiltersContent(original: string): string {
  return original
    .replace(
      /(\{\/\* Frame color \*\/\}\s*)(<div>[\s\S]*?<\/div>)/,
      `$1{frameColors.length > 0 && (\n        $2\n      )}`,
    )
    .replace(
      /(\{\/\* Lens color \*\/\}\s*)(<div>[\s\S]*?<\/div>)/,
      `$1{lensColors.length > 0 && (\n        $2\n      )}`,
    );
}

/**
 * Next's metadata icon route (`app/icon.tsx` → `/icon`) has no file extension,
 * so the proxy matcher's `.*\..*` exclusion doesn't catch it. next-intl then
 * locale-prefixes it to `/da/icon`, which 404s (the icon route isn't under
 * `[locale]`). Add `icon` to the matcher's exclusion list so the request is
 * served directly. Idempotent: skips if already excluded.
 */
export function patchProxyContent(original: string): string {
  if (original.includes("favicon.ico|icon|")) return original;
  return original.replace(/favicon\.ico\|/, "favicon.ico|icon|");
}

function renderPrismaConfig(seedCmd: string): string {
  return `import path from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma stops auto-loading .env once a config file exists, so load it here.
// .env first (DATABASE_URL for the CLI), then .env.local (Next.js runtime).
loadEnv({ path: ".env" });
loadEnv({ path: ".env.local" });

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: ${JSON.stringify(seedCmd)},
  },
});
`;
}

/**
 * Migrate the deprecated `package.json#prisma` block to a `prisma.config.ts`
 * (Prisma 7 removes the package.json key — the template currently triggers a
 * deprecation warning on every prisma command). The generated config also loads
 * dotenv so DATABASE_URL still resolves, because Prisma stops auto-loading
 * `.env` once a config file exists. No-op if the template already ships a
 * prisma.config.ts or has no `prisma` key.
 */
export function migratePrismaConfig(targetDir: string): void {
  const configPath = join(targetDir, "prisma.config.ts");
  const pkgPath = join(targetDir, "package.json");
  if (existsSync(configPath) || !existsSync(pkgPath)) return;
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  const seedCmd: string | undefined = pkg.prisma?.seed;
  if (!seedCmd) return;
  delete pkg.prisma;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  writeFileSync(configPath, renderPrismaConfig(seedCmd));
}

/**
 * Replace the template's drifted migration history with a single clean baseline
 * generated from schema.prisma. The shipped migrations reference tables that no
 * migration creates (Lead, MigrationJob, Service, Subscription — schema drifted
 * ahead via `db push` during development), so `prisma migrate deploy` fails on a
 * fresh DB with P3018. A from-empty baseline makes `migrate deploy` succeed
 * while `db push` keeps working.
 *
 * Best-effort and sqlite/turso only (the template's schema uses the sqlite
 * provider; postgres scaffolds switch the provider manually). Runs AFTER install
 * so the local prisma CLI is available. If the diff fails it leaves the existing
 * migrations untouched (db push remains the documented path either way).
 */
export function regenerateMigrationBaseline(targetDir: string, database: Database): void {
  if (database === "postgres") return;
  const schemaPath = join(targetDir, "prisma", "schema.prisma");
  if (!existsSync(schemaPath)) return;

  // Generate the full from-empty SQL BEFORE touching anything on disk. Two Prisma 7
  // gotchas handled here: (1) the flag is `--to-schema` (7.x renamed it from the old
  // `--to-schema-datamodel`, which silently made this a no-op), and (2) the schema
  // engine can fail transiently on first invocation ("Schema engine error"), so we
  // retry once.
  let sql = "";
  for (let attempt = 0; attempt < 2 && !sql; attempt++) {
    try {
      const out = execSync(
        "npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script",
        { cwd: targetDir, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
      );
      // Prisma's config loader prints dotenv banners to stdout before the SQL; keep
      // only from the first statement so the written migration file is valid SQL.
      const start = out.indexOf("-- CreateTable");
      if (start !== -1) sql = out.slice(start);
    } catch {
      // transient schema-engine error → retry once; if both fail, leave migrations as-is
    }
  }
  if (!sql.includes("CREATE TABLE")) return; // sanity guard / both attempts failed

  const migrationsDir = join(targetDir, "prisma", "migrations");
  rmSync(migrationsDir, { recursive: true, force: true });
  const initDir = join(migrationsDir, "00000000000000_init");
  mkdirSync(initDir, { recursive: true });
  writeFileSync(join(initDir, "migration.sql"), sql);
  writeFileSync(join(migrationsDir, "migration_lock.toml"), 'provider = "sqlite"\n');
}

export function tryGitInit(targetDir: string): boolean {
  try {
    execSync(
      "git init -q && git add -A && git commit -q -m 'feat: initial commit from create-cartwright'",
      { cwd: targetDir, stdio: "ignore" },
    );
    return true;
  } catch {
    return false;
  }
}

const LOCKFILE_BY_PM: Record<PackageManager, string> = {
  npm: "package-lock.json",
  pnpm: "pnpm-lock.yaml",
  yarn: "yarn.lock",
  bun: "bun.lockb",
};

export function tryInstall(targetDir: string, pm: PackageManager): boolean {
  try {
    // Keep ONLY the lockfile matching the chosen package manager. The template
    // commits a tested package-lock.json; deleting it (the old behaviour) made
    // the install resolve `^`-ranges to newer, UNTESTED versions, causing type
    // drift that breaks `next build` — e.g. a newer Stripe SDK rejecting the
    // pinned `apiVersion` literal. Keeping the matching lockfile pins the exact
    // tested versions, so a fresh scaffold builds like the template does.
    const keep = LOCKFILE_BY_PM[pm];
    for (const lockfile of Object.values(LOCKFILE_BY_PM)) {
      if (lockfile === keep) continue;
      const lockPath = join(targetDir, lockfile);
      if (existsSync(lockPath)) {
        unlinkSync(lockPath);
      }
    }
    execSync(`${pm} install`, { cwd: targetDir, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export function databaseNote(db: Database): string {
  switch (db) {
    case "turso":
      return [
        pc.bold("Turso setup (production):"),
        "  turso db create my-shop-db",
        "  turso db tokens create my-shop-db",
        pc.dim("  Set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN in Vercel."),
      ].join("\n");
    case "postgres":
      return [
        pc.bold("Postgres setup:"),
        "  Update DATABASE_URL in .env.local to your Postgres URL.",
        pc.dim("  Prisma schema currently uses 'sqlite' provider — switch to 'postgresql' in prisma/schema.prisma and run a fresh migration."),
      ].join("\n");
    case "sqlite":
      return [
        pc.bold("SQLite (local only):"),
        "  No extra setup. dev.db is created by `prisma db push`.",
      ].join("\n");
  }
}
