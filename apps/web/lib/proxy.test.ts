import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import proxy, { config } from '../proxy';
import { mergeVaryAccept } from './content-negotiation';

/**
 * The proxy, exercised as the thing that actually runs on every request.
 *
 * `content-negotiation.test.ts` pins the DECISION; this pins the plumbing —
 * which URL a decision rewrites to, and whether `Vary: Accept` survives onto the
 * response. The second one is the whole point of the change: without it, two
 * representations behind one URL is a cache race rather than a feature.
 */

const CHROME =
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8';

function request(pathname: string, headers: Record<string, string> = {}) {
  return new NextRequest(`https://cartwright.app${pathname}`, { headers });
}

/** The URL a rewrite points at, or null when the response was not a rewrite. */
function rewriteTarget(res: Response): string | null {
  const target = res.headers.get('x-middleware-rewrite');
  return target ? new URL(target).pathname : null;
}

describe('Vary: Accept', () => {
  it('is set on a plain HTML response', () => {
    const res = proxy(request('/pricing', { accept: CHROME }));
    expect(res.headers.get('vary')).toContain('Accept');
  });

  it('is set on a rewritten Markdown response', () => {
    const res = proxy(request('/', { accept: 'text/markdown' }));
    expect(res.headers.get('vary')).toContain('Accept');
  });

  it('is APPENDED to Next\'s own Vary, never replacing it', () => {
    // Next uses Vary for RSC payload caching. Overwriting it would break
    // client-side navigation caching across the site while fixing Markdown.
    expect(mergeVaryAccept('rsc, next-router-state-tree')).toBe(
      'rsc, next-router-state-tree, Accept',
    );
  });

  it('does not grow the header when Accept is already listed', () => {
    // The proxy can run more than once over a response in development; a naive
    // append would produce `Accept, Accept, Accept`.
    expect(mergeVaryAccept('rsc, Accept')).toBe('rsc, Accept');
    expect(mergeVaryAccept('accept')).toBe('accept');
    expect(mergeVaryAccept(mergeVaryAccept('rsc'))).toBe('rsc, Accept');
  });

  it('is just Accept when there was nothing there before', () => {
    expect(mergeVaryAccept(null)).toBe('Accept');
    expect(mergeVaryAccept('')).toBe('Accept');
  });
});

describe('the homepage', () => {
  it('stays HTML for a browser', () => {
    expect(rewriteTarget(proxy(request('/', { accept: CHROME })))).toBeNull();
  });

  it('rewrites to the Markdown representation when Markdown is preferred', () => {
    expect(rewriteTarget(proxy(request('/', { accept: 'text/markdown' })))).toBe(
      '/llms.mdx/home',
    );
  });

  it('follows q-values rather than the presence of the token', () => {
    expect(
      rewriteTarget(
        proxy(request('/', { accept: 'text/markdown;q=0.2, text/html;q=0.9' })),
      ),
    ).toBeNull();
  });
});

describe('docs', () => {
  it('rewrites a Markdown-preferring request to the content route', () => {
    expect(
      rewriteTarget(proxy(request('/docs/introduction', { accept: 'text/markdown' }))),
    ).toBe('/llms.mdx/docs/introduction/content.md');
  });

  it('honours the .md suffix regardless of Accept — the URL named the variant', () => {
    expect(
      rewriteTarget(proxy(request('/docs/introduction.md', { accept: CHROME }))),
    ).toBe('/llms.mdx/docs/introduction/content.md');
  });

  it('serves HTML to a browser', () => {
    expect(
      rewriteTarget(proxy(request('/docs/introduction', { accept: CHROME }))),
    ).toBeNull();
  });
});

describe('pages with no Markdown variant', () => {
  it('serve HTML rather than 406, even when Markdown was asked for', () => {
    const res = proxy(request('/pricing', { accept: 'text/markdown' }));
    expect(res.status).not.toBe(406);
    expect(rewriteTarget(res)).toBeNull();
  });
});

describe('406', () => {
  it('is returned when the client accepts neither HTML nor Markdown', async () => {
    const res = proxy(request('/pricing', { accept: 'application/xml' }));
    expect(res.status).toBe(406);
    expect(res.headers.get('vary')).toBe('Accept');
    expect((await res.json()).error).toBe('not_acceptable');
  });

  it('is NEVER returned to a browser or a wildcard client', () => {
    for (const accept of [CHROME, '*/*', 'text/*', 'application/xml, */*;q=0.1']) {
      expect(proxy(request('/pricing', { accept })).status, accept).not.toBe(406);
    }
  });

  it('is never returned to an RSC or prefetch request', () => {
    // These carry `Accept: text/x-component`, which names nothing we offer.
    // Without the exemption every client-side navigation on the site would 406.
    const cases: Record<string, string>[] = [
      { accept: 'text/x-component', rsc: '1' },
      { accept: 'text/x-component' },
      { accept: 'application/xml', 'next-router-prefetch': '1' },
    ];
    for (const headers of cases) {
      const res = proxy(request('/pricing', headers));
      expect(res.status).not.toBe(406);
      expect(rewriteTarget(res)).toBeNull();
    }
  });
});

describe('machine routes are passed through untouched', () => {
  it('never rewrites a document that is already machine-readable', () => {
    for (const p of ['/llms.txt', '/llms-full.txt', '/openapi.json', '/static.json']) {
      const res = proxy(request(p, { accept: 'text/markdown' }));
      expect(rewriteTarget(res), p).toBeNull();
      expect(res.status, p).not.toBe(406);
    }
  });

  it('never 406s a JSON-only client on a machine route', () => {
    // A tool fetching /openapi.json sends `Accept: application/json` with no
    // wildcard — the exact header that 406s on a page.
    const res = proxy(request('/openapi.json', { accept: 'application/json' }));
    expect(res.status).not.toBe(406);
  });
});

describe('the matcher', () => {
  const [pattern] = config.matcher;
  const matches = (pathname: string) => new RegExp(`^${pattern}$`).test(pathname);

  it('covers documents', () => {
    for (const p of ['/', '/pricing', '/docs/introduction', '/compare/lovable']) {
      expect(matches(p), p).toBe(true);
    }
  });

  it('keeps the .md suffix form IN — it is this proxy that rewrites it', () => {
    expect(matches('/docs/introduction.md')).toBe(true);
  });

  it('excludes API routes and build output', () => {
    for (const p of ['/api/version', '/_next/static/chunk.js', '/_vercel/insights/view']) {
      expect(matches(p), p).toBe(false);
    }
  });

  it('excludes static assets, whose Accept describes an image, not a document', () => {
    for (const p of ['/logos/stripe.svg', '/showcase/shot.png', '/fonts/x.woff2']) {
      expect(matches(p), p).toBe(false);
    }
  });
});
