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
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
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
 * Write .github/workflows/ci.yml into the scaffold. Returns true when the
 * file was written, false when skipped (already exists) or failed (fail-soft).
 */
export function writeForkCi(targetDir: string): boolean {
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
