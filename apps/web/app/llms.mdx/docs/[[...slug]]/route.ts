import { getLLMText, getPageMarkdownUrl, source } from '@/lib/source';
import { MARKDOWN_CONTENT_TYPE } from '@/lib/content-negotiation';
import { recoveryMarkdown, SITE_URL } from '@/lib/agent-resources';

export const revalidate = false;

/**
 * The Markdown representation of a docs page.
 *
 * Two corrections here, both about what the caller can rely on:
 *
 * - **`charset=utf-8` is now stated.** The response was `Content-Type:
 *   text/markdown` with no charset. Docs pages contain em-dashes and typographic
 *   quotes, so a client falling back to a single-byte default mojibakes them, and
 *   acceptmarkdown.com specifies the parameter explicitly.
 * - **A missing page answers Markdown, not HTML.** It used to call `notFound()`,
 *   which renders the React 404 — so an agent that asked for Markdown and guessed
 *   a docs URL wrong got a page of HTML back: correct 404 status, nothing it
 *   could parse. It now gets the same recovery map the HTML 404 shows, as
 *   Markdown, still with a 404.
 */
export async function GET(
  _req: Request,
  { params }: RouteContext<'/llms.mdx/docs/[[...slug]]'>,
) {
  const { slug } = await params;
  const segments = slug?.slice(0, -1);
  const page = source.getPage(segments);

  if (!page) {
    const requested = segments?.length ? `/docs/${segments.join('/')}` : '/docs';
    return new Response(recoveryMarkdown(requested), {
      status: 404,
      headers: {
        'Content-Type': MARKDOWN_CONTENT_TYPE,
        Vary: 'Accept',
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex',
        Link: `<${SITE_URL}/llms.txt>; rel="index"`,
      },
    });
  }

  return new Response(await getLLMText(page), {
    headers: {
      'Content-Type': MARKDOWN_CONTENT_TYPE,
      Vary: 'Accept',
    },
  });
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    lang: page.locale,
    slug: getPageMarkdownUrl(page).segments,
  }));
}
