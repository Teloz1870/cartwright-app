import { MARKDOWN_CONTENT_TYPE } from '@/lib/content-negotiation';
import { HOME_MARKDOWN } from '@/lib/home-markdown';
import { SITE_URL } from '@/lib/agent-resources';
import { discoveryLinkHeader } from '@/lib/discovery-links';

/**
 * The homepage as Markdown, reached by content negotiation.
 *
 * `proxy.ts` rewrites `Accept: text/markdown` on `/` here. The document itself
 * lives in `lib/home-markdown.ts` because `/index.md` serves the same bytes by
 * the suffix route — one copy, two spellings, no drift.
 */

export const revalidate = false;

export function GET(): Response {
  return new Response(HOME_MARKDOWN, {
    headers: {
      'Content-Type': MARKDOWN_CONTENT_TYPE,
      Vary: 'Accept',
      Link: `<${SITE_URL}/>; rel="canonical", ${discoveryLinkHeader('/')}`,
    },
  });
}
