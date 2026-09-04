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
    /**
     * WebMCP in-browser agent tools. Webshop templates scaffold with this ON
     * ("WebMCP-native out of the box"): the flag is runtime-tier with an
     * ecommerce precondition, the registrar no-ops in browsers without
     * document.modelContext, and flag-off renders stay byte-identical — so
     * the flip is inert everywhere except an agent-capable browser on an
     * actual webshop.
     */
    webMcp: boolean;
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
      webMcp: false,
    },
  },
  coffee: {
    mode: "webshop",
    features: {
      webshop: true,
      acp: false,
      a2a: false,
      adminAgenticDashboard: false,
      webMcp: true,
    },
  },
  sunglasses: {
    mode: "webshop",
    features: {
      webshop: true,
      acp: false,
      a2a: false,
      adminAgenticDashboard: false,
      webMcp: true,
    },
  },
  "agent-marketplace": {
    mode: "agent-marketplace",
    features: {
      webshop: false,
      acp: true,
      a2a: true,
      adminAgenticDashboard: true,
      webMcp: false,
    },
  },
  generic: {
    mode: "webshop",
    features: {
      webshop: true,
      acp: false,
      a2a: false,
      adminAgenticDashboard: false,
      webMcp: true,
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
  // `npx create-cartwright` always reports npm in the user agent — even on
  // pnpm machines. Every doc in the scaffold says `pnpm <cmd>`, so an
  // npm-locked scaffold guarantees a package-manager mismatch the moment the
  // owner (or their AI) runs `pnpm add …` (found live by a customer AI:
  // "Moving … installed by a different package manager to node_modules/.ignored").
  // Prefer pnpm when it exists on the machine; explicit --pm always wins.
  try {
    execSync("pnpm --version", { stdio: "ignore" });
    return "pnpm";
  } catch {
    return "npm";
  }
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

/**
 * Domains the ENGINE uses for its OWN identity. Any of these sitting in a
 * config VALUE is upstream identity that must never reach a customer scaffold.
 *
 * Why this is a list and not one literal: the engine rebranded teloz.net →
 * cartwright.app in #289 ("rebrand repo identity Teloz → Cartwright"), and this
 * stripper still only knew `teloz.net`. The exact leak its docblock was written
 * to prevent came straight back under the new domain — every scaffold shipped
 * `url: "https://cartwright.app"` as its CANONICAL url, `admin@cartwright.app`
 * as the seeded admin login, and `kontakt@cartwright.app` on its /contact page.
 * A new engine domain must be ADDED here, never swapped in.
 */
export const ENGINE_DOMAINS: ReadonlyArray<string> = ["teloz.net", "cartwright.app"];

/** RFC-2606 reserved — safe to publish, obviously a placeholder. */
const PLACEHOLDER_DOMAIN = "example.com";

/**
 * Replace engine domains inside QUOTED STRING VALUES only, skipping comment
 * lines. A blunt global replace would rewrite the documentation URLs the config
 * deliberately carries (`… on cartwright.app`, `pricing landerer på
 * cartwright.app`), turning helpful pointers into dead example.com links.
 * Measured on a v0.54.0 scaffold: 7 identity fields must change, 3 comment
 * mentions must not.
 *
 * Operating per line on quoted spans also covers array elements (e.g.
 * `sameAs: [...]`), which a `field:`-anchored regex would miss.
 */
/** A comment line, for the purposes of both patchers below. */
export function isCommentLine(line: string): boolean {
  const t = line.trimStart();
  return t.startsWith("*") || t.startsWith("//") || t.startsWith("/*");
}

/**
 * Blank every comment line, preserving length so indices still address the
 * original. Lets a regex be run "as if" comments did not exist and the result
 * spliced back into the real text — see patchBrandConfigSameAs.
 */
export function maskCommentLines(src: string): string {
  return src
    .split("\n")
    .map((line) => (isCommentLine(line) ? " ".repeat(line.length) : line))
    .join("\n");
}

export function stripEngineDomains(src: string): string {
  return src
    .split("\n")
    .map((line) => {
      if (isCommentLine(line)) {
        return line;
      }
      return line.replace(/"([^"]*)"/g, (whole, inner: string) => {
        let next = inner;
        for (const domain of ENGINE_DOMAINS) next = next.split(domain).join(PLACEHOLDER_DOMAIN);
        return next === inner ? whole : `"${next}"`;
      });
    })
    .join("\n");
}

