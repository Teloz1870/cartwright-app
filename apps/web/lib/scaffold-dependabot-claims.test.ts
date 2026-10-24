import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * SEC-DEPENDABOT: create-cartwright writes `.github/dependabot.yml` into every
 * scaffold (apps/cli/src/fork-ci.ts), and the CLI options page says what it
 * does. Each sentence of that paragraph is pinned to the CLI source here, so
 * the page cannot keep promising grouped security PRs, or majors left alone,
 * after the generated file stops doing it.
 */
const ROOT = join(__dirname, '..');
const CLI = join(ROOT, '..', 'cli', 'src');
const doc = readFileSync(join(ROOT, 'content/docs/getting-started/cli-options.mdx'), 'utf8');
const forkCi = readFileSync(join(CLI, 'fork-ci.ts'), 'utf8');
const index = readFileSync(join(CLI, 'index.ts'), 'utf8');

const paragraph = doc.split('\n').find((line) => line.includes('.github/dependabot.yml')) ?? '';

describe('the CLI options page on the scaffold dependabot.yml', () => {
  it('names the file, and the CLI writes it next to ci.yml', () => {
    expect(paragraph).toContain('`.github/workflows/ci.yml`');
    expect(forkCi).toMatch(/join\(dir, "dependabot\.yml"\)/);
    expect(forkCi).toMatch(/const written = writeWorkflow\(targetDir\);\n\s+writeDependabot\(targetDir\);/);
  });

  it('says --no-git scaffolds get it too, and the write happens outside the git step', () => {
    expect(paragraph).toContain('under `--no-git` too');
    const write = index.indexOf('const forkCiWritten = writeForkCi(targetDir);');
    expect(write).toBeGreaterThan(-1);
    expect(write).toBeLessThan(index.indexOf('if (initGit) {'));
  });

  it('says weekly, Next.js with React together, and majors left to the owner', () => {
    expect(paragraph).toContain('weekly');
    expect(forkCi.match(/interval: "weekly"/g)?.length).toBe(2);
    expect(paragraph).toContain('Next.js with React in one');
    expect(forkCi).toMatch(/next-react:\n\s+patterns: \["next", "@next\/\*", "eslint-config-next", "react", "react-dom"/);
    expect(paragraph).toContain('majors left to you');
    // The actions entry is the exception: its PRs carry majors.
    expect(paragraph).toContain('majors included');
    expect(forkCi).toContain('package-ecosystem: "github-actions"');
    expect(forkCi).toContain('majors included');
    expect(forkCi).toContain('update-types: ["version-update:semver-major"]');
  });

  it('says security fixes come as one PR, and that they need the repository setting', () => {
    expect(paragraph).toContain('groups security fixes into one PR');
    expect(forkCi).toMatch(/security:\n\s+applies-to: security-updates\n\s+patterns: \["\*"\]/);
    expect(paragraph).toContain('*Dependabot security updates* is on');
  });
});
