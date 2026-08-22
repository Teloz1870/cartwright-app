import { MARKDOWN_CONTENT_TYPE } from '@/lib/content-negotiation';
import { HOME_MARKDOWN } from '@/lib/home-markdown';
import { SITE_URL } from '@/lib/agent-resources';
import { discoveryLinkHeader } from '@/lib/discovery-links';

/**
 * `GET /index.md` — the suffix form of the Markdown homepage.
 *
 * `Accept: text/markdown` on `/` already worked. This exists because it is not
 * what agents actually try first: appending `.md` to a URL is a guess that costs
 * one request and needs no header negotiation, so crawlers reach for it before
 * they reach for content negotiation. Serving both means the guess succeeds
 * instead of teaching the caller that this origin has no Markdown.
 *
 * Same document as the negotiated route — both import `HOME_MARKDOWN`, so the
 * two spellings cannot drift.
 */

export const revalidate = false;

export function GET(): Response {
  return new Response(HOME_MARKDOWN, {
    headers: {
      'Content-Type': MARKDOWN_CONTENT_TYPE,
      Link: `<${SITE_URL}/>; rel="canonical", ${discoveryLinkHeader('/')}`,
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
