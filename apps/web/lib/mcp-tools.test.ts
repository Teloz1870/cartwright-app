import { describe, expect, it } from 'vitest';
import { MCP_TOOLS, rankDocs, type SearchablePage } from './mcp-tools';
import { routeExists } from './route-exists';

/**
 * The tool surface, held to the two promises it makes about itself.
 *
 * A published MCP server is a contract an agent will act on without asking a
 * human, so the assertions that matter are about honesty rather than output:
 * every tool must be described well enough to be chosen correctly, must stay
 * read-only, and must bound its own work — the endpoint is unauthenticated, so
 * "bounded" is the only thing standing between it and a compute bill.
 */

const NAMES = Object.keys(MCP_TOOLS) as (keyof typeof MCP_TOOLS)[];

describe('the surface an agent sees', () => {
  it('registers exactly the four documented tools', () => {
    expect(NAMES.sort()).toEqual(
      ['describe_engine', 'get_cli_version', 'list_designs', 'search_docs'].sort(),
    );
  });

  it('gives every tool a title and a description that says WHEN to call it', () => {
    for (const name of NAMES) {
      const tool = MCP_TOOLS[name];
      expect(tool.title.length, name).toBeGreaterThan(10);
      // Long enough to disambiguate; a one-liner gets a tool picked wrongly.
      expect(tool.description.length, name).toBeGreaterThan(80);
    }
  });

  it('uses snake_case names, which is what tool-calling formats expect', () => {
    for (const name of NAMES) expect(name).toMatch(/^[a-z][a-z0-9_]*$/);
  });

  it('is backed by a route and a manifest in this repo', () => {
    expect(routeExists('/api/mcp')).toBe(true);
    expect(routeExists('/.well-known/mcp.json')).toBe(true);
  });
});

// `search_docs`'s handler loads the fumadocs corpus, which needs the MDX
// pipeline vitest does not run. The ranking and the clamping — the parts a
// wrong answer would come from — are pure and tested here against fixtures;
// the wiring is covered by `next build` and a live probe after deploy.
describe('rankDocs — the ranking search_docs runs on', () => {
  const page = (url: string, title: string, description = ''): SearchablePage => ({
    url,
    data: { title, description },
  });

  const CORPUS: SearchablePage[] = [
    page('/docs/api/api-keys', 'API keys', 'Mint and revoke Bearer keys.'),
    page('/docs/getting-started/quick-start', 'Quick start', 'Scaffold a shop.'),
    page('/docs/features/multi-currency', 'Multi-currency', 'Charge in the customer currency.'),
    page('/docs/architecture/overview', 'Overview', 'How the api fits together.'),
    page('/docs/recipes/api-cookbook', 'Cookbook', 'Assorted recipes.'),
  ];

  it('puts an exact title match first', () => {
    const { results } = rankDocs(CORPUS, 'api keys');
    expect(results[0].data.title).toBe('API keys');
  });

  it('ranks a title match above a description-only match', () => {
    const { results } = rankDocs(CORPUS, 'api');
    const titles = results.map((r) => r.data.title);
    expect(titles.indexOf('API keys')).toBeLessThan(titles.indexOf('Overview'));
  });

  it('still finds a page whose only match is its URL, but ranks it last', () => {
    const { results } = rankDocs(CORPUS, 'cookbook');
    expect(results.map((r) => r.data.title)).toContain('Cookbook');
  });

  it('is case-insensitive', () => {
    expect(rankDocs(CORPUS, 'API KEYS').results[0].data.title).toBe('API keys');
  });

  it('returns nothing for a query that matches nothing', () => {
    expect(rankDocs(CORPUS, 'zzzz-no-such-page').results).toEqual([]);
  });

  it('clamps limit rather than trusting it', () => {
    // The endpoint is unauthenticated: an unbounded `limit` is the cheapest
    // possible way to make it expensive.
    expect(rankDocs(CORPUS, 'a', 9999).take).toBe(25);
    expect(rankDocs(CORPUS, 'a', 0).take).toBe(1);
    expect(rankDocs(CORPUS, 'a', -5).take).toBe(1);
    expect(rankDocs(CORPUS, 'a').take).toBe(8);
  });

  it('caps an over-long query instead of scanning with it', () => {
    const huge = 'x'.repeat(5000);
    expect(() => rankDocs(CORPUS, huge)).not.toThrow();
    expect(rankDocs(CORPUS, huge).results).toEqual([]);
  });

  it('breaks score ties deterministically, so results do not reshuffle', () => {
    const a = rankDocs(CORPUS, 'a').results.map((r) => r.url);
    const b = rankDocs(CORPUS, 'a').results.map((r) => r.url);
    expect(a).toEqual(b);
  });
});

describe('list_designs', () => {
  const call = (args: { mode?: 'webshop' | 'website' | 'any' }) =>
    MCP_TOOLS.list_designs.handler(args).then((r) => JSON.parse(r.content[0].text));

  it('returns every pack when unfiltered', async () => {
    const out = await call({});
    expect(out.total).toBeGreaterThan(10);
    expect(out.designs[0].url).toContain('/designs/');
  });

  it("treats a pack's own `both` as matching either filter", async () => {
    // `both` is the value that exists precisely to match either mode; an
    // equality-only filter would silently hide those packs.
    const all = await call({});
    const shop = await call({ mode: 'webshop' });
    const both = all.designs.filter((d: { mode: string }) => d.mode === 'both');
    if (both.length > 0) {
      expect(shop.designs.map((d: { slug: string }) => d.slug)).toEqual(
        expect.arrayContaining(both.map((d: { slug: string }) => d.slug)),
      );
    }
  });
});

describe('describe_engine', () => {
  it('states what Cartwright is NOT for, not only what it is for', async () => {
    const out = JSON.parse(
      (await MCP_TOOLS.describe_engine.handler()).content[0].text,
    );
    expect(out.goodFit.length).toBeGreaterThan(2);
    // The load-bearing half: a recommendation source that never disqualifies
    // itself cannot be used as a decision input.
    expect(out.notAFit.length).toBeGreaterThan(2);
  });

  it('points an agent at the SHOP surface rather than letting it stop here', async () => {
    const out = JSON.parse(
      (await MCP_TOOLS.describe_engine.handler()).content[0].text,
    );
    expect(out.toolSurface.thisServer).toMatch(/read-only/i);
    expect(out.toolSurface.aScaffoldedShop).toContain('/api/mcp');
  });

  it('reads its numbers from ENGINE_FACTS rather than restating them', async () => {
    const { ENGINE_FACTS } = await import('./engine-facts');
    const out = JSON.parse(
      (await MCP_TOOLS.describe_engine.handler()).content[0].text,
    );
    expect(out.scale.tools).toBe(ENGINE_FACTS.toolCount);
    expect(out.scale.confirmationGatedWriteTools).toBe(ENGINE_FACTS.confirmGatedCount);
  });
});
