import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FALLBACK_ENGINE_VERSION } from './engine';

/**
 * The /changelog timeline is typed by hand, and nothing tied it to the engine
 * release: the template-bump PR moves FALLBACK_ENGINE_VERSION (and the CLI's
 * DEFAULT_REF) but never touches the page, so v0.68.0 shipped while the
 * newest entry still read v0.67.0. This pins the newest entry to the engine
 * version the site states — equal, not merely "not behind": an entry for a
 * release that does not exist yet is wrong too.
 *
 * Read as text rather than imported: a Next.js page may not export RELEASES,
 * and the page module pulls in the fumadocs layout. The page's own comment
 * above RELEASES says the newest entry must begin with its `engine:` line, so
 * an entry without one (or with fields reordered) fails here instead of
 * letting the second entry's version pass for the first.
 */
describe('/changelog names the current engine release first', () => {
  const page = readFileSync(join(__dirname, '..', 'app', 'changelog', 'page.tsx'), 'utf8');

  it('the newest entry is the FALLBACK_ENGINE_VERSION release', () => {
    const newest = page.match(/^const RELEASES: Release\[\] = \[\s*\{\s*engine: '([^']+)',/m)?.[1];
    expect(newest, 'RELEASES[0] must begin with an engine: line').toBeTruthy();
    expect(
      newest,
      'write the /changelog entry for the engine release lib/engine.ts names (apps/web/app/changelog/page.tsx)',
    ).toBe(`v${FALLBACK_ENGINE_VERSION}`);
  });
});
