import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MCP_TOOLS } from './mcp-tools';
import { METHODS, ORIGINS, WHEN_TO_USE } from './when-to-use';
import { routeExists } from './route-exists';

/**
 * The origin claims are a RATCHET.
 *
 * Until 2026-09-06 three surfaces sold a WooCommerce migration that does not
 * exist ("Hoptify can pull design + products across", "CSV covers catalog
 * exports from Shopify, WooCommerce, Magento and Squarespace", "column mapping
 * is configurable"). The V4 replay baseline measured what an AI did with that:
 * one run asserted that variants move, that `/?p=123` redirects work and that
 * "a Woo migration needs --profile full" — none true — and two more called
 * redirects undocumented (they exist; one clause on one page). So every
 * surface that names WordPress or WooCommerce must say, in the same file, what
 * is not built; the retired phrases can never return; and an origin may move
 * from planned to shipped only with a docs route that exists.
 */
const ROOT = join(__dirname, '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

const SURFACES = [
  'lib/when-to-use.ts',
  'lib/mcp-tools.ts',
  'lib/comparisons.ts',
  'components/landing/faq.tsx',
  'content/docs/faq.mdx',
  'content/docs/features/product-variants.mdx',
  'content/docs/why-cartwright.mdx',
  'content/docs/getting-started/choose-your-path.mdx',
  'lib/use-cases.ts',
];

/** Every surface that promises redirects must say they live in Upstash Redis — without it nothing fires (proxy.ts reads the map from Redis only). */
const REDIRECT_SURFACES = ['lib/when-to-use.ts', 'lib/comparisons.ts', 'components/landing/faq.tsx', 'content/docs/faq.mdx', 'content/docs/why-cartwright.mdx', 'content/docs/getting-started/choose-your-path.mdx'];

const RETIRED = [
  'pull design + products across',
  'covers catalog exports from',
  'column mapping is configurable',
];

describe('origin claims stay honest', () => {
  it.each(SURFACES)('%s never carries a retired phrase', (rel) => {
    const src = read(rel);
    for (const phrase of RETIRED) expect(src, phrase).not.toContain(phrase);
  });

  it.each(SURFACES)('%s qualifies every WordPress/WooCommerce mention that promises a move', (rel) => {
    // Window-level, not file-level: one honest sentence at the top of a file
    // must not license a new promise at the bottom (Gemini R1, nit 3). Only
    // promise-shaped windows count — "PHP + WordPress + MySQL" in a
    // comparison row is a description, not a migration claim.
    const src = read(rel);
    const PROMISE = /import|migrat|\bmove|bring[s]? [^.]{0,40}across|pull/i;
    const QUALIFIER = /not yet|planned, not built|not built|does not exist|no (dedicated|WordPress|WooCommerce)|simple products|by hand|Cartwright never runs on|never runs on PHP|WordPress hosting/i;
    for (const m of src.matchAll(/WooCommerce|WordPress/g)) {
      const window = src.slice(Math.max(0, m.index! - 700), m.index! + 700);
      if (!PROMISE.test(window)) continue;
      expect(window, `${rel} @${m.index}: "${src.slice(m.index!, m.index! + 60)}"`).toMatch(QUALIFIER);
    }
  });

  it.each(REDIRECT_SURFACES)('%s names Upstash Redis wherever it promises admin-managed redirects', (rel) => {
    const src = read(rel);
    expect(src).toMatch(/admin-managed redirect/);
    expect(src).toMatch(/Upstash Redis|UPSTASH_REDIS/);
  });

  it('every Hoptify mention in the use cases couples it to --profile full (an untouched page must not undo the axis)', () => {
    // Per mention, not per block: two occurrences in one block let a single
    // dropped clause stay green (measured while proving this test).
    const src = read('lib/use-cases.ts');
    const mentions = [...src.matchAll(/Hoptify/g)];
    expect(mentions.length).toBeGreaterThanOrEqual(2);
    for (const m of mentions) {
      const window = src.slice(Math.max(0, m.index! - 300), m.index! + 300);
      expect(window, `use-cases.ts @${m.index}`).toContain('--profile full');
    }
    expect(src).not.toContain('pull design and catalogue across');
  });

  it.each(SURFACES)('%s never states a promise-shaped migration claim without a negation beside it', (rel) => {
    // The window rule above accepts a promise that sits next to an honest
    // sentence (measured while proving it). Promise SHAPES are therefore
    // blocked outright unless negated within 150 chars — "A one-click
    // migration. There is no importer yet" passes; "One click imports your
    // whole catalogue. CSV covers simple products" does not.
    const src = read(rel);
    const SHAPES = [
      /one[- ]click/gi,
      /(whole|entire|full) (WooCommerce|WordPress|Shopify) (catalogue|catalog|site|shop|store)/gi,
      /(imports?|pulls?|brings?|moves?|migrates?) (your|the) (entire|whole|full|complete) /gi,
      /everything (moves|comes|carries) (across|over)/gi,
    ];
    const NEGATION = /not yet|there is no|\bno\b|\bnot\b|planned|not built|does not|never|cannot/i;
    for (const shape of SHAPES) {
      for (const m of src.matchAll(shape)) {
        const near = src.slice(Math.max(0, m.index! - 150), m.index! + 150);
        expect(near, `${rel} @${m.index}: "${m[0]}"`).toMatch(NEGATION);
      }
    }
  });

  it('the when-to-use block carries "not yet" and the query-permalink limit an AI otherwise promises', () => {
    expect(WHEN_TO_USE).toContain('Not yet:');
    expect(WHEN_TO_USE).toContain('/?p=123');
    expect(WHEN_TO_USE).toMatch(/planned, not built/);
  });

  it('describe_engine carries the axes, with the WooCommerce importer marked planned and Shopify pinned to full', async () => {
    const out = JSON.parse((await MCP_TOOLS.describe_engine.handler()).content[0].text) as {
      axes: Record<string, string>;
      methods: typeof METHODS;
      origins: typeof ORIGINS;
      goodFit: string[];
      links: { choosePath: string };
    };
    expect(Object.keys(out.axes).sort()).toEqual(['method', 'origin', 'profile']);
    expect(out.methods.map((m) => m.id)).toEqual(METHODS.map((m) => m.id));
    const woo = out.origins.find((o) => o.id === 'woocommerce')!;
    expect(woo.status).toBe('planned');
    expect(woo.notYet.length).toBeGreaterThan(40);
    expect(out.origins.find((o) => o.id === 'shopify')!.minProfile).toBe('full');
    expect(out.goodFit.join('\n')).toMatch(/planned, not built/);
    expect(routeExists(new URL(out.links.choosePath).pathname)).toBe(true);
  });

  it('the ratchet: exactly these origins are planned, and every origin points at a docs route that exists', () => {
    // Moving an origin to `shipped` is a one-line diff here — and it may only
    // happen with a runbook the reader can follow.
    expect(ORIGINS.filter((o) => o.status === 'planned').map((o) => o.id)).toEqual(['woocommerce']);
    for (const o of ORIGINS) expect(routeExists(o.docs), o.id).toBe(true);
  });
});
