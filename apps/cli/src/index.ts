#!/usr/bin/env node
/**
 * create-cartwright — scaffolder for AI-first webshops.
 *
 * Usage:
 *   npx create-cartwright@latest [name] [--yes]
 *                                [--db=turso|postgres|sqlite] [--ai|--no-ai]
 *                                [--ref=stable|next|<tag-or-branch>]
 *                                [--template=website-corporate|coffee|sunglasses|agent-marketplace|generic]
 *                                [--pm=pnpm|npm|yarn|bun]
 *                                [--no-install] [--no-git] [--skip-skills]
 *
 * Channels:
 *   --ref stable (default) → latest tagged template release
 *   --ref next             → bleeding-edge main branch from cartwright-private
 *   --ref vX.Y.Z           → pin to a specific historical tag
 *
 * Templates (sets brand.mode + brand.features defaults in brand.config.ts):
 *   --template generic (default)        → webshop mode, no A2A
 *   --template website-corporate        → website mode (no shop catalogue)
 *   --template coffee                   → webshop mode, coffee seed data
 *   --template sunglasses               → webshop mode, legacy eyewear fields
 *   --template agent-marketplace        → A2A mode, no shop GUI, A-JWT endpoints on
 *
 * Pulls a sanitised snapshot of cartwright-template via giget, generates a
 * fresh AUTH_SECRET, injects the project name into brand.config.ts, and
 * optionally installs deps + inits git.
 */
import {
  intro,
  outro,
  text,
  select,
  confirm,
  cancel,
  isCancel,
  spinner,
  note,
  password,
} from "@clack/prompts";
import { downloadTemplate } from "giget";
import pc from "picocolors";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";

// Read the real version from package.json so the banner never drifts.
const CLI_VERSION: string = JSON.parse(
  readFileSync(join(fileURLToPath(new URL(".", import.meta.url)), "../package.json"), "utf8"),
).version;

const TEMPLATE_REPO = "github:Teloz1870/cartwright-template";

// Default channel resolves to the latest tag mirrored from cartwright-private.
// Bump together with a Changeset whenever a new template tag goes out —
// .github/workflows/bump-template-ref.yml does this automatically by opening
// a PR when it sees a newer tag on the public mirror.
const DEFAULT_REF = "v0.9.2";

// Channel aliases the user can pass via --ref.
//   stable → DEFAULT_REF (latest tag — what default `npx create-cartwright` uses)
//   next   → bleeding-edge branch on the mirror, updated on every push to
//            cartwright-private/main. Not recommended for production scaffolds.
const REF_ALIASES: Record<string, string> = {
  stable: DEFAULT_REF,
  next: "next",
};

import {
  type Database,
  type PackageManager,
  type TemplateSlug,
  TEMPLATE_SLUGS,
  detectPackageManager,
  generateAuthSecret,
  patchEnvLocal,
  titleCase,
  patchBrandConfigContent,
  patchBrandConfigForTemplate,
  patchFooterContent,
  patchHeroVideoContent,
  patchCatalogFiltersContent,
  patchProxyContent,
  migratePrismaConfig,
  regenerateMigrationBaseline,
  isTemplateSlug,
  tryGitInit,
  tryInstall,
  databaseNote
} from "./scaffold.js";
import { resolveKeyMode } from "./key-step.js";
import { runInterview } from "./interview.js";
import { summarizeBuild } from "./approve.js";
import { injectBriefFiles, injectModernWebDoc } from "./inject.js";
import { installModernWebGuidance } from "./skills.js";

function exitOnCancel<T>(value: T | symbol): T {
  if (isCancel(value)) {
    cancel("Cancelled.");
    process.exit(0);
  }
  return value as T;
}

function patchBrandConfig(targetDir: string, projectName: string): void {
  const path = join(targetDir, "brand.config.ts");
  if (!existsSync(path)) return;
  const original = readFileSync(path, "utf8");
  const patched = patchBrandConfigContent(original, projectName);
  if (patched !== original) writeFileSync(path, patched);
}

