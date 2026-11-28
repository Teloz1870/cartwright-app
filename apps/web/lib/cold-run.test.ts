import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { COLD_RUN } from './home-copy';
import { HOME_MARKDOWN } from './home-markdown';
import { getComparison } from './comparisons';

/**
 * The default profile's ~27 s / ~99 s were measured once, on engine v0.35.0
 * (June 2026), and never re-run. An undated figure reads as a promise about
 * today's release — the same rule SITE_COLD_RUN's test pins for the site
 * profile (site-cold-run.test.ts). Measured 2026-11-28 on app main 51c247d:
 * the provenance said only "Measured cold run", llms.txt and the
 * create-next-app comparison typed the figures as literals, and the
 * describe_engine MCP answer returned them with no date or version.
 */
const ROOT = join(__dirname, '..');

describe('COLD_RUN — measured, with provenance', () => {
  it('names the date and the engine version it was measured on', () => {
    expect(COLD_RUN.provenance).toMatch(/\b\d{4}-\d{2}-\d{2}\b/);
    expect(COLD_RUN.provenance).toMatch(/engine v\d+\.\d+\.\d+/);
    // The run's own receipt: engine CHANGELOG `## v0.35.0 — 2026-06-11`.
    expect(COLD_RUN.provenance).toContain('engine v0.35.0');
    expect(COLD_RUN.provenance).toContain('2026-06-11');
  });

  it('renders both figures with the tilde — measured, not guaranteed', () => {
    expect(COLD_RUN.running).toMatch(/^~\d+ s /);
    expect(COLD_RUN.designed).toMatch(/^~\d+ s /);
  });

  it('every surface that quotes the figures carries the provenance with them', async () => {
    const { GET } = await import('../app/llms.txt/route');
    const llms = await (await GET()).text();
    const comparison = getComparison('create-next-app');
    const timeRow = comparison?.rows.find((r) => r.dimension === 'Time to a shippable website/shop');
    const { MCP_TOOLS } = await import('./mcp-tools');
    const engine = JSON.parse((await MCP_TOOLS.describe_engine.handler()).content[0].text) as {
      profiles: { name: string; measured?: { provenance?: string; designed?: string } }[];
    };
    const light = engine.profiles.find((p) => p.name === 'light');
    const surfaces: Array<[string, string]> = [
      ['home markdown', HOME_MARKDOWN],
      ['llms.txt', llms],
      ['create-next-app comparison', timeRow?.cartwright ?? ''],
      ['describe_engine light profile', JSON.stringify(light?.measured ?? {})],
    ];
    for (const [name, text] of surfaces) {
      expect(text, `${name} quotes the designed figure`).toContain(COLD_RUN.designed);
      expect(text, `${name} dates it`).toContain(COLD_RUN.provenance);
    }
  });

  it('no literal 27 s / 99 s timing is typed outside home-copy.ts', () => {
    // The v0.35.0 changelog entry is that release's own dated history.
    const allowed = new Set(['lib/home-copy.ts', 'app/changelog/page.tsx']);
    const timing = /\b(?:27|99)(?:\s|-)?(?:s\b|sec\b|secs\b|seconds?\b)/;
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((name) => {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) return walk(p);
        return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [p] : [];
      });
    const offenders: string[] = [];
    for (const file of [...walk(join(ROOT, 'app')), ...walk(join(ROOT, 'lib'))]) {
      const rel = relative(ROOT, file);
      if (allowed.has(rel)) continue;
      readFileSync(file, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          if (timing.test(line)) offenders.push(`${rel}:${i + 1}: ${line.trim().slice(0, 120)}`);
        });
    }
    expect(offenders, 'read COLD_RUN instead of typing the figure').toEqual([]);
  });
});
