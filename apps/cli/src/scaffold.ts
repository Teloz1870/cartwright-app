import { existsSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
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
  out = out.replace(
    /industryTemplate:\s*"[^"]*"/,
    `industryTemplate: "${template}"`,
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

export function tryInstall(targetDir: string, pm: PackageManager): boolean {
  try {
    // Remove conflicting lockfiles from the template before installing
    const lockfiles = ["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lockb"];
    for (const lockfile of lockfiles) {
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
