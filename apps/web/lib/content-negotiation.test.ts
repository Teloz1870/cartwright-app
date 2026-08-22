import { describe, expect, it } from 'vitest';
import {
  isInternalNextRequest,
  negotiate,
  notAcceptableResponse,
  parseAccept,
  qualityFor,
  MARKDOWN_CONTENT_TYPE,
} from './content-negotiation';

/**
 * The negotiation decision, pinned away from a server.
 *
 * Two properties matter more than the happy path, and both are regressions that
 * would look fine in a browser:
 *
 * 1. **A real browser must never get Markdown, and must never get a 406.** Every
 *    case below that starts from a genuine browser `Accept` string exists to
 *    prove that, because this proxy runs on every document request on the site.
 * 2. **`Vary: Accept` has to be on the response.** That one is asserted in
 *    `proxy.test.ts`; here we only pin what the decision function returns.
 */

// The exact headers three real clients send, so the assertions below are about
// reality rather than about a shape invented to pass.
const CHROME = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7';
const CURL = '*/*';
const RSC = 'text/x-component';

describe('parseAccept', () => {
  it('returns entries most-preferred first, q descending', () => {
    const entries = parseAccept('text/html;q=0.5, text/markdown;q=0.9, */*;q=0.1');
    expect(entries.map((e) => `${e.type}/${e.subtype}`)).toEqual([
      'text/markdown',
      'text/html',
      '*/*',
    ]);
  });

  it('keeps the client\'s own order when q values tie', () => {
    // RFC 9110 leaves ties to the server, but preserving the stated order is
    // the least surprising choice and makes the function deterministic.
    const entries = parseAccept('text/html, text/markdown');
    expect(entries.map((e) => e.subtype)).toEqual(['html', 'markdown']);
  });

  it('defaults a missing q to 1', () => {
    expect(parseAccept('text/markdown')[0].q).toBe(1);
  });

  it('ignores malformed q values rather than throwing', () => {
    // A header is proxy- and attacker-controlled. The safe failure is "I could
    // not read a preference", never a 500 on every page of the site.
    for (const header of [
      'text/markdown;q=banana',
      'text/markdown;q=',
      'text/markdown;q=-1',
      'text/markdown;q=17',
      'text/markdown;;;',
    ]) {
      const entries = parseAccept(header);
      expect(entries).toHaveLength(1);
      expect(entries[0].q).toBe(1);
    }
  });

  it('drops entries with no slash instead of treating them as a type', () => {
    expect(parseAccept('markdown, text/html').map((e) => e.subtype)).toEqual(['html']);
  });

  it('is empty for an absent or blank header', () => {
    expect(parseAccept(null)).toEqual([]);
    expect(parseAccept(undefined)).toEqual([]);
    expect(parseAccept('')).toEqual([]);
  });

  it('lower-cases the media type so casing cannot change the outcome', () => {
    const [entry] = parseAccept('TEXT/MarkDown');
    expect(`${entry.type}/${entry.subtype}`).toBe('text/markdown');
  });
});

describe('qualityFor — specificity order', () => {
  it('prefers an exact match over type/* over */*', () => {
    const entries = parseAccept('*/*;q=0.1, text/*;q=0.5, text/markdown;q=0.9');
    expect(qualityFor(entries, 'text/markdown')).toBe(0.9);
    // text/html has no exact entry, so it falls to `text/*`.
    expect(qualityFor(entries, 'text/html')).toBe(0.5);
    // application/json has neither, so it falls to `*/*`.
    expect(qualityFor(entries, 'application/json')).toBe(0.1);
  });

  it('is 0 for a type the header does not cover at all', () => {
    expect(qualityFor(parseAccept('text/html'), 'text/markdown')).toBe(0);
  });

  it('honours an explicit q=0 as a refusal, not an omission', () => {
    expect(qualityFor(parseAccept('*/*, text/html;q=0'), 'text/html')).toBe(0);
  });
});

