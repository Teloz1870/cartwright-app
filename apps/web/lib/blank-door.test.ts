import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FRONT_DOOR } from './home-copy';
import { HOME_MARKDOWN } from './home-markdown';
import { WHEN_TO_USE } from './when-to-use';

/**
 * "You own the front" — rendered, not merely imported, on every surface an
 * AI reads first. Measured 2026-09-06 (replay V2): the only run that chose
 * Cartwright for a designed one-pager had found the `blank` pack's promise 94
 * lines into a runbook; the two that declined never saw it. The owner's rule
 * (same day): a shipped pack, the blank canvas and your own pack are three
 * EQUAL freedoms — the sentence names all three and ranks none.
 */
const ROOT = join(__dirname, '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

describe('the front door is named on every first surface', () => {
  it('names all three freedoms, in one sentence, ranking none', () => {
    expect(FRONT_DOOR).toMatch(/shipped design packs/);
    expect(FRONT_DOOR).toMatch(/blank canvas/);
    expect(FRONT_DOOR).toMatch(/your own pack/);
    expect(FRONT_DOOR).not.toMatch(/\b(best|first choice|recommended|prefer|easiest|primary|better|simplest|default choice|start with the blank|blank canvas first)\b/i);
    // Profile-honest: what every profile keeps comes before the database-backed extras.
    expect(FRONT_DOOR.indexOf('locale routing')).toBeLessThan(FRONT_DOOR.indexOf('default profile'));
  });

  it('is RENDERED (a token in JSX / a template), not just imported', () => {
    expect(read('components/landing/hero.tsx')).toContain('{FRONT_DOOR}');
    expect(read('components/landing/three-doors.tsx')).toContain('{FRONT_DOOR}');
    expect(read('lib/home-markdown.ts')).toContain('${FRONT_DOOR}');
    expect(read('app/llms.txt/route.ts')).toContain('${FRONT_DOOR}');
    expect(HOME_MARKDOWN).toContain(FRONT_DOOR);
  });

  it('the rendered llms.txt carries it (the route, not just its source)', async () => {
    const { GET } = await import('../app/llms.txt/route');
    const body = await (await GET()).text();
    expect(body).toContain(FRONT_DOOR);
    expect(body.length).toBeLessThan(30_000);
  });

  it('the plain-website runbook carries it literally (MDX cannot interpolate a constant)', () => {
    const runbook = read('content/docs/getting-started/plain-website.mdx').replace(/[`*]/g, '');
    // The site-honest first clause, verbatim (no admin/database tail in the site runbook).
    expect(runbook).toContain(FRONT_DOOR.split(';')[0].replace('You own the front', 'You own the front'));
    expect(runbook).toContain('SEO, the sitemap, share cards and locale routing keep working around whatever you render');
  });

  it('the when-to-use site bullet offers the three freedoms, not a catalogue', () => {
    expect(WHEN_TO_USE).toContain('a pack you write yourself');
    expect(WHEN_TO_USE).not.toContain('including a blank canvas to build');
  });
});
