#!/usr/bin/env node
/**
 * create-cartwright — scaffolder for AI-first webshops.
 *
 * Usage:
 *   npx create-cartwright@latest [name] [--yes] [--template=<slug>]
 *                                [--pm=pnpm|npm|yarn|bun] [--no-install] [--no-git]
 *
 * Pulls the latest cartwright-template snapshot (public mirror of the private
 * cartwright repo) via giget, fills .env.local from .env.example with the
 * supplied store-name, optionally installs deps and initializes git.
 */
import { intro, outro, text, select, confirm, cancel, isCancel, spinner } from "@clack/prompts";
import { downloadTemplate } from "giget";
import pc from "picocolors";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { execSync } from "node:child_process";
import { parseArgs } from "node:util";

const TEMPLATE_REPO = "github:Teloz1870/cartwright-template";

type CartwrightAnswers = {
  projectName: string;
  database: "turso" | "postgres" | "sqlite";
  withAi: boolean;
  packageManager: "pnpm" | "npm" | "yarn" | "bun";
  installDeps: boolean;
  initGit: boolean;
};

function detectPackageManager(): "pnpm" | "npm" | "yarn" | "bun" {
  const ua = process.env.npm_config_user_agent ?? "";
  if (ua.startsWith("pnpm")) return "pnpm";
  if (ua.startsWith("yarn")) return "yarn";
  if (ua.startsWith("bun")) return "bun";
  return "npm";
}

function exitOnCancel<T>(value: T | symbol): T {
  if (isCancel(value)) {
    cancel("Cancelled.");
    process.exit(0);
  }
  return value as T;
}

async function run(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      yes: { type: "boolean", short: "y" },
      template: { type: "string", default: "generic" },
      pm: { type: "string" },
      "no-install": { type: "boolean" },
      "no-git": { type: "boolean" },
    },
  });

  intro(`${pc.bgYellow(pc.black(" create-cartwright "))} ${pc.dim("v0.1.0-beta")}`);

  const defaultName = positionals[0] ?? "my-cartwright-shop";
  const projectName = values.yes
    ? defaultName
    : exitOnCancel(
        await text({
          message: "Project name?",
          initialValue: defaultName,
          validate: (v) =>
            /^[a-z][a-z0-9-]*$/.test(v) ? undefined : "Use lowercase, letters/digits/dashes, start with a letter.",
        }),
      );

  const database = values.yes
    ? "turso"
    : exitOnCancel(
        await select({
          message: "Database?",
          options: [
            { value: "turso", label: "Turso (recommended — libSQL on edge)" },
            { value: "postgres", label: "Postgres (Neon / Supabase / self-hosted)" },
            { value: "sqlite", label: "SQLite (local-only)" },
          ],
          initialValue: "turso",
        }),
      ) as "turso" | "postgres" | "sqlite";

  const withAi = values.yes
    ? true
    : exitOnCancel(
        await confirm({
          message: "Include AI commerce features? (requires Anthropic + Gemini API keys)",
          initialValue: true,
        }),
      );

  const detected = detectPackageManager();
  const packageManager = (values.pm as CartwrightAnswers["packageManager"] | undefined) ?? detected;
  const installDeps = !values["no-install"];
  const initGit = !values["no-git"];

  const targetDir = resolve(process.cwd(), projectName);
  if (existsSync(targetDir)) {
    cancel(`Directory "${projectName}" already exists.`);
    process.exit(1);
  }

  // Fetch template
  const s = spinner();
  s.start(`Fetching cartwright template…`);
  try {
    await downloadTemplate(TEMPLATE_REPO, {
      dir: targetDir,
      force: false,
    });
    s.stop(pc.green("Template downloaded."));
  } catch (err) {
    s.stop(pc.red("Template fetch failed."));
    console.error(err);
    process.exit(1);
  }

  // Pre-fill .env.local from .env.example
  const envExamplePath = join(targetDir, ".env.example");
  if (existsSync(envExamplePath)) {
    const example = readFileSync(envExamplePath, "utf8");
    const local = example.replace(/^STORE_NAME=.*/m, `STORE_NAME="${projectName}"`);
    writeFileSync(join(targetDir, ".env.local"), local);
  }

  // Optional git init
  if (initGit) {
    try {
      execSync("git init -q && git add -A && git commit -q -m 'feat: initial commit from create-cartwright'", {
        cwd: targetDir,
        stdio: "ignore",
      });
    } catch {
      // git may not be installed — ignore
    }
  }

  // Optional install
  if (installDeps) {
    const s2 = spinner();
    s2.start(`Installing dependencies with ${packageManager}…`);
    try {
      execSync(`${packageManager} install`, { cwd: targetDir, stdio: "ignore" });
      s2.stop(pc.green("Dependencies installed."));
    } catch {
      s2.stop(pc.yellow("Install failed — run manually."));
    }
  }

  // Success banner
  const lines = [
    pc.green("✓") + ` Created ${pc.bold(projectName)} at ${pc.dim(targetDir)}`,
    "",
    pc.bold("Next steps:"),
    `  cd ${projectName}`,
    `  cp .env.local .env`,
    `  ${packageManager} db:setup`,
    `  ${packageManager} dev`,
    "",
    pc.dim("Docs:    https://cartwright.app/docs/getting-started/quick-start"),
    pc.dim("Discord: https://cartwright.app/discord"),
    pc.dim("Database choice: " + database + (withAi ? "  · AI features enabled" : "")),
  ].join("\n");

  outro(lines);
}

run().catch((err) => {
  console.error(pc.red("Unexpected error:"), err);
  process.exit(1);
});
