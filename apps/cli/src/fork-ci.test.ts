import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { writeDependabot, writeForkCi } from "./fork-ci.js";

/**
 * Every scaffold gets `.github/dependabot.yml` next to its CI workflow, so
 * GitHub opens the update PR in the customer's own repo (SEC-DEPENDABOT).
 *
 * Until 2.9.14 no scaffold had one: the engine carries no Dependabot or
 * Renovate config, and the template mirror's `.github/` holds only the issue
 * templates, the PR template and copilot-instructions. The CLI writes the file
 * (as it writes ci.yml), so the engine's own repo never runs it.
 *
 * The scaffold dir here is NOT a git repo on purpose: `--no-git` scaffolds get
 * the file too. It is a repository file, inert until GitHub hosts the project.
 */

const dirs: string[] = [];

function scaffoldDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "cw-dependabot-"));
  dirs.push(dir);
  return dir;
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

const read = (dir: string) => readFileSync(join(dir, ".github", "dependabot.yml"), "utf8");

/** The `- package-ecosystem:` entry for one ecosystem, up to the next entry. */
function entry(yml: string, ecosystem: string): string {
  const blocks = yml.split(/\n(?= {2}- package-ecosystem:)/);
  return blocks.find((b) => b.startsWith(`  - package-ecosystem: "${ecosystem}"`)) ?? "";
}

