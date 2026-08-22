import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { WHEN_TO_USE } from './when-to-use';
import { OPENAPI_DOCUMENT } from './openapi';
import { routeExists } from './route-exists';

/**
 * Every documentation link we hand an agent, followed.
 *
 * `llms.txt` gained a "developer resources" section naming pages by URL, and the
 * first draft of it named four pages that do not exist — `/docs/reference/…`
 * twice, and an `/docs/architecture/agent-commerce` that was never written. They
 * were plausible, they read fine, and every one of them would have sent an agent
 * into a 404 from the file whose entire job is to stop that happening.
 *
 * So the links are extracted from the sources and checked against the content
 * tree. This is the test that would have caught it.
 */

const WEB_ROOT = path.dirname(fileURLToPath(new URL('.', import.meta.url)));

function read(relative: string): string {
  return readFileSync(path.join(WEB_ROOT, relative), 'utf8');
}

/** Every `/docs/...` path mentioned in a blob of source or prose. */
function docsLinks(source: string): string[] {
  const matches = source.match(/\/docs\/[a-z0-9][a-z0-9/-]*/g) ?? [];
  return [...new Set(matches.map((m) => m.replace(/\.md$/, '')))];
}

const SOURCES: Record<string, string> = {
  'llms.txt': read('app/llms.txt/route.ts'),
  'when-to-use': WHEN_TO_USE,
  // The document itself, not the route that serves it: the body moved into a
  // shared module when /index.md started serving the same bytes.
  'home markdown': read('lib/home-markdown.ts'),
  'openapi': JSON.stringify(OPENAPI_DOCUMENT),
  '404 page': read('app/not-found.tsx'),
};

describe('documentation links point at pages that exist', () => {
  for (const [name, source] of Object.entries(SOURCES)) {
    it(`${name}: every /docs/… link resolves`, () => {
      const links = docsLinks(source);
      const broken = links.filter((link) => !routeExists(link));
      expect(broken, `broken links in ${name}`).toEqual([]);
    });
  }

  it('the check is not vacuous — llms.txt really does carry doc links', () => {
    const links = docsLinks(SOURCES['llms.txt']);
    expect(links.length).toBeGreaterThanOrEqual(5);
    expect(links).toContain('/docs/getting-started/ai-quick-start');
    expect(links).toContain('/docs/architecture/mcp-server');
  });

  it('catches a link to a page that does not exist', () => {
    // Mutation check on the checker itself: the exact shape of the four links
    // the first draft got wrong must fail.
    expect(routeExists('/docs/reference/scopes-and-tools')).toBe(false);
    expect(routeExists('/docs/architecture/agent-commerce')).toBe(false);
    // …while the pages they were replaced with really are there.
    expect(routeExists('/docs/api/mcp-tools')).toBe(true);
    expect(routeExists('/docs/features/agentic-commerce-protocol')).toBe(true);
  });

  it('bare /docs is a configured redirect, not a page', () => {
    // It is linked as an entry point, so it must resolve — but it does so
    // through next.config, which the filesystem check cannot see.
    const config = read('next.config.mjs');
    expect(config).toContain("source: '/docs'");
    expect(config).toContain("destination: '/docs/introduction'");
    expect(routeExists('/docs/introduction')).toBe(true);
  });
});

describe('the when-to-use block reads as guidance, not marketing', () => {
  it('names the jobs Cartwright is NOT for', () => {
    // The audit's phrasing was explicit that generic marketing copy does not
    // count. A recommendation source that never disqualifies itself cannot be
    // used as a decision input, so the negative list is the load-bearing half.
    expect(WHEN_TO_USE).toMatch(/not a fit/i);
    for (const shouldMention of ['blog', 'marketplace', 'Shopify', 'WordPress']) {
      expect(WHEN_TO_USE, shouldMention).toContain(shouldMention);
    }
  });

  it('states the literal first call an agent should make', () => {
    expect(WHEN_TO_USE).toContain('npx create-cartwright@latest');
  });

  it('is shared, not duplicated, between llms.txt and the Markdown homepage', () => {
    // Two copies would drift, and an agent would get different guidance
    // depending on which door it came through.
    expect(SOURCES['llms.txt']).toContain('WHEN_TO_USE');
    expect(SOURCES['home markdown']).toContain('WHEN_TO_USE');
    // …and both routes that serve the homepage Markdown import that one module,
    // rather than carrying a second copy of the prose.
    for (const route of ['app/llms.mdx/home/route.ts', 'app/index.md/route.ts']) {
      expect(read(route), route).toContain("from '@/lib/home-markdown'");
    }
  });
});
