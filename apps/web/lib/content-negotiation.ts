/**
 * Proactive content negotiation for `Accept: text/markdown` (acceptmarkdown.com).
 *
 * The site already served Markdown for `/docs/*` — fumadocs' `isMarkdownPreferred`
 * rewrote those requests — but two things were missing, and both are the kind of
 * bug that only shows up through a CDN:
 *
 * 1. **No `Vary: Accept`.** Two representations of the same URL with no `Vary`
 *    means whichever one lands in the shared cache first is served to everyone.
 *    An agent asking for Markdown could get the cached HTML, or a browser could
 *    get raw Markdown, depending on nothing but arrival order. `Vary` is not a
 *    nicety here; it is what makes serving two representations correct at all.
 * 2. **No q-value handling.** `isMarkdownPreferred` looks for the token. A
 *    browser sending `text/html,…,*​/*;q=0.8` does not mention `text/markdown`
 *    at all, so that was fine in practice — but `Accept: text/markdown;q=0.1,
 *    text/html;q=0.9` says the opposite of what a token search concludes.
 *
 * This module is the whole negotiation decision, kept pure so it can be tested
 * without a server. `proxy.ts` is the only caller.
 *
 * ## Why 406 is narrow
 *
 * RFC 9110 §15.5.7 permits — never requires — a 406 when nothing acceptable can
 * be produced, and explicitly allows serving an unacceptable representation
 * instead. A site that 406s eagerly breaks real clients for no gain, so this
 * returns `"unacceptable"` ONLY when the header names concrete types, none of
 * them match what we can produce, and no wildcard rescues it. Every browser and
 * every crawler sends `*​/*` or `text/html`, so they never reach that branch;
 * `Accept: application/xml` on an HTML page does.
 */

/** The exact media type acceptmarkdown.com specifies for the Markdown variant. */
export const MARKDOWN_CONTENT_TYPE = 'text/markdown; charset=utf-8';

export const HTML_TYPE = 'text/html';
export const MARKDOWN_TYPE = 'text/markdown';

type AcceptEntry = {
  type: string;
  subtype: string;
  q: number;
  /** Position in the header, used to break q ties in the client's stated order. */
  order: number;
};

/**
 * Parse an `Accept` header into entries sorted most-preferred first.
 *
 * Malformed parameters are ignored rather than fatal: a header is attacker- and
 * proxy-controlled input, and the safe failure for negotiation is "I could not
 * read a preference", not a 500.
 */
export function parseAccept(header: string | null | undefined): AcceptEntry[] {
  if (!header) return [];
  const entries: AcceptEntry[] = [];

  header.split(',').forEach((part, order) => {
    const [rawType, ...params] = part.split(';');
    const mediaType = rawType.trim().toLowerCase();
    if (!mediaType) return;

    const slash = mediaType.indexOf('/');
    if (slash === -1) return;

    let q = 1;
    for (const param of params) {
      const eq = param.indexOf('=');
      if (eq === -1) continue;
      if (param.slice(0, eq).trim().toLowerCase() !== 'q') continue;
      const parsed = Number.parseFloat(param.slice(eq + 1).trim());
      // NaN, negative and >1 are all malformed; RFC 9110 pins q to [0,1].
      if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) q = parsed;
    }

    entries.push({
      type: mediaType.slice(0, slash),
      subtype: mediaType.slice(slash + 1),
      q,
      order,
    });
  });

  return entries.sort((a, b) => (b.q - a.q) || (a.order - b.order));
}

/** The q-value this header assigns to one concrete media type, most specific wins. */
export function qualityFor(entries: AcceptEntry[], mediaType: string): number {
  const slash = mediaType.indexOf('/');
  const type = mediaType.slice(0, slash);
  const subtype = mediaType.slice(slash + 1);

  // Specificity order per RFC 9110 §12.5.1: exact > type/* > */*.
  const exact = entries.find((e) => e.type === type && e.subtype === subtype);
  if (exact) return exact.q;
  const typeWildcard = entries.find((e) => e.type === type && e.subtype === '*');
  if (typeWildcard) return typeWildcard.q;
  const anything = entries.find((e) => e.type === '*' && e.subtype === '*');
  if (anything) return anything.q;
  return 0;
}

export type Negotiation = 'html' | 'markdown' | 'unacceptable';

/**
 * Which representation to serve for a document request.
 *
 * `hasMarkdown` says whether this particular path HAS a Markdown variant. When
 * it does not, a Markdown-preferring client still gets HTML — that is the
 * RFC-sanctioned "serve it anyway" choice, and it is strictly better for the
 * caller than a 406 with no content at all.
 */
export function negotiate(
  acceptHeader: string | null | undefined,
  { hasMarkdown }: { hasMarkdown: boolean },
): Negotiation {
  const entries = parseAccept(acceptHeader);

  // No header, or nothing parseable in it: the default representation.
  if (entries.length === 0) return 'html';

  const html = qualityFor(entries, HTML_TYPE);
  const markdown = qualityFor(entries, MARKDOWN_TYPE);

  // Neither type is acceptable at all — including the `q=0` form, which is an
  // explicit refusal rather than an omission. This is the ONLY 406.
  if (html === 0 && markdown === 0) return 'unacceptable';

  if (hasMarkdown && markdown > html) return 'markdown';

  // Markdown was preferred but this path has no Markdown representation. The
  // client gets HTML — RFC 9110 §15.5.7's "MAY send a response that is not
  // acceptable" branch — even if it wrote `text/html;q=0`.
  //
  // This is a deliberate choice against the stricter reading. A 406 here would
  // turn a page that works today into an error for the exact caller most likely
  // to ask for Markdown, and hand it nothing it can use; HTML it did not want is
  // still HTML it can parse. The strict reading is honoured where it costs the
  // caller nothing: a header that names neither type still gets its 406 above.
  return 'html';
}

/**
 * `true` for a Next.js internal navigation request (React Server Components
 * payload or a prefetch). These carry `Accept: text/x-component`, which names a
 * type we do not "offer" — negotiating them would 406 every client-side
 * navigation on the site. They are never document requests, so they are exempt.
 */
export function isInternalNextRequest(headers: Headers): boolean {
  return (
    headers.get('rsc') === '1' ||
    headers.get('next-router-prefetch') === '1' ||
    headers.has('next-router-state-tree') ||
    (headers.get('accept') ?? '').includes('text/x-component')
  );
}

/**
 * The `Vary` value a negotiated response should carry, given whatever `Vary` is
 * already on it.
 *
 * Appending rather than setting is load-bearing. Next puts its own tokens there
 * (`rsc`, `next-router-state-tree`, …) to keep RSC payloads and HTML apart in a
 * cache; overwriting them would break client-side navigation caching across the
 * whole site while fixing the Markdown variant. Returns the existing value
 * unchanged when `Accept` is already listed, so repeated passes cannot grow the
 * header.
 */
export function mergeVaryAccept(existing: string | null | undefined): string {
  if (!existing) return 'Accept';
  const alreadyVaries = existing
    .split(',')
    .some((token) => token.trim().toLowerCase() === 'accept');
  return alreadyVaries ? existing : `${existing}, Accept`;
}

/** The 406 body — JSON, because the client that gets one is not a browser. */
export function notAcceptableResponse(available: string[]): Response {
  return Response.json(
    {
      error: 'not_acceptable',
      message:
        'No representation matches the Accept header. This URL can be served as ' +
        available.join(' or ') + '.',
      available,
      documentation: 'https://cartwright.app/llms.txt',
    },
    {
      status: 406,
      headers: {
        Vary: 'Accept',
        'Cache-Control': 'no-store',
      },
    },
  );
}