export function patchBrandConfigContent(original: string, projectName: string): string {
  const storeName = titleCase(projectName);
  let out = original
    .replace(/storeName:\s*"[^"]*"/, `storeName: "${storeName}"`)
    .replace(/storeSlug:\s*"[^"]*"/, `storeSlug: "${projectName}"`);

  // Strip the upstream template's own brand identity. The engine repo doubles
  // as a live site, so its brand.config.ts ships OUR values. Without this every
  // scaffold leaks the engine's SEO/OG title, its domain + canonical URL, and
  // its contact + seeded-admin emails (the seed creates its admin user from
  // brand.emails.admin).
  out = stripEngineDomains(out);

  out = out
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
 *   - features.webshop, features.acp, features.a2a, features.adminAgenticDashboard,
 *     features.webMcp
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

export const SCAFFOLD_CURRENCIES = ["USD", "EUR", "GBP", "DKK", "SEK", "NOK"] as const;
export type ScaffoldCurrency = (typeof SCAFFOLD_CURRENCIES)[number];
export const SCAFFOLD_COUNTRIES = ["US", "GB", "DE", "DK", "SE", "NO"] as const;
export type ScaffoldCountry = (typeof SCAFFOLD_COUNTRIES)[number];

const COUNTRY_NAMES: Record<ScaffoldCountry, string> = {
  US: "United States",
  GB: "United Kingdom",
  DE: "Germany",
  DK: "Denmark",
  SE: "Sweden",
  NO: "Norway",
};

// Canonical units per one DKK. Every scaffold is re-anchored from these
// relative values so its selected base currency is always exactly rate 1.
const CURRENCY_PER_DKK: Record<ScaffoldCurrency, number> = {
  USD: 0.145,
  EUR: 0.134,
  GBP: 0.115,
  DKK: 1,
  SEK: 1.5,
  NOK: 1.57,
};
const CURRENCY_LABELS: Record<ScaffoldCurrency, string> = {
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  DKK: "Danish Krone",
  SEK: "Swedish Krona",
  NOK: "Norwegian Krone",
};

export function isScaffoldCurrency(value: string): value is ScaffoldCurrency {
  return SCAFFOLD_CURRENCIES.includes(value.toUpperCase() as ScaffoldCurrency);
}

export function isScaffoldCountry(value: string): value is ScaffoldCountry {
  return SCAFFOLD_COUNTRIES.includes(value.toUpperCase() as ScaffoldCountry);
}

/** Patch country + base currency independently from language. */
export function patchBrandConfigForMarket(
  original: string,
  currency: ScaffoldCurrency,
  country: ScaffoldCountry,
): PatchResult {
  const warnings: string[] = [];
  let out = original;
  const apply = (
    label: string,
    re: RegExp,
    replacement: (match: string, ...groups: string[]) => string,
  ): void => {
    if (!re.test(out)) {
      warnings.push(`${label} — anchor not found, skipped (template drift?).`);
      return;
    }
    out = out.replace(re, replacement);
  };

  apply(
    "policies.currency",
    /(policies:\s*\{[\s\S]*?\bcurrency:\s*)"[A-Z]{3}"/,
    (_match, prefix) => `${prefix}"${currency}"`,
  );
  apply(
    "policies.country",
    /(policies:\s*\{[\s\S]*?\bcountry:\s*)"[A-Z]{2}"/,
    (_match, prefix) => `${prefix}"${country}"`,
  );
  apply(
    "company.country",
    /(company:\s*\{[\s\S]*?\bcountry:\s*)"[^"]*"(?:\s+as\s+string)?/,
    (_match, prefix) => `${prefix}"${COUNTRY_NAMES[country]}" as string`,
  );

  const basePerDkk = CURRENCY_PER_DKK[currency];
  const rows = SCAFFOLD_CURRENCIES.map((code) => {
    const rate = Number((CURRENCY_PER_DKK[code] / basePerDkk).toFixed(8));
    return `      ${code}: { rate: ${rate}, label: "${CURRENCY_LABELS[code]}" },`;
  }).join("\n");
  apply(
    "policies.supportedCurrencies",
    /supportedCurrencies:\s*\{(?:\s*[A-Z]{3}:\s*\{[^}]*\},?)*\s*\}(?:\s+as\s+Record<string,\s*\{[^}]+\}>)?,/,
    () =>
      `supportedCurrencies: {\n${rows}\n    } as Record<string, { rate: number; label: string }>,`,
  );

  return { src: out, warnings };
}

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
  // contact.hours — a placeholder the owner is meant to replace, but it renders
  // verbatim on the public contact page (app/[locale]/contact/page.tsx), so an
  // English scaffold's contact page read "Hverdage 9-17" until someone noticed.
  // Anchored on the Danish copy itself rather than the `hours:` key: the value
  // is what identifies the string we mean to replace, and anchoring on it means
  // a template that already fixed this is left alone instead of overwritten.
  apply("contact.hours", /"Hverdage 9-17"/, () => `"Weekdays 9-17"`);

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
 * Set the look's skin as the explicit design pack (`--look <url>`):
 * `designSlug: undefined as string | undefined` → `designSlug: "<skin>" as …`.
 *
 * Config beats DB in the engine's design resolution (lib/theme.ts
 * getActiveDesign: brand.designSlug ?? row.designSlug ?? inference), so this
 * is the trusted, committable way to pin the design — exactly what
 * /admin/designs tells customers to do by hand. Anchored on the template's
 * exact field shape (incl. a previously-set quoted value, so the patch is
 * idempotent); drift warns + skips per the established fail-soft contract.
 * The caller validates `skin` as a kebab-case slug before this runs.
 */