describe('negotiate', () => {
  it('serves HTML to a real browser, on a page that HAS a markdown variant', () => {
    // The single most important case in this file: Chrome names text/html at
    // q=1 and never mentions markdown, so the homepage must stay HTML.
    expect(negotiate(CHROME, { hasMarkdown: true })).toBe('html');
  });

  it('serves HTML to curl and to a client sending no header', () => {
    expect(negotiate(CURL, { hasMarkdown: true })).toBe('html');
    expect(negotiate(null, { hasMarkdown: true })).toBe('html');
    expect(negotiate('', { hasMarkdown: true })).toBe('html');
  });

  it('serves Markdown when it is asked for outright', () => {
    expect(negotiate('text/markdown', { hasMarkdown: true })).toBe('markdown');
  });

  it('follows q-values rather than the presence of the token', () => {
    // This is the case the previous token-search implementation got wrong: the
    // string contains "text/markdown", but the client says it prefers HTML.
    expect(
      negotiate('text/markdown;q=0.1, text/html;q=0.9', { hasMarkdown: true }),
    ).toBe('html');
    expect(
      negotiate('text/markdown;q=0.9, text/html;q=0.1', { hasMarkdown: true }),
    ).toBe('markdown');
  });

  it('treats an equal preference as HTML — the established representation wins a tie', () => {
    expect(
      negotiate('text/html;q=0.8, text/markdown;q=0.8', { hasMarkdown: true }),
    ).toBe('html');
  });

  it('serves HTML for a markdown-preferring client on a page with NO markdown variant', () => {
    // RFC 9110 §15.5.7's "serve it anyway" branch. A /pricing request asking for
    // markdown gets HTML it can still parse, rather than an empty 406.
    expect(negotiate('text/markdown', { hasMarkdown: false })).toBe('html');
  });

  it('406s only when nothing we can produce is acceptable', () => {
    expect(negotiate('application/xml', { hasMarkdown: true })).toBe('unacceptable');
    expect(negotiate('image/png', { hasMarkdown: false })).toBe('unacceptable');
  });

  it('serves HTML even to a client that wrote text/html;q=0, when that is all we have', () => {
    // The deliberate soft branch. A strict reading would 406 here — the client
    // refused HTML and we have no markdown for this path — but that hands the
    // caller nothing, and HTML it did not ask for is still HTML it can parse.
    expect(
      negotiate('text/markdown, text/html;q=0', { hasMarkdown: false }),
    ).toBe('html');
    // …while the same header on a path that DOES have markdown is honoured.
    expect(
      negotiate('text/markdown, text/html;q=0', { hasMarkdown: true }),
    ).toBe('markdown');
  });

  it('406 is reserved for headers naming NEITHER type — the one case with no answer', () => {
    // Pins the boundary from both sides, so a future "let us be stricter" edit
    // has to change a test that says why it is loose.
    expect(negotiate('application/xml', { hasMarkdown: true })).toBe('unacceptable');
    expect(negotiate('application/xml, text/markdown', { hasMarkdown: true })).toBe(
      'markdown',
    );
    expect(negotiate('application/xml, text/html', { hasMarkdown: true })).toBe('html');
  });

  it('never 406s a client that sent a wildcard, whatever else it asked for', () => {
    // The property that keeps this safe to run site-wide: every browser, every
    // crawler and every curl default includes a wildcard.
    for (const header of [CHROME, CURL, 'application/xml, */*;q=0.01', 'text/*']) {
      expect(negotiate(header, { hasMarkdown: false })).not.toBe('unacceptable');
      expect(negotiate(header, { hasMarkdown: true })).not.toBe('unacceptable');
    }
  });
});

describe('isInternalNextRequest', () => {
  it('recognises an RSC payload request by header and by Accept', () => {
    expect(isInternalNextRequest(new Headers({ rsc: '1' }))).toBe(true);
    expect(isInternalNextRequest(new Headers({ accept: RSC }))).toBe(true);
    expect(
      isInternalNextRequest(new Headers({ 'next-router-prefetch': '1' })),
    ).toBe(true);
    expect(
      isInternalNextRequest(new Headers({ 'next-router-state-tree': '%5B%22%22%5D' })),
    ).toBe(true);
  });

  it('does not mistake an ordinary document request for an internal one', () => {
    expect(isInternalNextRequest(new Headers({ accept: CHROME }))).toBe(false);
    expect(isInternalNextRequest(new Headers())).toBe(false);
  });

  it('matters because an RSC request would otherwise 406', () => {
    // text/x-component names no type we offer and carries no wildcard, so
    // without the exemption every client-side navigation on the site would fail.
    expect(negotiate(RSC, { hasMarkdown: true })).toBe('unacceptable');
    expect(isInternalNextRequest(new Headers({ accept: RSC }))).toBe(true);
  });
});

describe('notAcceptableResponse', () => {
  it('is a 406 that says what it could have sent, and varies on Accept', async () => {
    const res = notAcceptableResponse(['text/html', 'text/markdown']);
    expect(res.status).toBe(406);
    expect(res.headers.get('vary')).toBe('Accept');
    expect(res.headers.get('cache-control')).toBe('no-store');

    const body = await res.json();
    expect(body.error).toBe('not_acceptable');
    expect(body.available).toEqual(['text/html', 'text/markdown']);
    // A 406 with no way forward is a dead end; the caller gets the index.
    expect(body.documentation).toContain('/llms.txt');
  });

  it('is JSON, because the only client that can reach it is not a browser', () => {
    expect(notAcceptableResponse(['text/html']).headers.get('content-type')).toContain(
      'application/json',
    );
  });
});

describe('MARKDOWN_CONTENT_TYPE', () => {
  it('states the charset acceptmarkdown.com specifies', () => {
    // The previous value was a bare `text/markdown`. Docs pages contain
    // em-dashes and typographic quotes, which mojibake when a client falls back
    // to a single-byte default.
    expect(MARKDOWN_CONTENT_TYPE).toBe('text/markdown; charset=utf-8');
  });
});
