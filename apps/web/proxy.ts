import { NextRequest, NextResponse } from 'next/server';
import { rewritePath } from 'fumadocs-core/negotiation';
import { docsContentRoute, docsRoute } from '@/lib/shared';
import { discoveryLinkHeader } from '@/lib/discovery-links';
import {
  HTML_TYPE,
  MARKDOWN_TYPE,
  isInternalNextRequest,
  mergeVaryAccept,
  negotiate,
  notAcceptableResponse,
} from '@/lib/content-negotiation';

/**
 * Content negotiation for the whole origin.
 *
 * Two things changed here, and only one of them is visible in a response body:
 *
 * 1. **`Vary: Accept` on every document response.** This origin serves two
 *    representations of some URLs. Without `Vary`, a shared cache stores
 *    whichever one it saw first and hands it to everyone — an agent asking for
 *    Markdown gets the cached HTML, or a browser gets raw Markdown, decided by
 *    nothing but arrival order. The header is what makes serving two
 *    representations correct rather than a race.
 * 2. **The homepage negotiates too.** `/docs/*` already did (fumadocs holds
 *    those pages as MDX and can hand the source back); `/` is hand-written React
 *    with nothing to hand back, so `Accept: text/markdown` on the site's
 *    most-fetched URL returned HTML. It now rewrites to an authored Markdown
 *    representation.
 *
 * The negotiation decision itself lives in `lib/content-negotiation.ts` so it can
 * be tested without a server; this file is the plumbing.
 *
 * Paths with no Markdown variant still answer HTML to a Markdown-preferring
 * client. That is RFC 9110 §15.5.7's "serve it anyway" branch, and it is the
 * right call: a 406 with no content is strictly worse for the caller than the
 * HTML it can still parse.
 *
 * ## Where `Vary: Accept` does and does not land — measured, not assumed
 *
 * It lands on the **Markdown** responses (`/`, `/docs/*`, the `.md` suffix
 * form). It does NOT land on the **HTML** ones: Next computes its own `Vary`
 * (`rsc, next-router-state-tree, …, Accept-Encoding`) for every app-router
 * response and overwrites whatever was set upstream.
 *
 * That was verified rather than guessed. Setting `Vary` AND a throwaway
 * `X-Probe` header for `/` in `next.config.mjs`'s `headers()` and measuring a
 * production build gave `X-Probe: yes` and a `Vary` with no `Accept` — so the
 * mechanism works and `Vary` specifically is replaced. The config block was
 * removed again rather than left in place looking effective.
 *
 * This is not a cache hazard here, because the rewrite happens BEFORE the cache
 * lookup: a Markdown request for `/` is rewritten to `/llms.mdx/home` and is
 * therefore a different cache key, not a second representation competing for the
 * same one. The client that asked for Markdown also gets the response that does
 * carry `Vary: Accept`. Making the HTML variant declare it too would mean
 * restating Next's internal token list in config and keeping it in sync — a
 * brittle trade for a race this architecture does not have.
 */

const { rewrite: rewriteDocs } = rewritePath(
  `${docsRoute}{/*path}`,
  `${docsContentRoute}{/*path}/content.md`,
);
const { rewrite: rewriteSuffix } = rewritePath(
  `${docsRoute}{/*path}.md`,
  `${docsContentRoute}{/*path}/content.md`,
);

/** Where `/` goes when Markdown wins the negotiation. */
const HOME_MARKDOWN_ROUTE = '/llms.mdx/home';

/**
 * Paths that already ARE a machine-readable representation. Negotiating them
 * again would be nonsense — `/llms.txt` is plain text by definition, and the
 * `/llms.mdx/*` routes set their own `Content-Type`.
 */
function isMachineRoute(pathname: string): boolean {
  return (
    pathname.startsWith('/llms.mdx/') ||
    pathname === '/llms.txt' ||
    pathname === '/llms-full.txt' ||
    pathname === '/openapi.json' ||
    pathname === '/static.json' ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt' ||
    pathname === '/index.md' ||
    pathname.startsWith('/.well-known/')
  );
}

/** `true` when this exact path has an authored Markdown representation. */
function hasMarkdownVariant(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname === docsRoute ||
    pathname.startsWith(`${docsRoute}/`)
  );
}

/** Every response leaving this proxy states that it varies on `Accept`. */
function withVary(response: NextResponse): NextResponse {
  response.headers.set('Vary', mergeVaryAccept(response.headers.get('Vary')));
  return response;
}

/**
 * Advertise the machine-readable surface at the HTTP layer.
 *
 * The `<link rel="alternate">` in the document head only reaches a client that
 * already parsed the HTML. A crawler doing `HEAD`, or one deciding what to fetch
 * before it fetches anything, sees only headers — so the same facts ride here
 * too (RFC 8288). Never overwrites a `Link` a route handler set for itself.
 */
function withDiscoveryLinks(response: NextResponse, pathname: string): NextResponse {
  if (!response.headers.has('Link')) {
    response.headers.set('Link', discoveryLinkHeader(pathname));
  }
  return response;
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // `/docs/page.md` — an explicit suffix request. Not negotiation: the caller
  // named the representation in the URL, so `Accept` does not enter into it.
  const suffixTarget = rewriteSuffix(pathname);
  if (suffixTarget) {
    return withVary(NextResponse.rewrite(new URL(suffixTarget, request.nextUrl)));
  }

  // Internal RSC / prefetch traffic carries `Accept: text/x-component`. It is
  // not a document request, and negotiating it would 406 every client-side
  // navigation on the site.
  if (isInternalNextRequest(request.headers) || isMachineRoute(pathname)) {
    return withVary(NextResponse.next());
  }

  const decision = negotiate(request.headers.get('accept'), {
    hasMarkdown: hasMarkdownVariant(pathname),
  });

  if (decision === 'unacceptable') {
    return notAcceptableResponse([HTML_TYPE, MARKDOWN_TYPE]);
  }

  if (decision === 'markdown') {
    if (pathname === '/') {
      return withVary(
        NextResponse.rewrite(new URL(HOME_MARKDOWN_ROUTE, request.nextUrl)),
      );
    }
    const docsTarget = rewriteDocs(pathname);
    if (docsTarget) {
      return withVary(NextResponse.rewrite(new URL(docsTarget, request.nextUrl)));
    }
  }

  return withDiscoveryLinks(withVary(NextResponse.next()), pathname);
}

/**
 * Document requests only.
 *
 * Without a matcher this ran on static assets and API routes too, where the
 * `Accept` header describes an image or a JSON payload rather than a document —
 * exactly the input that would make a negotiating proxy answer 406 to a
 * perfectly good request for a PNG.
 *
 * The extension list is explicit rather than "anything with a dot" for one
 * reason: `.md` must stay IN. `/docs/<page>.md` is the suffix form of the
 * Markdown representation, and it is this proxy that rewrites it — excluding it
 * would silently retire a documented URL shape.
 */
export const config = {
  matcher: [
    '/((?!api/|_next/|_vercel/|.*\\.(?:png|jpe?g|gif|svg|ico|webp|avif|css|js|mjs|map|txt|xml|json|woff2?|ttf|otf|pdf|mp4|webm|zip)$).*)',
  ],
};