export function patchBrandConfigDesignSlug(original: string, skin: string): PatchResult {
  const re = /designSlug:\s*(?:undefined|"[^"]*")\s*as\s*string\s*\|\s*undefined/;
  if (!re.test(original)) {
    return {
      src: original,
      warnings: [
        "designSlug anchor not found — skipped (template drift?). Set designSlug manually in brand.config.ts or via /admin/designs.",
      ],
    };
  }
  return {
    src: original.replace(re, `designSlug: "${skin}" as string | undefined`),
    warnings: [],
  };
}

/**
 * Neutralize the Teloz agency pitch in footer.githubUrl (brand.config.ts).
 *
 * v0.36.0 (engine PR #222) moved the footer's GitHub link from hardcoded JSX
 * into `footer.githubUrl`, defaulting to Teloz's personal GitHub profile —
 * correct for the engine repo (which IS the Teloz site), an identity leak on
 * every customer scaffold. Patch it to "" (the customer sets their own later);
 * patchFooterGithubUrlGate hides the footer block while it's empty.
 *
 * Fail-soft across template generations: a pre-v0.36.0 template has no
 * `githubUrl` field at all (its hardcoded link is stripped by
 * patchFooterContent) — warn + skip. A field already holding `""` is the
 * intended end state and is a silent no-op. A field holding some OTHER
 * non-empty value is left alone but now WARNS: that shape is indistinguishable
 * from a drifted anchor, and treating it silently is how v0.52.0's repo-path
 * URL shipped in every customer footer unnoticed.
 */