// Strip the hardcoded Teloz attribution from the customer's footer copy.
// Pure-text replacement on the scaffold only — the engine/template (which is
// the live Teloz site) is untouched, so there is no canary risk.
function patchFooter(targetDir: string, projectName: string): void {
  const path = join(targetDir, "components", "Footer.tsx");
  if (!existsSync(path)) return;
  const original = readFileSync(path, "utf8");
  const patched = patchFooterContent(original, titleCase(projectName));
  if (patched !== original) writeFileSync(path, patched);
}

// Apply small storefront-cleanup patches to the customer's component copies:
// remove the missing hero-video <source> tags (no 404) and gate the eyewear
// colour filters behind a length check (no empty dropdowns on non-eyewear shops).
function patchComponentFile(
  targetDir: string,
  relPath: string,
  transform: (src: string) => string,
): void {
  const path = join(targetDir, relPath);
  if (!existsSync(path)) return;
  const original = readFileSync(path, "utf8");
  const patched = transform(original);
  if (patched !== original) writeFileSync(path, patched);
}

/**
 * Apply per-template defaults to brand.config.ts. Called after the basic
 * name/slug patch. Idempotent — safe to call even if the template fields
 * already match (the regex replacements no-op).
 */
function applyTemplateDefaults(
  targetDir: string,
  template: TemplateSlug,
): void {
  const path = join(targetDir, "brand.config.ts");
  if (!existsSync(path)) return;
  const original = readFileSync(path, "utf8");
  const patched = patchBrandConfigForTemplate(original, template);
  if (patched !== original) writeFileSync(path, patched);
}

