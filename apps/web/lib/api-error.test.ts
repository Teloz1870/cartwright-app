import { describe, expect, it } from 'vitest';
import { apiError } from './api-error';
import { GET, POST, OPTIONS, HEAD } from '../app/api/[...unknown]/route';

/**
 * The JSON error envelope, and the catch-all that produces the one an agent is
 * most likely to hit first.
 *
 * The finding was "API does not return JSON error responses". The literal case
 * was `/api/<typo>` falling through to the app's HTML 404 — a page of React
 * markup handed to a caller that had just identified itself as an API client by
 * the URL it chose.
 */

const req = (url: string) => new Request(`https://cartwright.app${url}`);

describe('apiError', () => {
  it('carries a code, a message, a hint and a documentation URL', async () => {
    const body = await apiError({
      status: 400,
      code: 'invalid_tier',
      message: 'Tier must be one of: plus, cloud.',
      hint: 'Set `tier` to "plus" or "cloud" and retry.',
    }).json();

    expect(body).toEqual({
      error: 'invalid_tier',
      message: 'Tier must be one of: plus, cloud.',
      hint: 'Set `tier` to "plus" or "cloud" and retry.',
      documentation: 'https://cartwright.app/openapi.json',
    });
  });

  it('omits `hint` rather than emitting an empty one', () => {
    // A field that is sometimes an empty string is worse than an absent field:
    // a caller cannot tell "no advice" from "advice failed to render".
    return apiError({ status: 503, code: 'x', message: 'y' })
      .json()
      .then((body) => expect('hint' in body).toBe(false));
  });

  it('is never cached — an error is about this request, not this URL', () => {
    const res = apiError({ status: 500, code: 'x', message: 'y' });
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('content-type')).toContain('application/json');
  });

  it('keeps the caller-supplied status', () => {
    expect(apiError({ status: 418, code: 'x', message: 'y' }).status).toBe(418);
  });

  it('lets a caller add headers without losing no-store', () => {
    const res = apiError({
      status: 429,
      code: 'rate_limited',
      message: 'Too many requests.',
      headers: { 'Retry-After': '60' },
    });
    expect(res.headers.get('retry-after')).toBe('60');
    expect(res.headers.get('cache-control')).toBe('no-store');
  });
});

describe('the /api catch-all', () => {
  it('answers JSON, not HTML, for an unknown endpoint', async () => {
    const res = await GET(req('/api/does-not-exist'));

    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(res.headers.get('content-type')).not.toContain('text/html');
  });

  it('names the path it missed and points at the spec', async () => {
    const body = await (await GET(req('/api/desings/likes'))).json();

    expect(body.error).toBe('unknown_endpoint');
    // The typo'd path is echoed so a caller can see WHAT was not found — this
    // is the difference between "wrong path" and "the service is down".
    expect(body.message).toContain('/api/desings/likes');
    expect(body.hint).toContain('/openapi.json');
  });

  it('answers on every verb, because Next would answer the unexported ones itself', async () => {
    // Without an explicit export Next installs its own handler for the method,
    // which runs outside this file and hands back the HTML page again — for
    // exactly the callers most likely to probe with OPTIONS or HEAD.
    for (const handler of [GET, POST, OPTIONS, HEAD]) {
      const res = await handler(req('/api/nope'));
      expect(res.status).toBe(404);
      expect(res.headers.get('content-type')).toContain('application/json');
    }
  });

  it('does not cache a 404 that a future deploy may turn into a real route', async () => {
    expect((await GET(req('/api/nope'))).headers.get('cache-control')).toBe('no-store');
  });
});