export function patchBrandConfigGithubUrl(original: string): PatchResult {
  // Match ANY github.com/Teloz1870 URL, not just the bare profile. v0.52.0+
  // ships `githubUrl: "https://github.com/Teloz1870/cartwright-template" as
  // string` — a repo path, not the profile — and the old exact-match anchor
  // silently fell through to the no-op branch below, so every scaffold kept
  // OUR link in its footer. The trailing `[^"]*` also tolerates the `as string`
  // suffix, which sits outside the quotes and is left untouched.
  const telozAnchor = /(githubUrl:\s*)"https:\/\/github\.com\/Teloz1870[^"]*"/;
  if (telozAnchor.test(original)) {
    return { src: original.replace(telozAnchor, `$1""`), warnings: [] };
  }
  if (/githubUrl:\s*""/.test(original)) {
    // Already neutral — the intended end state. Idempotent, no warning.
    return { src: original, warnings: [] };
  }
  const foreign = original.match(/githubUrl:\s*"([^"]*)"/);
  if (foreign) {
    // Field exists and holds a non-Teloz, non-empty value. That is PROBABLY a
    // customer/upstream URL we must not clobber — but it is also exactly what a
    // drifted anchor looks like, and this branch used to be silent, which is
    // how the bug above shipped unnoticed. Say what was left in place.
    return {
      src: original,
      warnings: [
        `footer.githubUrl left as "${foreign[1]}" — not a Teloz URL, so it was treated as intentional. If this is not yours, clear it in brand.config.ts.`,
      ],
    };
  }
  if (/\bgithubUrl:/.test(original)) {
    return {
      src: original,
      warnings: [
        "footer.githubUrl found but its value could not be read — skipped (unexpected shape; check brand.config.ts).",
      ],
    };
  }
  return {
    src: original,
    warnings: [
      "footer.githubUrl not found — skipped (template predates the v0.36.0 githubUrl field; the hardcoded footer link is handled separately).",
    ],
  };
}

/**
 * Empty `company.sameAs` on a scaffold.
 *
 * schema.org `sameAs` is an IDENTITY assertion: it tells Google and every AI
 * crawler that the listed profiles ARE this organization. The engine ships
 * Cartwright's own two — the template repo and the npm package — and
 * `app/layout.tsx` puts them straight into the Organization JSON-LD. Left in
 * place, every customer site publishes machine-readable structured data
 * claiming their company is the same entity as our repo. That is a worse leak
 * than the footer link, because it is aimed at machines and is believed.
 *
 * The engine already knows: `lib/trust-content-audit.ts` raises "Replace
 * Cartwright's default company.sameAs profiles…" as a finding. But an audit the
 * customer must read and act on is not a substitute for the scaffolder simply
 * not shipping it — stripping upstream identity is this file's whole job.
 *
 * A fresh shop has no authority profiles, so `[]` is the honest value; the
 * customer fills it in when they have some. Fail-soft: an already-empty array
 * is a silent no-op, a customised list is preserved AND reported (see the
 * githubUrl branch for why silence is not an option), and a missing field warns.
 */
export function patchBrandConfigSameAs(original: string): PatchResult {
  const block = /(sameAs:\s*)\[[\s\S]*?\](\s*as string\[\])?/;
  // Match against a copy with COMMENT LINES blanked, then splice the original
  // at the indices found. Without this the patcher is comment-blind and the
  // engine's docblock sits directly above the array (it already says "Fjern/
  // udskift ved fork"), so the moment a maintainer adds a worked example there
  // — `Ingen? Skriv sameAs: [] ved fork.` — the regex matches the COMMENT's
  // empty array, hits the `urls.length === 0` early return, and returns
  // unchanged with no warning while the real profiles ship. A near-variant
  // (`e.g. sameAs: ["https://x.test"]`) is worse: it rewrites the comment and
  // leaves the array. Same silent-anchor failure this whole patch exists to
  // kill, so it must not be reintroduced here.
  const masked = maskCommentLines(original);
  const match = block.exec(masked);
  if (!match) {
    // `company.sameAs` only exists from engine v0.46.0. On an older `--ref`
    // there is no field, nothing is published, and nothing needs doing — so
    // this is a silent no-op, not a warning about a field that never existed.
    if (!/\bsameAs\s*:/.test(masked)) return { src: original, warnings: [] };
    return {
      src: original,
      warnings: [
        "company.sameAs found but its array could not be read — skipped (verify the scaffold does not publish Cartwright's profiles in its Organization JSON-LD).",
      ],
    };
  }

  // Indices come from the masked copy but address the SAME offsets in the
  // original, so slice the original — never `original.replace(block, …)`,
  // which would re-run the regex and could land on a comment again.
  const start = match.index;
  const current = original.slice(start, start + match[0].length);
  const urls = [...current.matchAll(/["']([^"']+)["']/g)].map((m) => m[1]);
  if (urls.length === 0) return { src: original, warnings: [] };

  const ours =
    /github\.com\/Teloz1870|npmjs\.com\/package\/create-cartwright|cartwright\.app/i;
  const foreign = urls.filter((u) => !ours.test(u));
  const cast = match[2] ?? "";
  const keyPrefix = current.match(/^sameAs:\s*/)?.[0] ?? "sameAs: ";
  const src =
    original.slice(0, start) + `${keyPrefix}[]${cast}` + original.slice(start + match[0].length);

  if (foreign.length > 0) {
    return {
      src,
      warnings: [
        `company.sameAs also held non-Cartwright profile(s) (${foreign.join(", ")}) — cleared with the rest. Re-add them in brand.config.ts if they are yours.`,
      ],
    };
  }
  return { src, warnings: [] };
}

