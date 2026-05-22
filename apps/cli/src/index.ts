#!/usr/bin/env node
/**
 * create-cartwright — scaffolder for AI-first webshops.
 *
 * Usage:
 *   npx create-cartwright@latest [name] [--yes]
 *                                [--db=turso|postgres|sqlite] [--ai|--no-ai]
 *                                [--ref=<tag-or-branch>]
 *                                [--pm=pnpm|npm|yarn|bun]
 *                                [--no-install] [--no-git]
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
} from "@clack/prompts";
import { downloadTemplate } from "giget";
import pc from "picocolors";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { parseArgs } from "node:util";

const TEMPLATE_REPO = "github:Teloz1870/cartwright-template";
const DEFAULT_REF = "v0.1.0-beta";

import {
  type Database,
  type PackageManager,
  detectPackageManager,
  generateAuthSecret,
  patchEnvLocal,
  patchBrandConfigContent,
  tryGitInit,
  tryInstall,
  databaseNote
} from "./scaffold";

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

async function run(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      yes: { type: "boolean", short: "y" },
      db: { type: "string" },
      ai: { type: "boolean" },
      "no-ai": { type: "boolean" },
      ref: { type: "string" },
      pm: { type: "string" },
      "no-install": { type: "boolean" },
      "no-git": { type: "boolean" },
    },
  });

  intro(
    `${pc.bgYellow(pc.black(" create-cartwright "))} ${pc.dim("v0.1.0-beta")}`,
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

  // ── Tooling defaults ────────────────────────────────────────────────────
  const detected = detectPackageManager();
  const packageManager =
    (values.pm as PackageManager | undefined) ?? detected;
  const installDeps = !values["no-install"];
  const initGit = !values["no-git"];
  const templateRef = values.ref ?? DEFAULT_REF;

  // ── Pre-flight ──────────────────────────────────────────────────────────
  const targetDir = resolve(process.cwd(), projectName);
  if (existsSync(targetDir)) {
    cancel(`Directory "${projectName}" already exists.`);
    process.exit(1);
  }

  // ── Template fetch ──────────────────────────────────────────────────────
  const fetchSpinner = spinner();
  fetchSpinner.start(`Fetching cartwright template (${templateRef})…`);
  try {
    await downloadTemplate(`${TEMPLATE_REPO}#${templateRef}`, {
      dir: targetDir,
      force: false,
    });
    fetchSpinner.stop(pc.green(`Template downloaded (${templateRef}).`));
  } catch (err) {
    fetchSpinner.stop(pc.red("Template fetch failed."));
    console.error(err);
    process.exit(1);
  }

  // ── Customise the scaffold ──────────────────────────────────────────────
  const authSecret = generateAuthSecret();
  patchEnvLocal(targetDir, authSecret);
  patchBrandConfig(targetDir, projectName);

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
    } else {
      installSpinner.stop(
        pc.yellow(
          `Install failed — run \`${packageManager} install\` in ${projectName} manually.`,
        ),
      );
    }
  }

  // ── Next steps ──────────────────────────────────────────────────────────
  const runCmd =
    packageManager === "npm" ? "npm run" : packageManager;

  const aiHint = withAi
    ? `\n  ${pc.dim("Add ANTHROPIC_API_KEY (+ optional GEMINI keys) to .env.local before pnpm dev,")}\n  ${pc.dim("or configure them later in /admin/integrations after first sign-in.")}`
    : "";

  const lines = [
    pc.green("✓") +
      ` Created ${pc.bold(projectName)} at ${pc.dim(targetDir)}`,
    pc.green("✓") + ` AUTH_SECRET generated and written to .env.local`,
    pc.green("✓") + ` brand.config.ts patched (storeName + storeSlug)`,
    "",
    pc.bold("Next steps:"),
    `  cd ${projectName}`,
    `  npx prisma migrate deploy   ${pc.dim("# create / sync the DB schema")}`,
    `  npx prisma db seed          ${pc.dim("# seed demo products + categories")}`,
    `  ${runCmd} dev                ${pc.dim("# http://localhost:3000")}`,
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