async function run(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      yes: { type: "boolean", short: "y" },
      db: { type: "string" },
      ai: { type: "boolean" },
      "no-ai": { type: "boolean" },
      "ai-gen": { type: "boolean" },
      ref: { type: "string" },
      pm: { type: "string" },
      template: { type: "string" },
      "no-install": { type: "boolean" },
      "no-git": { type: "boolean" },
      "skip-skills": { type: "boolean" },
    },
  });

  // Validate --template if provided. Default is "generic" (full webshop
  // scaffold matching pre-Phase-2 behaviour).
  let templateSlug: TemplateSlug = "generic";
  if (values.template !== undefined) {
    if (!isTemplateSlug(values.template)) {
      console.error(
        pc.red(
          `Invalid --template "${values.template}". Choose one of: ${TEMPLATE_SLUGS.join(", ")}`,
        ),
      );
      process.exit(1);
    }
    templateSlug = values.template;
  }

  intro(
    `${pc.bgYellow(pc.black(" create-cartwright "))} ${pc.dim(`v${CLI_VERSION}`)}`,
  );

  // ── Project name ────────────────────────────────────────────────────────
  const defaultName = positionals[0] ?? "my-cartwright-shop";
  const projectName = values.yes
    ? defaultName
    : exitOnCancel(
        await text({
          message: "Project name?",
          initialValue: defaultName,
          validate: (v) =>
            /^[a-z][a-z0-9-]*$/.test(v)
              ? undefined
              : "Use lowercase letters, digits and dashes; start with a letter.",
        }),
      );

  // ── Database ────────────────────────────────────────────────────────────
  const dbFromFlag = values.db as Database | undefined;
  const database: Database =
    dbFromFlag ??
    (values.yes
      ? "turso"
      : (exitOnCancel(
          await select({
            message: "Database?",
            options: [
              {
                value: "turso",
                label: "Turso (recommended — libSQL on edge)",
              },
              {
                value: "postgres",
                label: "Postgres (Neon / Supabase / self-hosted)",
              },
              { value: "sqlite", label: "SQLite (local-only)" },
            ],
            initialValue: "turso",
          }),
        ) as Database));

  if (!["turso", "postgres", "sqlite"].includes(database)) {
    cancel(`Unknown database "${database}". Use turso, postgres, or sqlite.`);
    process.exit(1);
  }

  // ── AI features ─────────────────────────────────────────────────────────
  const aiFlag = values.ai === true ? true : values["no-ai"] === true ? false : undefined;
  const withAi: boolean =
    aiFlag ??
    (values.yes
      ? true
      : exitOnCancel(
          await confirm({
            message:
              "Include AI commerce features? (requires Anthropic + Gemini API keys)",
            initialValue: true,
          }),
        ));

  // ── AI Generation (V2) ───────────────────────────────────────────────────
  let generatedBrief = undefined;
  let storeSlugOverride = undefined;
  let storeNameOverride = undefined;

  const useAiGen = values["ai-gen"] ?? (values.yes ? false : exitOnCancel(
    await confirm({
      message: "Vil du prøve den nye AI-scaffolder (v2)? (Kræver Gemini API Key)",
      initialValue: true,
    })
  ));

  if (useAiGen) {
    const keyMode = await resolveKeyMode({
      getEnvKey: () => process.env.GEMINI_API_KEY,
      promptKey: async () => exitOnCancel(await password({ message: "Indtast Gemini API Key:" })),
      confirmManual: async () => exitOnCancel(await confirm({ message: "Key fejlede. Fortsæt med manuel scaffold (v1)?", initialValue: true }))
    });

    if (keyMode.type === "key") {
      const initialPrompt = exitOnCancel(await text({ message: "Hvad slags butik vil du bygge?" }));
      
      generatedBrief = await runInterview({
        apiKey: keyMode.key,
        initialPrompt,
        askUser: async (q) => exitOnCancel(await text({ message: pc.cyan("AI:") + " " + q })),
        logMsg: (msg) => console.log(pc.dim(msg))
      });

      console.log("\n" + summarizeBuild(generatedBrief) + "\n");
      const ok = exitOnCancel(await confirm({ message: "Ser dette rigtigt ud? (Klar til at bygge)", initialValue: true }));
      
      if (!ok) {
        cancel("Afbrudt af bruger.");
        process.exit(0);
      }
      
      storeSlugOverride = generatedBrief.slug;
      storeNameOverride = generatedBrief.storeName;
    }
  }

  // ── Tooling defaults ────────────────────────────────────────────────────
  const detected = detectPackageManager();
  const packageManager =
    (values.pm as PackageManager | undefined) ?? detected;
  const installDeps = !values["no-install"];
  const initGit = !values["no-git"];
  const skipSkills = values["skip-skills"] === true;
  const requestedRef = values.ref ?? "stable";
  const templateRef = REF_ALIASES[requestedRef] ?? requestedRef;

  // ── Pre-flight ──────────────────────────────────────────────────────────
  const finalSlug = storeSlugOverride ?? projectName;
  const finalProjectName = storeNameOverride ?? projectName;
  const targetDir = resolve(process.cwd(), finalSlug);
  
  if (existsSync(targetDir)) {
    cancel(`Directory "${finalSlug}" already exists.`);
    process.exit(1);
  }

  // ── Template fetch ──────────────────────────────────────────────────────
  const fetchSpinner = spinner();
  const refDisplay =
    requestedRef === templateRef
      ? templateRef
      : `${requestedRef} → ${templateRef}`;
  fetchSpinner.start(`Fetching cartwright template (${refDisplay})…`);
  try {
    await downloadTemplate(`${TEMPLATE_REPO}#${templateRef}`, {
      dir: targetDir,
      force: false,
    });
    fetchSpinner.stop(pc.green(`Template downloaded (${refDisplay}).`));
  } catch (err) {
    fetchSpinner.stop(pc.red("Template fetch failed."));
    console.error(err);
    process.exit(1);
  }

  // ── Customise the scaffold ──────────────────────────────────────────────
  const authSecret = generateAuthSecret();
  patchEnvLocal(targetDir, authSecret);

  if (generatedBrief) {
    injectBriefFiles(targetDir, generatedBrief);
    // patchBrandConfig vil nu bruge briefets værdier (som vi gav videre via finalSlug)
    patchBrandConfig(targetDir, finalSlug);
    patchFooter(targetDir, finalSlug);
  } else {
    patchBrandConfig(targetDir, finalProjectName);
    patchFooter(targetDir, finalProjectName);
  }

  // Storefront cleanup (template copies → customer copies; no canary impact)
  patchComponentFile(targetDir, "components/HeroVideo.tsx", patchHeroVideoContent);
  patchComponentFile(targetDir, "components/CatalogFilters.tsx", patchCatalogFiltersContent);
  // Stop next-intl from locale-prefixing the /icon metadata route (→ 404)
  patchComponentFile(targetDir, "proxy.ts", patchProxyContent);
  // Migrate the deprecated package.json#prisma seed config to prisma.config.ts
  migratePrismaConfig(targetDir);

  // Apply per-template defaults (mode, features, industryTemplate) AFTER
  // the basic name/slug patch so the regex-based replacements act on a
  // known shape. Always run — for `--template generic` (the default) the
  // patches are no-ops on a generic-defaulted brand.config.
  applyTemplateDefaults(targetDir, templateSlug);

  // Phase D4 — write a customer-facing MODERN_WEB.md inventory listing every
  // modern web platform feature Cartwright wires up out of the box. Doubles
  // as marketing copy for the customer to lift into their own product page.
  injectModernWebDoc(targetDir);
  if (templateSlug !== "generic") {
    note(
      `Template: ${pc.bold(templateSlug)} — applied mode + features defaults to brand.config.ts`,
      "info",
    );
  }

  // ── Git init ────────────────────────────────────────────────────────────
  if (initGit) {
    const gitOk = tryGitInit(targetDir);
    if (!gitOk) {
      note(pc.yellow("git init skipped — git not available."), "info");
    }
  }

  // ── Install ─────────────────────────────────────────────────────────────
  if (installDeps) {
    const installSpinner = spinner();
    installSpinner.start(`Installing dependencies with ${packageManager}…`);
    const ok = tryInstall(targetDir, packageManager);
    if (ok) {
      installSpinner.stop(pc.green("Dependencies installed."));
      // Now that the local prisma CLI exists, replace the template's drifted
      // migration history with a clean from-empty baseline so `migrate deploy`
      // works on a fresh DB (best-effort; `db push` works regardless).
      regenerateMigrationBaseline(targetDir, database);
    } else {
      installSpinner.stop(
        pc.yellow(
          `Install failed — run \`${packageManager} install\` in ${projectName} manually.`,
        ),
      );
    }
  }

  // ── AI-agent skills ─────────────────────────────────────────────────────
  // Cartwright's own skill (cartwright-guidance) ships in the template under
  // .claude/skills/. This additional step installs Chrome team's upstream
  // modern-web-guidance skill globally on the customer's machine. Best-effort:
  // declines, timeouts, and errors degrade to a note — never block scaffold.
  await installModernWebGuidance(targetDir, {
    skip: skipSkills,
    assumeYes: values.yes === true,
  });

  // ── Next steps ──────────────────────────────────────────────────────────
  const runCmd =
    packageManager === "npm" ? "npm run" : packageManager;

  const aiHint = withAi
    ? `\n  ${pc.dim("Add ANTHROPIC_API_KEY (+ optional GEMINI keys) to .env.local before pnpm dev,")}\n  ${pc.dim("or configure them later in /admin/integrations after first sign-in.")}`
    : "";

  const lines = [
    pc.green("✓") +
      ` Created ${pc.bold(finalProjectName)} at ${pc.dim(targetDir)}`,
    pc.green("✓") + ` AUTH_SECRET generated and written to .env.local`,
    pc.green("✓") + ` brand.config.ts patched (name, branding, SEO, emails)`,
    generatedBrief ? pc.green("✓") + ` AI brief injected` : "",
    "",
    pc.bold("Next steps:"),
    `  cd ${finalSlug}`,
    `  npx prisma db push          ${pc.dim("# create the DB schema (fresh project)")}`,
    `  npx prisma db seed          ${pc.dim("# seed demo products + categories")}`,
    `  ${runCmd} dev                ${pc.dim("# http://localhost:3000")}`,
    "",
    pc.bold("Admin login:"),
    pc.dim("  Open /account/login and enter the admin email from brand.config.ts"),
    pc.dim("  (brand.emails.admin). In dev the magic link is written to .mail-previews/."),
    "",
    databaseNote(database),
    aiHint,
    "",
    pc.bold("Going to production?"),
    pc.dim("  Deploy, custom domain, and email — the Go Live guide has the path:"),
    pc.dim("  https://cartwright.app/docs/deployment/go-live"),
    "",
    pc.dim("Docs:    https://cartwright.app/docs/getting-started/quick-start"),
    pc.dim("Mirror:  https://github.com/Teloz1870/cartwright-template"),
  ]
    .filter(Boolean)
    .join("\n");

  outro(lines);
}

run().catch((err) => {
  console.error(pc.red("Unexpected error:"), err);
  process.exit(1);
});