/**
 * Gate the footer's "GitHub Profile" block on `brand.footer.githubUrl` being
 * non-empty. The v0.36.0 template renders the <a> unconditionally, so after
 * patchBrandConfigGithubUrl sets the URL to "" the footer would otherwise show
 * a dead "GitHub Profile" link with an empty href. Wrapping (not deleting)
 * keeps the block working the moment the customer fills in their own URL —
 * config-true, same philosophy as patchCatalogFiltersContent's length guards.
 *
 * Fail-soft: pre-v0.36.0 templates hardcode the href (no
 * `{brand.footer.githubUrl}` anchor) — their link is already stripped by
 * patchFooterContent, so warn + skip is correct there too.
 */
export function patchFooterGithubUrlGate(original: string): PatchResult {
  const re =
    /\n(\s*)(<p>\s*<a href=\{brand\.footer\.githubUrl\}[\s\S]*?<\/a>\s*<\/p>)/;
  if (!re.test(original)) {
    return {
      src: original,
      warnings: [
        "footer GitHub block (href={brand.footer.githubUrl}) — anchor not found, skipped (pre-v0.36.0 template or drift).",
      ],
    };
  }
  return {
    src: original.replace(
      re,
      "\n$1{brand.footer.githubUrl && (\n$1$2\n$1)}",
    ),
    warnings: [],
  };
}

/** Legacy Teloz agency paragraphs previously shipped in
 * messages/<locale>.json (SaaSHome.cartwrightDesc2). The replacement keeps the
 * product-true ownership message and drops the agency pitch. Newer engine refs
 * already ship neutral Cartwright copy, so this migration must be idempotent. */
const CARTWRIGHT_DESC2_REPLACEMENTS: ReadonlyArray<{ from: string; to: string }> = [
  {
    from:
      "Just like in the crypto world, where you have full control of your wallet without a middleman, Cartwright gives you true ownership of your site. We don't believe you should pay monthly licenses for a basic system. At Teloz, you only pay for our time to set up, design and tailor the platform.",
    to:
      "Just like in the crypto world, where you have full control of your wallet without a middleman, Cartwright gives you true ownership of your site — you own the code and pay no platform license for the basic system.",
  },
  {
    from:
      "Ligesom i krypto-verdenen, hvor du har fuld kontrol over din wallet uden en tredjemand, giver Cartwright dig ægte ejerskab over dit site. Vi mener ikke, du skal betale månedlige licenser for et basis-system. Hos Teloz betaler du udelukkende for vores tid til at opsætte, designe og skræddersy platformen.",
    to:
      "Ligesom i krypto-verdenen, hvor du har fuld kontrol over din wallet uden en tredjemand, giver Cartwright dig ægte ejerskab over dit site — du ejer koden og betaler ingen platformslicens for basis-systemet.",
  },
];

