import { existsSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import pc from "picocolors";

export type Database = "turso" | "postgres" | "sqlite";
export type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

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
}

export function titleCase(projectName: string): string {
  return projectName
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

export function patchBrandConfigContent(original: string, projectName: string): string {
  return original
    .replace(/storeName:\s*"[^"]*"/, `storeName: "${titleCase(projectName)}"`)
    .replace(/storeSlug:\s*"[^"]*"/, `storeSlug: "${projectName}"`);
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
        "  No extra setup. dev.db will be created on first migration.",
      ].join("\n");
  }
}