describe("the scaffold's .github/dependabot.yml", () => {
  it("is written by writeForkCi, with or without git, before the initial commit", () => {
    const dir = scaffoldDir();

    expect(writeForkCi(dir)).toBe(true);

    expect(existsSync(join(dir, ".github", "workflows", "ci.yml"))).toBe(true);
    expect(existsSync(join(dir, ".github", "dependabot.yml"))).toBe(true);
    expect(read(dir)).toMatch(/^version: 2$/m);
  });

  it("checks npm weekly, grouping Next.js with React and every other minor/patch bump in one more PR", () => {
    const dir = scaffoldDir();
    writeForkCi(dir);
    const npm = entry(read(dir), "npm");

    expect(npm).toContain('directory: "/"');
    expect(npm).toContain('interval: "weekly"');
    const limit = Number(/open-pull-requests-limit: (\d+)/.exec(npm)?.[1]);
    expect(limit).toBeGreaterThan(0);
    expect(limit).toBeLessThanOrEqual(3);

    const group = /next-react:\n\s+patterns: \[(.*)\]/.exec(npm)?.[1] ?? "";
    for (const pkg of ["next", "@next/*", "eslint-config-next", "react", "react-dom", "@types/react", "@types/react-dom"]) {
      expect(group).toContain(`"${pkg}"`);
    }
    // The catch-all comes after next-react: Dependabot puts a dependency in the
    // FIRST group it matches, so the order is what keeps Next.js out of it.
    expect(npm.indexOf("next-react:")).toBeLessThan(npm.indexOf("dependencies:"));
    expect(npm).toMatch(/dependencies:\n\s+patterns: \["\*"\]/);
  });

  it("groups security fixes into one PR and leaves majors to the owner without holding back a security fix", () => {
    const dir = scaffoldDir();
    writeForkCi(dir);
    const npm = entry(read(dir), "npm");

    expect(npm).toMatch(/security:\n\s+applies-to: security-updates\n\s+patterns: \["\*"\]/);
    // Majors are skipped by update TYPE, never by a `versions` range:
    // dependabot-core's IgnoreCondition#ignored_versions returns only `versions`
    // for a security update, so a fix that needs a major still arrives.
    expect(npm).toMatch(
      /ignore:\n\s+- dependency-name: "\*"\n\s+update-types: \["version-update:semver-major"\]/,
    );
    expect(npm).not.toMatch(/^\s+versions:/m);
  });

  // Every scaffold's pnpm-workspace.yaml sets `minimumReleaseAge: 4320` and its
  // ci.yml runs pnpm 11, which refuses a lockfile entry younger than that, frozen
  // or not. A version PR proposing a newer release would be red in the
  // customer's own CI, so Dependabot waits as long (R1 falsifier, app#419).
  it("waits out the scaffold's pnpm minimumReleaseAge before it proposes a version", () => {
    const dir = scaffoldDir();
    writeFileSync(join(dir, "pnpm-workspace.yaml"), "allowBuilds:\n  sharp: true\n\nminimumReleaseAge: 4320\n");
    writeForkCi(dir);
    const npm = entry(read(dir), "npm");

    expect(npm).toMatch(/\n {4}cooldown:\n {6}default-days: 3\n/);
    // No include list: the cooldown covers every dependency, as pnpm's rule does.
    expect(npm).not.toMatch(/^\s+include:/m);
  });

  it("takes the cooldown from the scaffold's own minimumReleaseAge, rounded up to whole days", () => {
    const days = (workspace: string | null) => {
      const dir = scaffoldDir();
      if (workspace !== null) writeFileSync(join(dir, "pnpm-workspace.yaml"), workspace);
      writeDependabot(dir);
      return Number(/cooldown:\n\s+default-days: (\d+)\n/.exec(entry(read(dir), "npm"))?.[1]);
    };

    expect(days("minimumReleaseAge: 10080\n")).toBe(7);
    expect(days("minimumReleaseAge: 4321 # three days and a minute\n")).toBe(4);
    // Dependabot accepts 1 to 90 days.
    expect(days("minimumReleaseAge: 1000000\n")).toBe(90);
    // No file, no setting, or 0: three days, the engine's value.
    expect(days(null)).toBe(3);
    expect(days("packages: []\n")).toBe(3);
    expect(days("minimumReleaseAge: 0\n")).toBe(3);
  });

  it("keeps the shipped workflow's actions current, majors included", () => {
    const dir = scaffoldDir();
    writeForkCi(dir);
    const actions = entry(read(dir), "github-actions");

    expect(actions).toContain('directory: "/"');
    expect(actions).toContain('interval: "weekly"');
    expect(actions).toMatch(/actions:\n\s+patterns: \["\*"\]/);
    // An action's releases are majors (actions/checkout@v4 → @v5); skipping
    // them would leave this entry with nothing to do.
    expect(actions).not.toContain("semver-major");
  });

  it("leaves out github-actions when the scaffold ships no workflow", () => {
    const dir = scaffoldDir();

    expect(writeDependabot(dir)).toBe(true);

    expect(entry(read(dir), "npm")).not.toBe("");
    expect(read(dir)).not.toContain("github-actions");
  });

  it("never replaces a dependabot.yml that is already there", () => {
    const dir = scaffoldDir();
    mkdirSync(join(dir, ".github"), { recursive: true });
    writeFileSync(join(dir, ".github", "dependabot.yml"), "version: 2\nupdates: []\n");

    expect(writeDependabot(dir)).toBe(false);
    writeForkCi(dir);

    expect(read(dir)).toBe("version: 2\nupdates: []\n");

    // GitHub reads either spelling; a second file next to it would be a clash.
    const yaml = scaffoldDir();
    mkdirSync(join(yaml, ".github"), { recursive: true });
    writeFileSync(join(yaml, ".github", "dependabot.yaml"), "version: 2\nupdates: []\n");

    expect(writeDependabot(yaml)).toBe(false);
    expect(existsSync(join(yaml, ".github", "dependabot.yml"))).toBe(false);
  });

  it("is fail-soft: a target it cannot write to returns false instead of throwing", () => {
    const file = join(scaffoldDir(), "not-a-dir");
    writeFileSync(file, "");

    expect(writeDependabot(file)).toBe(false);
    expect(writeForkCi(file)).toBe(false);
  });

  it("is plain block YAML: spaces only, two-space indents, one key or list item per line", () => {
    const dir = scaffoldDir();
    writeForkCi(dir);

    for (const line of read(dir).split("\n")) {
      if (line === "" || /^\s*#/.test(line)) continue;
      expect(line, JSON.stringify(line)).not.toContain("\t");
      expect((/^ */.exec(line)?.[0].length ?? 0) % 2, JSON.stringify(line)).toBe(0);
      expect(line, JSON.stringify(line)).toMatch(/^ *(- )?[a-z-]+:( .+)?$/);
    }
  });
});
