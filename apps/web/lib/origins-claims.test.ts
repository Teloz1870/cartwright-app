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
 *
 * Known limits (Gemini R2, nits 5-6), stated rather than hidden: the
 * promise-shape rule accepts any negation word within 150 chars, so "one-click
 * … no downtime" would pass — the reader of a review still has to read; and
 * the page-parity check matches names, not table cells. Both are ratchets
 * against the drift that was measured, not proofs of honesty.
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
  // Widened after Gemini R2 (nit 4): pages that could grow a promise without
  // ever having sold one. The guards are cheap; the list is the known set of
  // surfaces that talk about migration or the profiles at all.
  'content/docs/getting-started/cli-options.mdx',
  'content/docs/getting-started/plain-website.mdx',
  'content/docs/in-the-box.mdx',
  'app/llms.txt/route.ts',
  'lib/home-markdown.ts',
];

/** Every surface that promises redirects must say they live in Upstash Redis — without it nothing fires (proxy.ts reads the map from Redis only). */
const REDIRECT_SURFACES = ['lib/when-to-use.ts', 'lib/comparisons.ts', 'components/landing/faq.tsx', 'content/docs/faq.mdx', 'content/docs/why-cartwright.mdx', 'content/docs/getting-started/choose-your-path.mdx', 'content/docs/in-the-box.mdx'];

/** Every surface that names Hoptify must couple it to --profile full within 300 chars. */
const HOPTIFY_SURFACES = [
  'lib/comparisons.ts',
  'lib/use-cases.ts',
  'lib/when-to-use.ts',
  'lib/mcp-tools.ts',
  'components/landing/faq.tsx',
  'content/docs/faq.mdx',
  'content/docs/why-cartwright.mdx',
  'content/docs/in-the-box.mdx',
  'content/docs/getting-started/choose-your-path.mdx',
  'app/(home)/onboarding/onboarding-client.tsx',
  'app/(home)/onboarding/page.tsx',
];

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

  it.each(REDIRECT_SURFACES)('%s names Upstash Redis beside EVERY admin-managed-redirect promise', (rel) => {
    // Per mention (Gemini R2, nit 3): a new paragraph promising redirects
    // without Redis must go red even though an earlier one names it.
    const src = read(rel);
    const mentions = [...src.matchAll(/admin[- ]managed redirect|admin redirects/gi)];
    expect(mentions.length, rel).toBeGreaterThanOrEqual(1);
    for (const m of mentions) {
      const near = src.slice(Math.max(0, m.index! - 300), m.index! + 300);
      expect(near, `${rel} @${m.index}`).toMatch(/Upstash Redis|UPSTASH_REDIS|Redis required/);
    }
  });

  it.each(HOPTIFY_SURFACES)('%s couples every Hoptify mention to --profile full (falsifier R2: /compare/shopify had none)', (rel) => {
    // Per mention, per surface: scoping this to one file left /compare/shopify
    // selling Hoptify with no profile and no limits.
    const src = read(rel);
    for (const m of src.matchAll(/Hoptify/gi)) {
      // 600 chars: an ORIGINS entry's `today` sits that far from its `minProfile`.
      const window = src.slice(Math.max(0, m.index! - 600), m.index! + 600);
      expect(window, `${rel} @${m.index}`).toMatch(/--profile[= ]full|profile full|full profile|only in full|minProfile: 'full'/);
    }
    expect(src).not.toContain('pull design and catalogue across');
    expect(src).not.toContain('pull your palette and products across');
  });

  it('the URL origin says imported services have no public page on a customer scaffold', () => {
    // Engine: app/[locale]/services/* is saas-gated (Teloz-only) and pruned by
    // the light profile; classify.ts still routes /services|ydelser|… there.
    const url = ORIGINS.find((o) => o.id === 'url')!;
    expect(url.notYet).toMatch(/public page for imported services/);
    expect(url.today).not.toMatch(/pages, services and posts/);
    expect(read('components/landing/faq.tsx')).toMatch(/no public page today/);
    expect(read('content/docs/getting-started/choose-your-path.mdx')).toMatch(/public page for imported services/);
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
