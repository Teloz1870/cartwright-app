import { docsRoute } from './shared';

/**
 * The `Link:` response header (RFC 8288) that advertises this origin's
 * machine-readable surface.
 *
 * The HTML `<link rel="alternate">` in the document head only helps a client
 * that already parsed the HTML. An agent doing a `HEAD` request, or one fetching
 * a non-HTML representation, never sees it. The header carries the same facts at
 * the HTTP layer, which is where a crawler decides what to fetch next.
 *
 * The Markdown alternate is emitted ONLY for paths that genuinely have one — `/`
 * and `/docs/*`. Advertising a Markdown twin that answers HTML is worse than
 * advertising nothing: the caller follows the link, gets the wrong media type,
 * and now distrusts every other link in the header.
 */

/** Paths that have a Markdown twin, and where that twin lives. */
export function markdownTwin(pathname: string): string | null {
  if (pathname === '/') return '/index.md';
  if (pathname === docsRoute) return `${docsRoute}/introduction.md`;
  if (pathname.startsWith(`${docsRoute}/`)) {
    const clean = pathname.replace(/\/+$/, '');
    return clean.endsWith('.md') ? clean : `${clean}.md`;
  }
  return null;
}

/**
 * Build the header value. Relative URI-references are legal in `Link` (RFC 8288
 * §3) and resolve against the request URI, which keeps this correct on preview
 * deployments and on a fork's own domain without knowing either.
 */
export function discoveryLinkHeader(pathname: string): string {
  const parts = [
    '</sitemap.xml>; rel="sitemap"; type="application/xml"',
    '</llms.txt>; rel="index"; type="text/plain"',
    '</openapi.json>; rel="service-desc"; type="application/json"',
    '</.well-known/api-catalog>; rel="api-catalog"',
  ];

  const twin = markdownTwin(pathname);
  if (twin) {
    parts.unshift(`<${twin}>; rel="alternate"; type="text/markdown"`);
  }

  return parts.join(', ');
}
