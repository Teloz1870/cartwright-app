import { describe, expect, it } from 'vitest';
import { discoveryLinkHeader, markdownTwin } from './discovery-links';
import { frontmatter, HOME_MARKDOWN } from './home-markdown';
import { GET as INDEX_MD } from '../app/index.md/route';
import { GET as HOME_MD } from '../app/llms.mdx/home/route';
import { MARKDOWN_CONTENT_TYPE } from './content-negotiation';

/**
 * The advertisements, and the documents they point at.
 *
 * The one failure mode worth engineering against: advertising a Markdown twin
 * for a page that has none. The caller follows the link, gets HTML with a
 * Markdown media type expectation, and reasonably concludes the rest of the
 * header is junk too. So `markdownTwin` is pinned from both sides — what it
 * claims, and what it refuses to claim.
 */

describe('markdownTwin', () => {
  it('maps the homepage to /index.md', () => {
    expect(markdownTwin('/')).toBe('/index.md');
  });

  it('maps a docs page to its .md suffix form', () => {
    expect(markdownTwin('/docs/introduction')).toBe('/docs/introduction.md');
    expect(markdownTwin('/docs/getting-started/quick-start')).toBe(
      '/docs/getting-started/quick-start.md',
    );
  });

  it('does not double-suffix a path that already ends in .md', () => {
    expect(markdownTwin('/docs/introduction.md')).toBe('/docs/introduction.md');
  });

  it('tolerates a trailing slash', () => {
    expect(markdownTwin('/docs/introduction/')).toBe('/docs/introduction.md');
  });

  it('sends the bare /docs redirect at the page it lands on', () => {
    expect(markdownTwin('/docs')).toBe('/docs/introduction.md');
  });

  it('returns null for every page that has NO markdown twin', () => {
    // The load-bearing half. These pages are HTML-only today; claiming a twin
    // for them would advertise a URL that answers the wrong thing.
    for (const p of ['/pricing', '/compare', '/compare/lovable', '/designs', '/showcase', '/security']) {
      expect(markdownTwin(p), p).toBeNull();
    }
  });
});

describe('discoveryLinkHeader', () => {
  it('advertises sitemap, index, service description and API catalog everywhere', () => {
    const h = discoveryLinkHeader('/pricing');
    expect(h).toContain('</sitemap.xml>; rel="sitemap"');
    expect(h).toContain('</llms.txt>; rel="index"');
    expect(h).toContain('</openapi.json>; rel="service-desc"');
    expect(h).toContain('</.well-known/api-catalog>; rel="api-catalog"');
  });

  it('adds the markdown alternate ONLY where one exists', () => {
    expect(discoveryLinkHeader('/')).toContain(
      '</index.md>; rel="alternate"; type="text/markdown"',
    );
    expect(discoveryLinkHeader('/docs/introduction')).toContain(
      '</docs/introduction.md>; rel="alternate"; type="text/markdown"',
    );
    expect(discoveryLinkHeader('/pricing')).not.toContain('text/markdown');
  });

  it('uses relative references, so it stays correct on any host', () => {
    // Preview deployments and forks serve this same header; hard-coding
    // cartwright.app would point a fork's agents at someone else's site.
    expect(discoveryLinkHeader('/')).not.toContain('https://');
  });

  it('is a single well-formed header value', () => {
    const h = discoveryLinkHeader('/docs/introduction');
    for (const part of h.split(', ')) {
      expect(part, part).toMatch(/^<[^>]+>(; \w+="[^"]*")+$/);
    }
  });
});

describe('frontmatter', () => {
  it('opens with --- and carries title plus a metadata slot', () => {
    const fm = frontmatter({ title: 'T', description: 'D', canonical: 'https://x/' });
    expect(fm.startsWith('---\n')).toBe(true);
    expect(fm).toContain("title: 'T'");
    expect(fm).toContain("description: 'D'");
    expect(fm).toContain("canonical: 'https://x/'");
    expect(fm.trimEnd().endsWith('---')).toBe(true);
  });

  it('escapes a quote the YAML way rather than breaking the block', () => {
    expect(frontmatter({ title: "It's fine" })).toContain("title: 'It''s fine'");
  });

  it('omits absent optional fields instead of emitting empty ones', () => {
    const fm = frontmatter({ title: 'T' });
    expect(fm).not.toContain('description:');
    expect(fm).not.toContain('canonical:');
  });
});

describe('the two spellings of the Markdown homepage', () => {
  it('serve byte-identical documents', async () => {
    // One export, two routes. Two hand-maintained copies would drift.
    expect(await INDEX_MD().text()).toBe(await HOME_MD().text());
  });

  it('both declare text/markdown with a charset', () => {
    expect(INDEX_MD().headers.get('content-type')).toBe(MARKDOWN_CONTENT_TYPE);
    expect(HOME_MD().headers.get('content-type')).toBe(MARKDOWN_CONTENT_TYPE);
  });

  it('open with frontmatter carrying title, description and canonical', () => {
    expect(HOME_MARKDOWN.startsWith('---\n')).toBe(true);
    const block = HOME_MARKDOWN.slice(0, HOME_MARKDOWN.indexOf('\n---', 4));
    expect(block).toContain('title:');
    expect(block).toContain('description:');
    expect(block).toContain('canonical:');
  });

  it('put a top-level heading immediately after the frontmatter', () => {
    // The scanner requires the body to start with a heading, not HTML.
    const body = HOME_MARKDOWN.split('\n---\n')[1] ?? '';
    expect(body.trimStart().startsWith('# ')).toBe(true);
  });

  it('point back at the canonical HTML page in a Link header', () => {
    expect(INDEX_MD().headers.get('link')).toContain('rel="canonical"');
    expect(HOME_MD().headers.get('link')).toContain('rel="canonical"');
  });

  it('only the negotiated route varies on Accept', () => {
    // /index.md named its representation in the URL — it has one form.
    expect(HOME_MD().headers.get('vary')).toBe('Accept');
    expect(INDEX_MD().headers.get('vary')).toBeNull();
  });
});