/**
 * De-Teloz the SaaSHome marketing copy in a messages/<locale>.json source.
 * Called once per locale file; a file is OK as long as one locale anchor
 * matches (en.json never contains the Danish string and vice versa). If the
 * field is already Teloz-free, leave it untouched and silent. Warn only when
 * an unknown Teloz-bearing variant remains, because that could leak agency
 * identity into a new customer's rendered payload.
 */
export function patchMessagesCartwrightCopy(original: string): PatchResult {
  let out = original;
  let matched = false;
  for (const { from, to } of CARTWRIGHT_DESC2_REPLACEMENTS) {
    if (out.includes(from)) {
      out = out.replace(from, to);
      matched = true;
    }
  }
  if (!matched) {
    try {
      const parsed = JSON.parse(original) as {
        SaaSHome?: { cartwrightDesc2?: unknown };
      };
      const current = parsed.SaaSHome?.cartwrightDesc2;
      if (typeof current !== "string" || !/\bTeloz\b/i.test(current)) {
        return { src: original, warnings: [] };
      }
    } catch {
      // A malformed messages file is uncertain rather than demonstrably safe.
    }
    return {
      src: original,
      warnings: [
        "SaaSHome.cartwrightDesc2 still mentions Teloz but no known migration anchor matched — verify the scaffold copy.",
      ],
    };
  }
  return { src: out, warnings: [] };
}

/**
 * De-Danish the AI assistant floating button. In website mode
 * (ecommerceEnabled=false) the template ignores the English brand.ai.* labels
 * and hardcodes Danish fallbacks — so an en-only scaffold renders
 * "SPØRG AI KONSULENTEN" (uppercased by CSS) on every page. Route both texts
 * through brand.ai.* instead: config-true (the customer edits one field, both
 * modes follow) and English out of the box on v0.36.0 templates.
 * `ecommerceEnabled` stays used (className + panel prop), so the build is safe.
 *
 * Only load-bearing for refs BELOW v0.52.0. From v0.52.0 the engine routes both
 * texts through `tSf(...)`/messages, so the anchors miss by design and the patch
 * silently no-ops instead of warning. See the comment inside.
 */
