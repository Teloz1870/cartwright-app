/**
 * Fork CI — the customer-safe GitHub Actions workflow every scaffold ships with.
 *
 * Why it is written HERE (launch-audit 2026-07-15, codex blueprint #4): the
 * public template mirror deliberately excludes every workflow file (the
 * mirror-sync PAT lacks the `workflow` scope), so scaffolds historically had
 * NO CI safety net at all. The CLI writing the file into the scaffold —
 * before the initial commit — sidesteps the mirror restriction entirely: the
 * customer's own repo has no such limitation.
 *
 * Kept deliberately boring and dependency-light: install → typecheck → unit
 * tests → migration-baseline verify → production build, with dummy env vars
 * (the suite is hermetic; the build needs only AUTH_SECRET + a file: DB URL).
 * Fail-soft: scaffolding never breaks because a CI file could not be written.
 *
 * `.github/dependabot.yml` comes from here for the same reason (SEC-DEPENDABOT):
 * an engine-side file would reach scaffolds through the mirror but also switch
 * Dependabot on in the engine's own repo, which must not get it. Written for
 * every profile and also under `--no-git`, exactly like ci.yml: it is a
 * repository file that GitHub reads once it hosts the project and that does
 * nothing before, and the `--no-git` user (an existing clone, their own commit)
 * is the one who pushes it.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const WORKFLOW = `name: ci

# Written by create-cartwright at scaffold time — your repo, your CI.
# Runs on every push/PR: typecheck, unit tests, migration verify, build.
on:
  push:
    branches: [main]
  pull_request:

jobs:
  checks:
    name: typecheck · test · db:verify · build
    runs-on: ubuntu-latest
    env:
      # Dummy values — the unit suite is hermetic and the build only needs
      # these to exist. Real secrets belong in your deploy platform, not CI.
      AUTH_SECRET: ci-dummy-auth-secret-not-used-in-production
      DATABASE_URL: file:./ci.db
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 11
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm test
      # The committed migration baseline must always match prisma/schema.prisma
      # (see prisma/migrations/README.md). --if-present: the script ships from
      # engine v0.40.0; older template refs simply skip the step.
      - run: pnpm run --if-present db:verify
      - run: pnpm build
`;

/**
 * Days Dependabot waits before it proposes a new npm version: the scaffold's
 * own pnpm `minimumReleaseAge` (minutes, in pnpm-workspace.yaml), rounded up
 * to whole days. pnpm 11 refuses a lockfile entry younger than that, frozen or
 * not, so a version PR for a newer release would be red in the customer's own
 * ci.yml. The CLI carries no copy of the value; it reads the template's file,
 * so the two cannot drift. Dependabot measures `default-days` in 86 400-second
 * days and accepts 1 to 90. No file, no setting or 0 gives three days, the
 * engine's 4320 minutes.
 */
const DEFAULT_COOLDOWN_DAYS = 3;

export function npmCooldownDays(targetDir: string): number {
  try {
    const src = readFileSync(join(targetDir, "pnpm-workspace.yaml"), "utf8");
    const minutes = Number(/^minimumReleaseAge:\s*(\d+)\s*(?:#.*)?$/m.exec(src)?.[1] ?? 0);
    if (minutes > 0) return Math.min(90, Math.ceil(minutes / 1440));
  } catch {
    // No pnpm-workspace.yaml: fall through to the default.
  }
  return DEFAULT_COOLDOWN_DAYS;
}

const dependabotNpm = (cooldownDays: number) => `# Written by create-cartwright at scaffold time. GitHub reads it once this
# project is a GitHub repository; until then it does nothing.
#
# Every week, at most two npm PRs: Next.js with React (they move together),
# and every other minor/patch bump. Majors are yours to choose, so these
# updates skip them. A version is proposed once it is ${cooldownDays} days old, the
# minimumReleaseAge in pnpm-workspace.yaml: pnpm refuses to install anything
# younger, so the PR's CI would fail. Security fixes come grouped in one PR of
# their own, held back by neither rule: Dependabot applies both to version
# updates only. pnpm still applies minimumReleaseAge, so a fix younger than
# that fails ci.yml until it is old enough or listed in
# minimumReleaseAgeExclude. Security PRs also need Settings → Code security →
# Dependabot security updates switched on.
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    cooldown:
      default-days: ${cooldownDays}
    open-pull-requests-limit: 2
    ignore:
      - dependency-name: "*"
        update-types: ["version-update:semver-major"]
    groups:
      security:
        applies-to: security-updates
        patterns: ["*"]
      next-react:
        patterns: ["next", "@next/*", "eslint-config-next", "react", "react-dom", "@types/react", "@types/react-dom"]
      dependencies:
        patterns: ["*"]
`;

// Only when a workflow ships: the actions in .github/workflows/ are what this
// entry updates, and without one Dependabot reports a missing-file error.
const DEPENDABOT_ACTIONS = `  # The actions in .github/workflows/, majors included: an action's releases
  # are majors (actions/checkout@v4 → @v5).
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 1
    groups:
      actions:
        patterns: ["*"]
`;

/**
 * Write .github/dependabot.yml into the scaffold. Returns true when written,
 * false when skipped (already exists) or failed (fail-soft).
 */
export function writeDependabot(targetDir: string): boolean {
  try {
    const dir = join(targetDir, ".github");
    const file = join(dir, "dependabot.yml");
    if (existsSync(file) || existsSync(join(dir, "dependabot.yaml"))) return false;
    const workflows = join(dir, "workflows");
    const shipsWorkflow =
      existsSync(workflows) && readdirSync(workflows).some((f) => /\.ya?ml$/.test(f));
    mkdirSync(dir, { recursive: true });
    writeFileSync(file, dependabotNpm(npmCooldownDays(targetDir)) + (shipsWorkflow ? DEPENDABOT_ACTIONS : ""));
    return true;
  } catch {
    return false;
  }
}

/**
 * Write .github/workflows/ci.yml, then .github/dependabot.yml, into the
 * scaffold. Returns true when ci.yml was written, false when skipped (already
 * exists) or failed (fail-soft) — the banner's CI line reads this.
 */
export function writeForkCi(targetDir: string): boolean {
  const written = writeWorkflow(targetDir);
  writeDependabot(targetDir);
  return written;
}

function writeWorkflow(targetDir: string): boolean {
  try {
    const dir = join(targetDir, ".github", "workflows");
    const file = join(dir, "ci.yml");
    if (existsSync(file)) return false;
    mkdirSync(dir, { recursive: true });
    writeFileSync(file, WORKFLOW);
    return true;
  } catch {
    return false;
  }
}
