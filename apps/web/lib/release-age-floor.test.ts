import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * APP-MIN-RELEASE-AGE: the repo root's pnpm-workspace.yaml holds the engine's
 * supply-chain floor — pnpm refuses a version younger than three days — and
 * every exemption from it must still name a version the lockfile installs.
 * An exact-version exclude outlives its upgrade silently (twelve next@16.4.1
 * entries sat here after next moved to 16.4.6), so a dead one fails here.
 */
const REPO = join(__dirname, '..', '..', '..');
const workspace = readFileSync(join(REPO, 'pnpm-workspace.yaml'), 'utf8');
const lockfile = readFileSync(join(REPO, 'pnpm-lock.yaml'), 'utf8');

/** The `- item` lines under a top-level key, unquoted, comments dropped. */
function listUnder(yaml: string, key: string): string[] {
  const lines = yaml.split('\n');
  const start = lines.findIndex((line) => line.startsWith(`${key}:`));
  if (start === -1) return [];
  const items: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (/^\S/.test(line)) break; // next top-level key or comment block
    const item = line.match(/^\s+-\s+(.+?)\s*(#.*)?$/);
    if (item) items.push(item[1].replace(/^(['"])(.*)\1$/, '$2'));
  }
  return items;
}

/** True when the lockfile's packages section has exactly `name@version`. */
function locked(spec: string): boolean {
  const escaped = spec.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  return new RegExp(`^ {2}'?${escaped}'?(\\(|:)`, 'm').test(lockfile);
}

describe('the pnpm release-age floor', () => {
  it('is set to at least three days, in minutes, as in the engine', () => {
    const floor = workspace.match(/^minimumReleaseAge:\s*(\d+)\s*$/m);
    expect(floor, 'pnpm-workspace.yaml has no top-level minimumReleaseAge').not.toBeNull();
    expect(Number(floor![1])).toBeGreaterThanOrEqual(3 * 24 * 60);
  });

  it('exempts only exact versions the lockfile still installs', () => {
    const excludes = listUnder(workspace, 'minimumReleaseAgeExclude');
    for (const spec of excludes) {
      expect(spec, `${spec} is not an exact name@version`).toMatch(/^(@[^/\s]+\/)?[^@\s]+@\d[^\s]*$/);
      expect(locked(spec), `${spec} matches nothing in pnpm-lock.yaml — drop the dead exclude`).toBe(true);
    }
  });

  it('can tell a locked version from a dead one', () => {
    // Guards the helpers above: a parser that never matches would pass the
    // exclude check vacuously.
    const packages = lockfile.slice(lockfile.indexOf('\npackages:\n'));
    const scoped = packages.match(/^ {2}'(@[^/\s]+\/[^@\s']+@\d[^\s'(]*)/m)?.[1];
    const plain = packages.match(/^ {2}([^@\s'][^@\s']*@\d[^\s'(:]*)/m)?.[1];
    expect(scoped && locked(scoped), `scoped entry ${scoped}`).toBe(true);
    expect(plain && locked(plain), `plain entry ${plain}`).toBe(true);
    expect(locked('next@0.0.0-never-published')).toBe(false);
    expect(locked(`${plain}9`)).toBe(false); // a version prefix is not a match
    expect(
      listUnder('minimumReleaseAgeExclude:\n  # why\n  - next@16.4.1\n  - "@next/env@16.4.1"\nother:\n  - x\n', 'minimumReleaseAgeExclude'),
    ).toEqual(['next@16.4.1', '@next/env@16.4.1']);
  });
});