export function patchAIStylistButtonContent(original: string): PatchResult {
  const warnings: string[] = [];
  let out = original;

  // Engine v0.52.0 (PR #507) replaced the hardcoded Danish website-mode
  // fallbacks with `tSf(...)` reading messages/<locale>.json, which ships
  // "AI consultant"/"Ask the AI consultant" in en.json. On such a ref the
  // scaffold output is ALREADY correct and there is nothing to strip — but the
  // old exact-string anchors miss, so this patch emitted two "template drift?"
  // warnings on every v0.52.0+ scaffold. Pure noise, and noise trains the
  // reader to ignore the warning block that also carries real findings.
  //
  // The patch is NOT obsolete: `--ref v0.51.1` (and older) still ship
  // `ecommerceEnabled ? brand.ai.assistantLabel : "AI Konsulent"` with no
  // consultant keys in en.json at all, so removing it would put Danish labels
  // on an English scaffold. Keep the migration, and stay quiet when upstream
  // has already done the job.
  // BOTH must be present. Requiring only one meant a half-migrated file —
  // `openText` on tSf(), `label` still `: "AI Rådgiver"` — counted as fixed,
  // so the surviving Danish literal shipped with no warning at all.
  const upstreamFixed =
    /tSf\(\s*["']consultantLabel["']\s*\)/.test(original) &&
    /tSf\(\s*["']consultantOpenText["']\s*\)/.test(original);

  const apply = (label: string, from: string, to: string): void => {
    if (!out.includes(from)) {
      if (!upstreamFixed) {
        warnings.push(`${label} — anchor not found, skipped (template drift?).`);
      }
      return;
    }
    out = out.replace(from, to);
  };

  apply(
    "AI button label fallback",
    `ecommerceEnabled ? brand.ai.assistantLabel : "AI Konsulent"`,
    "brand.ai.assistantLabel",
  );
  apply(
    "AI button openText fallback",
    `ecommerceEnabled ? brand.ai.assistantOpenText : "Spørg AI Konsulenten"`,
    "brand.ai.assistantOpenText",
  );

  return { src: out, warnings };
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
  // Engines from the locale-exempt release (#433) onward already exempt `/icon`
  // — but in the HANDLER (`lib/locale-exempt.ts` → `isAssetExempt`), and they
  // keep `/icon` INSIDE the matcher on purpose, so the merchant-redirect lookup
  // still applies to it. On such a template this patch is not a second safety
  // net, it is a regression: excluding `/icon` from the matcher takes it out of
  // the middleware altogether, which
  //   - drops that redirect coverage,
  //   - swallows the sibling names, because the exclusion is a PREFIX: every
  //     scaffold cut so far serves `/iconography` as a hard 404 instead of
  //     redirecting it to `/da/iconography`,
  //   - and fails the engine's own tests/unit/locale-exempt-routes.test.ts,
  //     which asserts `/icon` is carried by the proxy branch and not by the
  //     matcher. That assertion is what red-gated the release scaffold gate.
  // Older refs (`--ref stable` is still v0.44.1, which predates #433) and the
  // site profile's `proxy.static.ts` have no such branch and DO still need it,
  // so this stays — it just steps aside when the template handles /icon itself.
  if (/isAssetExempt\s*\(/.test(original)) return original;
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

/**
 * Does this project have somewhere to push to?
 *
 * The scaffold writes `.github/workflows/ci.yml`, but a workflow file only runs
 * once GitHub has the repository. Without a remote there is no CI, no backup and
 * no deployment that maps to a commit — so the success banner has to ask reality
 * rather than assume, or it ends up promising checks that never run.
 *
 * Deliberately reads the actual git config instead of tracking whether we *tried*
 * to publish: if `gh repo create` half-failed, intent and truth disagree, and the
 * banner must follow truth.
 */
export function hasGitRemote(targetDir: string): boolean {
  try {
    const out = execSync("git remote", { cwd: targetDir, encoding: "utf8" });
    return out.trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * Fold post-commit regenerated artifacts into the initial commit so the user's
 * very first `git status` is clean. tryGitInit commits BEFORE deps install +
 * the migration-baseline / marketplace-manifest regeneration runs, so without
 * this those regenerated tracked files show up as uncommitted right after
 * scaffolding. `--amend --no-edit` keeps the single "initial commit"; nothing is
 * pushed during scaffold, so rewriting it is safe. Best-effort: a failure just
 * leaves the (functional) dirty tree as before.
 */
export function tryGitAmendInitialCommit(targetDir: string): boolean {
  try {
    execSync("git add -A && git commit -q --amend --no-edit", {
      cwd: targetDir,
      stdio: "ignore",
    });
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
        "  No extra setup. `db:setup` creates dev.db and seeds the local admin/demo data.",
      ].join("\n");
  }
}

/**
 * Swap the engine's Teloz layers logo mark for the Cartwright wheel mark
 * (Cartwright = wagon builder — a stroke-drawn cartwheel: rim + hub + spokes).
 * The engine's brand.config keeps the Teloz mark (engine config = Teloz's live
 * identity); a customer scaffold must never ship another company's logo. The
 * wheel is a deliberate Cartwright-branded placeholder until the customer sets
 * their own mark (logo contract: outline paths, themeable stroke).
 *
 * Fail-soft: anchored on the exact Teloz markPaths string + legacy favicon
 * colors. An already-migrated mark, or a favicon palette already on a known
 * Cartwright pair, is a silent no-op. Missing properties, an unknown mark, or
 * a palette that is neither legacy-Teloz nor known-Cartwright all warn — the
 * last of those used to be silent, which hid the v0.52.0 vermilion change.
 */
export function patchLogoForScaffold(original: string): PatchResult {
  const warnings: string[] = [];
  let src = original;

  const telozMark = `"M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"`;
  const wheelMark = [
    `"M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z"`,
    `      "M12 10.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"`,
    `      "M12 3v7.5M12 13.5V21M3 12h7.5M13.5 12H21"`,
  ].join(",\n");
  if (src.includes(telozMark)) {
    src = src.replace(telozMark, wheelMark);
  } else if (!src.includes(`"M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z"`)) {
    warnings.push(
      "logo markPaths anchor not found — skipped (template logo drifted; verify the scaffold does not ship the Teloz mark).",
    );
  }

  // Legacy Teloz navy pair — still shipped by older refs (`--ref v0.51.1`),
  // so the swap must stay for them.
  const faviconBg = /faviconBg:\s*"#1e3f5a"/;
  const faviconFg = /faviconFg:\s*"#f4efe6"/;
  // Palettes that are ALREADY Cartwright-branded and must not be clobbered.
  // Measured per tag, because `--ref` can target any of them:
  //   v0.37.0 → v0.44.1  #7c5cff (the retired Cartwright purple, 11 tags)
  //   v0.45.0 → present  #c33f16 ("Cartwright vermilion", the engine's own name)
  //   this patch writes  #18181b — so a re-run must recognise its own output.
  // Omitting purple would make every `--ref v0.40.0` scaffold warn that it may
  // "ship another brand's colors" about Cartwright's own former brand colour.
  // Without this list entirely, all of them fell into the `else if` below,
  // whose guard only fires when a property is MISSING — so a changed-but-
  // present palette was a SILENT no-op, which is how the v0.45.0 vermilion
  // change went unnoticed all the way to v0.54.0.
  const cartwrightPalettes: ReadonlyArray<readonly [string, string]> = [
    ["#c33f16", "#ffffff"],
    ["#18181b", "#fafafa"],
    ["#7c5cff", "#ffffff"],
  ];
  const bgValue = src.match(/faviconBg:\s*["']([^"']+)["']/)?.[1];
  const fgValue = src.match(/faviconFg:\s*["']([^"']+)["']/)?.[1];

  if (faviconBg.test(src) && faviconFg.test(src)) {
    src = src.replace(faviconBg, `faviconBg: "#18181b"`).replace(faviconFg, `faviconFg: "#fafafa"`);
  } else if (!bgValue || !fgValue) {
    warnings.push("favicon color properties not found — verify the scaffold icon palette.");
  } else if (
    !cartwrightPalettes.some(([bg, fg]) => bg === bgValue && fg === fgValue)
  ) {
    warnings.push(
      `favicon palette is ${bgValue}/${fgValue} — neither the legacy pair this patch migrates nor a known Cartwright pair. Left as-is; verify the scaffold does not ship another brand's colors.`,
    );
  }

  return { src, warnings };
}

/**
 * Swap the template's hero/lifestyle image defaults for vertical-neutral ones.
 * The engine default hero is a clothing-store photo (Unsplash 1441986300917)
 * — on a fresh webshop scaffold ("Your shop starts here") it reads as a
 * leftover from someone else's store (owner finding, Gemini benchmark
 * 2026-06-11). Neutral, product-agnostic photography suits ANY vertical until
 * the customer sets their own media. Anchored + fail-soft: a customized image
 * is never clobbered.
 */
export function patchHeroImagesForScaffold(original: string): PatchResult {
  const warnings: string[] = [];
  let src = original;

  const swaps: Array<[string, string, string]> = [
    [
      "hero",
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600",
      // Soft, abstract architectural light — works for any shop type.
      "https://images.unsplash.com/photo-1487700160041-babef9c3cb55?w=1600",
    ],
    [
      "lifestyle",
      "https://images.unsplash.com/photo-1481437156560-3205f6a55735?w=1200",
      // Neutral workspace still-life.
      "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=1200",
    ],
  ];

  for (const [label, telozDefault, neutral] of swaps) {
    if (src.includes(telozDefault)) {
      src = src.replace(telozDefault, neutral);
    } else {
      warnings.push(`images.${label} anchor not found — skipped (image already customized or template drifted).`);
    }
  }

  return { src, warnings };
}
