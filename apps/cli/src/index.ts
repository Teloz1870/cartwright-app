#!/usr/bin/env node
/**
 * create-cartwright — a real site (design, database, backend) live in minutes.
 *
 * Usage:
 *   npx create-cartwright@latest [name] [--yes]
 *                                [--profile=light|full]
 *                                [--db=turso|postgres|sqlite] [--ai|--no-ai]
 *                                [--ref=stable|next|<tag-or-branch>]
 *                                [--template=website-corporate|coffee|sunglasses|agent-marketplace|generic]
 *                                [--pm=pnpm|npm|yarn|bun]
 *                                [--no-install] [--no-git] [--no-github] [--skip-skills]
 *
 * Profiles (one engine, two scaffold profiles — see ./profile-light.ts):
 *   --profile light (default) → website-mode default, curated design set,
 *                               FULL-ONLY modules (A2A, UCP, WebMCP, hoptify) pruned
 *   --profile full            → everything — identical to the pre-profile scaffold
 *
 * Subcommands:
 *   npx create-cartwright design install <slug> [--ref <tag>] [--force]
 *     Install a marketplace design (cartwright.app/designs) into an existing
 *     project: fetches designs/<slug>/ and registers it. See ./design-install.ts.
 *   npx create-cartwright vertical install <slug> [--ref <tag>] [--force]
 *     Install a marketplace Voice (cartwright.app/verticals) into an existing
 *     project: fetches verticals/<slug>/ and registers it. See ./vertical-install.ts.
 *
 * Channels:
 *   --ref stable (default) → latest tagged template release
 *   --ref next             → bleeding-edge main branch from cartwright-private
 *   --ref vX.Y.Z           → pin to a specific historical tag
 *
 * Templates (sets brand.mode + brand.features defaults in brand.config.ts).
 * Default: website-corporate under --profile light, generic under --profile full:
 *   --template generic                  → webshop mode, no A2A
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

/** True if a CLI tool is on PATH (used to offer optional gh-based publishing). */
function commandExists(cmd: string): boolean {
  try {
    execSync(`${cmd} --version`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

// Default channel resolves to the latest tag mirrored from cartwright-private.
// Bump together with a Changeset whenever a new template tag goes out —
// .github/workflows/bump-template-ref.yml does this automatically by opening
// a PR when it sees a newer tag on the public mirror.
const DEFAULT_REF = "v0.36.2";

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
  patchBrandConfigForEnglishFirst,
  patchBrandConfigForFirstRunWelcome,
  patchBrandConfigGithubUrl,
  patchLogoForScaffold,
  patchHeroImagesForScaffold,
  patchWebsiteCopyForScaffold,
  patchSeedSetupComplete,
  patchFooterGithubUrlGate,
  patchMessagesCartwrightCopy,
  patchAIStylistButtonContent,
  type PatchResult,
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
import { runDesignInstall } from "./design-install.js";
import { runVerticalInstall } from "./vertical-install.js";
import {
  type Profile,
  PROFILES,
  isProfile,
  applyLightProfile,
  lightProfileNote,
} from "./profile-light.js";

const HELP_TEXT = `create-cartwright — a real site (design, database, backend) live in minutes.

Usage:
  npx create-cartwright@latest [name] [options]

Options:
  --profile <light|full>   Scaffold profile (default: light).
                           light = website-mode default, curated design set,
                                   heavy full-only modules (A2A agent-marketplace,
                                   UCP identity-linking, WebMCP, hoptify) pruned.
                                   Add designs back: cartwright design install <slug>
                           full  = everything the engine ships — use this for
                                   agent-marketplace mode or to keep all 26 designs.
  --template <slug>        generic | website-corporate | coffee | sunglasses |
                           agent-marketplace (requires --profile full).
                           Default: website-corporate (light) / generic (full).
  --db <turso|postgres|sqlite>   Database (default: turso).
  --ai / --no-ai           Include AI commerce features hint.
  --ref <stable|next|tag>  Template channel (default: stable).
  --pm <pnpm|npm|yarn|bun> Package manager (default: auto-detect).
  --yes, -y                Skip prompts, use defaults.
  --no-install / --no-git / --no-github / --skip-skills
  --help, -h               Show this help.

Subcommands:
  cartwright design install <slug>     Install a marketplace design pack.
  cartwright vertical install <slug>   Install a marketplace Voice.
`;

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
 * Apply a fail-soft "first impression" codemod to a scaffold file, collecting
 * warnings instead of throwing. A missing file or non-matching anchor warns;
 * the scaffold always completes (mirrors profile-light's applyCodemod).
 */
function patchFileFailSoft(
  targetDir: string,
  relPath: string,
  transform: (src: string) => PatchResult,
  warnings: string[],
): void {
  const path = join(targetDir, relPath);
  if (!existsSync(path)) {
    warnings.push(`${relPath} not found — patch skipped.`);
    return;
  }
  const original = readFileSync(path, "utf8");
  const { src, warnings: patchWarnings } = transform(original);
  warnings.push(...patchWarnings.map((w) => `${relPath}: ${w}`));
  if (src !== original) writeFileSync(path, src);
}

/**
 * English-first + first-run welcome patches (owner decision 2026-06-11:
 * scaffolds are born en-only with the Welcome Canvas armed). All fail-soft —
 * works against both the current template (v0.35.1, no firstRunWelcome flag)
 * and future templates that ship the engine's Welcome Canvas.
 */
function applyFirstImpressionPatches(targetDir: string, storeName: string): string[] {
  const warnings: string[] = [];
  patchFileFailSoft(
    targetDir,
    "brand.config.ts",
    (src) => {
      const english = patchBrandConfigForEnglishFirst(src, storeName);
      const copy = patchWebsiteCopyForScaffold(english.src, storeName);
      const github = patchBrandConfigGithubUrl(copy.src);
      // A customer scaffold must never ship the Teloz logo mark — swap in the
      // Cartwright wheel placeholder (owner mandate, 2026-06-11).
      const logo = patchLogoForScaffold(github.src);
      const heroImages = patchHeroImagesForScaffold(logo.src);
      const flag = patchBrandConfigForFirstRunWelcome(heroImages.src);
      return {
        src: flag.src,
        warnings: [
          ...english.warnings,
          ...copy.warnings,
          ...github.warnings,
          ...logo.warnings,
          ...heroImages.warnings,
          ...flag.warnings,
        ],
      };
    },
    warnings,
  );
  // Arm first-run: the template's seed marks setupComplete=true (Solbrillen
  // legacy), which kills both the documented /admin/setup wizard and the
  // Welcome Canvas predicate on fresh scaffolds.
  patchFileFailSoft(targetDir, join("prisma", "seed.ts"), patchSeedSetupComplete, warnings);
  // De-Teloz the rest of the first render (cold-scaffold audit, 2026-06-11):
  // footer "GitHub Profile" block gated on the (now-empty) githubUrl, the
  // SaaSHome Teloz agency paragraph in the next-intl payload, and the Danish
  // website-mode fallbacks on the AI assistant button.
  patchFileFailSoft(targetDir, join("components", "Footer.tsx"), patchFooterGithubUrlGate, warnings);
  patchFileFailSoft(targetDir, join("messages", "en.json"), patchMessagesCartwrightCopy, warnings);
  patchFileFailSoft(targetDir, join("messages", "da.json"), patchMessagesCartwrightCopy, warnings);
  patchFileFailSoft(
    targetDir,
    join("components", "AIStylistButton.tsx"),
    patchAIStylistButtonContent,
    warnings,
  );
  return warnings;
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
  // Subcommand: `cartwright design install <slug>` — fetch a marketplace design
  // pack into an existing project. Everything below is the project scaffolder.
  const argv = process.argv.slice(2);
  if (argv[0] === "design" && argv[1] === "install") {
    await runDesignInstall(argv.slice(2));
    return;
  }
  if (argv[0] === "vertical" && argv[1] === "install") {
    await runVerticalInstall(argv.slice(2));
    return;
  }

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
      profile: { type: "string" },
      help: { type: "boolean", short: "h" },
      "no-install": { type: "boolean" },
      "no-git": { type: "boolean" },
      "no-github": { type: "boolean" },
      "skip-skills": { type: "boolean" },
    },
  });

  if (values.help) {
    console.log(HELP_TEXT);
    return;
  }

  // Validate --profile. LIGHT is the default: the lean "real site in minutes"
  // scaffold. `--profile full` keeps everything (pre-profile behaviour).
  let profile: Profile = "light";
  if (values.profile !== undefined) {
    if (!isProfile(values.profile)) {
      console.error(
        pc.red(`Invalid --profile "${values.profile}". Choose one of: ${PROFILES.join(", ")}`),
      );
      process.exit(1);
    }
    profile = values.profile;
  }

  // Validate --template if provided. The default tracks the profile:
  // website-corporate under light (Cartwright Light is website-mode by
  // default), generic (full webshop) under full — matching pre-profile
  // behaviour exactly when --profile full is passed.
  let templateSlug: TemplateSlug = profile === "light" ? "website-corporate" : "generic";
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

  // The light profile prunes the A2A/agent-marketplace modules, so that
  // template needs the full scaffold.
  if (profile === "light" && templateSlug === "agent-marketplace") {
    console.error(
      pc.red(
        `--template agent-marketplace needs the full engine (A2A modules are pruned in light).\n` +
          `Re-run with: --profile full --template agent-marketplace`,
      ),
    );
    process.exit(1);
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
  // Offer to publish to GitHub interactively (skipped in --yes / --no-git / --no-github).
  const offerGithub =
    !values["no-github"] && !values["no-git"] && values.yes !== true;
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

  // English-first scaffolds + first-run welcome activation. Runs BEFORE the
  // install/db step so the patched seed (setupComplete: false) is what gets
  // seeded. Fail-soft: drift produces a note, never a crash — e.g. templates
  // ≤ v0.35.1 don't have the firstRunWelcome flag yet (warn + skip).
  const firstImpressionWarnings = applyFirstImpressionPatches(
    targetDir,
    titleCase(generatedBrief ? finalSlug : finalProjectName),
  );
  if (firstImpressionWarnings.length > 0) {
    note(
      firstImpressionWarnings.map((w) => `• ${w}`).join("\n"),
      pc.yellow("first-impression patches — skipped anchors (non-fatal)"),
    );
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

  // LIGHT profile (default): prune the FULL-ONLY modules + non-curated design
  // packs and flip the light brand.config defaults. Fail-soft: warnings are
  // shown but never abort the scaffold. `--profile full` skips this entirely,
  // leaving the scaffold byte-identical to pre-profile behaviour.
  if (profile === "light") {
    const report = applyLightProfile(targetDir);
    note(lightProfileNote(), "Cartwright Light");
    if (report.warnings.length > 0) {
      note(
        report.warnings.map((w) => `• ${w}`).join("\n"),
        pc.yellow("light-profile warnings (non-fatal)"),
      );
    }
  }

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
  let gitInitialized = false;
  if (initGit) {
    gitInitialized = tryGitInit(targetDir);
    if (!gitInitialized) {
      note(pc.yellow("git init skipped — git not available."), "info");
    }
  }

  // ── Optional: publish to GitHub ───────────────────────────────────────────
  // Beginners' biggest gap is "scaffolded → now what?". Offer the next hop:
  // put the code on GitHub (the home that Vercel deploys from). Fully optional,
  // fail-soft, and only when we actually have a git repo + an interactive run.
  if (gitInitialized && offerGithub) {
    const wantsGithub = await confirm({
      message: "Publish this shop to a private GitHub repo now?",
      initialValue: false,
    });
    if (wantsGithub === true) {
      if (commandExists("gh")) {
        const ghSpinner = spinner();
        ghSpinner.start("Creating private GitHub repo + pushing…");
        try {
          execSync(
            `gh repo create ${finalSlug} --private --source=. --remote=origin --push`,
            { cwd: targetDir, stdio: "ignore" },
          );
          ghSpinner.stop(pc.green("Pushed to GitHub."));
        } catch {
          ghSpinner.stop(pc.yellow("Couldn't auto-publish — do it by hand:"));
          note(
            "1. Create an empty PRIVATE repo at https://github.com/new (no README)\n" +
              `2. git remote add origin https://github.com/<you>/${finalSlug}.git\n` +
              "3. git branch -M main && git push -u origin main",
            "GitHub",
          );
        }
      } else {
        note(
          "The GitHub CLI (gh) isn't installed — easiest path is the desktop app:\n" +
            "• Install GitHub Desktop: https://desktop.github.com\n" +
            "• Add this folder, then click 'Publish repository' (keep it private)\n" +
            "Full walkthrough: https://cartwright.app/docs/getting-started/from-code-to-live/2-publish-repo",
          "GitHub",
        );
      }
    }
  }

  // ── Install + DB bootstrap ────────────────────────────────────────────────
  // When deps install cleanly we go all the way: create the schema and seed the
  // admin + demo data, so the shop is sign-in-ready before the user opens it.
  // `dbReady` drives whether "Next steps" still lists db push/seed as required.
  let dbReady = false;
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
      // LIGHT: the committed marketplace-manifest.json still lists the pruned
      // designs. Regenerate it from the (now-trimmed) registries so the
      // manifest — and its drift-guard test — match the scaffold. Best-effort:
      // `pnpm build` also runs gen:manifest, so a failure here self-heals.
      if (profile === "light") {
        try {
          const pmRunManifest = packageManager === "npm" ? "npm run" : packageManager;
          execSync(`${pmRunManifest} gen:manifest`, { cwd: targetDir, stdio: "ignore" });
        } catch {
          /* first `pnpm build` regenerates it */
        }
      }
      // Create the schema + seed the admin/demo data. The seed prints the admin
      // login banner and writes .admin-credentials. Non-fatal: on any failure we
      // fall back to listing the manual commands in "Next steps".
      const pmRun = packageManager === "npm" ? "npm run" : packageManager;
      try {
        console.log(
          pc.dim("\nSetting up the database (schema + demo data + admin login)…\n"),
        );
        // Prefer the engine's robust `db:setup` (v0.27.0+): it tries `prisma db
        // push`, and on the intermittent Prisma 7.8 "Schema engine error" it
        // falls back to applying the schema via the libSQL client (bypassing the
        // flaky schema engine), then seeds — so first-run can't get stuck.
        let hasDbSetup = false;
        try {
          const pkg = JSON.parse(readFileSync(join(targetDir, "package.json"), "utf8"));
          hasDbSetup = Boolean(pkg?.scripts?.["db:setup"]);
        } catch {
          /* fall through to the legacy path */
        }
        if (hasDbSetup) {
          execSync(`${pmRun} db:setup`, { cwd: targetDir, stdio: "inherit" });
        } else {
          // Legacy template without db:setup — best-effort push (+1 retry) + seed.
          try {
            execSync("npx prisma db push", { cwd: targetDir, stdio: "inherit" });
          } catch {
            console.log(pc.dim("\nRetrying database setup (transient Prisma engine error)…\n"));
            execSync("npx prisma db push", { cwd: targetDir, stdio: "inherit" });
          }
          execSync("npx prisma db seed", { cwd: targetDir, stdio: "inherit" });
        }
        dbReady = true;
      } catch {
        // The real Prisma error was printed above (stdio: inherit). Make the
        // consequence explicit: no admin exists yet, so login can't work until
        // setup succeeds.
        console.log(
          pc.yellow(
            "\nCouldn't auto-set-up the database (the Prisma error is shown above).\n" +
              "No admin was created yet — `.admin-credentials` appears only after setup succeeds. Run:\n" +
              `  ${pmRun} db:setup\n` +
              "It falls back to applying the schema via the libSQL client if `prisma db push` hits the\n" +
              "intermittent Prisma 7.8 schema-engine error. If that still fails, try Node 22 LTS (`nvm use 22`).",
          ),
        );
      }
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

  const nextSteps = dbReady
    ? [
        pc.bold("Next steps:"),
        `  cd ${finalSlug}`,
        `  ${runCmd} dev                ${pc.dim("# http://localhost:3000/en")}`,
        pc.dim("  English-only by default — add languages in brand.config.ts (locales)."),
      ]
    : [
        pc.bold("Next steps (required):"),
        `  cd ${finalSlug}`,
        `  ${runCmd} db:setup           ${pc.dim("# create schema + seed admin/demo (robust; prints your login)")}`,
        `  ${runCmd} dev                ${pc.dim("# http://localhost:3000/en")}`,
        pc.dim("  English-only by default — add languages in brand.config.ts (locales)."),
      ];

  const lines = [
    pc.green("✓") +
      ` Created ${pc.bold(finalProjectName)} at ${pc.dim(targetDir)}`,
    pc.green("✓") + ` AUTH_SECRET generated and written to .env.local`,
    pc.green("✓") + ` brand.config.ts patched (name, branding, SEO, emails)`,
    profile === "light"
      ? pc.green("✓") + ` Light profile (default) — lean engine; \`--profile full\` keeps everything`
      : "",
    generatedBrief ? pc.green("✓") + ` AI brief injected` : "",
    dbReady
      ? pc.green("✓") + ` Database created + seeded — admin login saved to .admin-credentials`
      : "",
    "",
    ...nextSteps,
    "",
    pc.bold("Sign in (password):"),
    pc.dim("  Open /account/login → the Password tab."),
    pc.dim("  Email:    brand.emails.admin (from brand.config.ts)"),
    pc.dim("  Password: in .admin-credentials at the project root — `cat .admin-credentials`"),
    pc.dim("  First login asks you to set your own password; then the /admin/setup wizard opens."),
    pc.dim("  (Magic-link appears once RESEND_API_KEY is set; in dev the link → .mail-previews/.)"),
    "  " +
      pc.cyan(
        "First-login guide: https://cartwright.app/docs/getting-started/first-login",
      ),
    "",
    databaseNote(database),
    aiHint,
    "",
    pc.bold("Put it online (GitHub → Vercel):"),
    pc.dim("  1. Push this folder to a GitHub repo (private)"),
    pc.dim("  2. Import the repo at vercel.com → it builds + gives you a live URL"),
    pc.dim("  3. Every push to GitHub then redeploys your shop automatically"),
    "  " +
      pc.cyan(
        "Full beginner guide (no terminal needed): https://cartwright.app/docs/getting-started/from-code-to-live",
      ),
    "",
    pc.dim("Domain + email when you're ready: https://cartwright.app/docs/deployment/go-live"),
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
