import { execSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { hasGitRemote } from "./scaffold.js";

/**
 * `hasGitRemote` decides whether the success banner is allowed to say the CI
 * workflow runs.
 *
 * Every scaffold gets `.github/workflows/ci.yml`, and the banner used to
 * announce it as running "on every push" unconditionally. Until GitHub has the
 * repository it runs on no push at all — and a workflow file that *looks* like
 * coverage is worse than none, because nobody goes looking for a green mark
 * that has never existed. One downstream fork ran 117 commits that way.
 *
 * So the banner asks git rather than assuming, and this pins the predicate.
 */

const dirs: string[] = [];

function repo(): string {
  const dir = mkdtempSync(join(tmpdir(), "cw-remote-"));
  dirs.push(dir);
  execSync("git init -q", { cwd: dir });
  return dir;
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

describe("hasGitRemote", () => {
  it("is false for a fresh repo — which is exactly what the scaffolder leaves", () => {
    expect(hasGitRemote(repo())).toBe(false);
  });

  it("is true once a remote exists", () => {
    const dir = repo();
    execSync("git remote add origin https://example.test/shop.git", { cwd: dir });

    expect(hasGitRemote(dir)).toBe(true);
  });

  it("is false outside a git repo rather than throwing", () => {
    // --no-git scaffolds still write ci.yml, so this path is reachable and must
    // degrade to 'no remote', not crash the banner.
    const dir = mkdtempSync(join(tmpdir(), "cw-nogit-"));
    dirs.push(dir);

    expect(hasGitRemote(dir)).toBe(false);
  });
});
