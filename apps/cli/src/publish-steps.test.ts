import { describe, expect, it } from "vitest";
import { publishSteps, type PublishState } from "./publish-steps";

/**
 * R1 falsifier on app#415: in a fresh clone (`git clone <repo> x && cd x &&
 * create-cartwright . --yes`) the banner said "Your code is already on GitHub ✓"
 * and "CI … runs on every push" while `git status` showed the scaffold commit
 * ahead of origin; with --no-git it said there was no remote and printed a
 * `gh repo create … --remote=origin` that clashes with the origin the clone has.
 */
// picocolors is on under CI=true, so compare the words, not the escape codes.
const plain = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "");
const steps = (s: Partial<PublishState>) => {
  const r = publishSteps({
    slug: "nord-kaffe",
    ciWritten: true,
    gitInitialized: true,
    remoteBefore: undefined,
    remoteNow: false,
    ...s,
  });
  return { ci: plain(r.ci), step1: plain(r.step1) };
};

describe("publishSteps — a remote the folder already had is not a push", () => {
  it("clone + git: push the scaffold commit; CI is inactive until then", () => {
    const r = steps({ remoteBefore: "origin", remoteNow: true });
    expect(r.step1).toContain("git push -u origin HEAD");
    expect(r.step1).not.toMatch(/already on GitHub|gh repo create/);
    expect(r.ci).toContain("inactive until you push the scaffold commit to origin");
    expect(r.ci).not.toContain("runs on every push");
  });

  it("clone + --no-git: commit, then push — never a second origin", () => {
    const r = steps({ remoteBefore: "origin", gitInitialized: false });
    expect(r.step1).toContain(
      'git add -A && git commit -m "feat: initial commit from create-cartwright" && git push -u origin HEAD',
    );
    expect(r.step1).not.toMatch(/gh repo create|--remote=origin/);
    expect(r.ci).toContain("inactive until you commit it and push to origin");
    expect(r.ci).not.toContain("until this project has a remote");
  });

  it("pushes to the remote that is there, whatever it is called", () => {
    expect(steps({ remoteBefore: "upstream", remoteNow: true }).step1).toContain("git push -u upstream HEAD");
  });

  it("a remote this run created with `gh repo create --push` is on GitHub", () => {
    const r = steps({ remoteNow: true });
    expect(r.step1).toContain("Your code is already on GitHub ✓");
    expect(r.ci).toContain("runs on every push");
  });

  it("no remote at all: offer the private repo, CI inactive until then", () => {
    const r = steps({});
    expect(r.step1).toContain("gh repo create nord-kaffe --private --source=. --remote=origin --push");
    expect(r.step1).toContain("this also turns on the CI above");
    expect(r.ci).toContain("inactive until this project has a remote");
  });

  it("no CI file, no CI claim", () => {
    for (const s of [{}, { remoteNow: true }, { remoteBefore: "origin" }]) {
      const r = steps({ ...s, ciWritten: false });
      expect(r.ci).toBe("");
      expect(r.step1).not.toContain("CI");
    }
  });
});
