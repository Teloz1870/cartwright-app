import { apiError } from '@/lib/api-error';

/**
 * The JSON 404 for anything under `/api` that no real route claims.
 *
 * Before this existed, `GET /api/does-not-exist` fell through to the app's HTML
 * 404 — `text/html`, a full page of React markup, for a caller that had just
 * declared itself an API client by the URL it chose. An agent probing the API
 * surface got back something it could not parse and no way to tell "wrong path"
 * apart from "the whole service is down".
 *
 * A catch-all only matches when nothing more specific does — Next resolves
 * static and dynamic segments ahead of `[...unknown]` — so every real endpoint
 * still answers itself. This file is reachable *only* on a genuine miss, which
 * is what makes the 404 it returns trustworthy rather than a guess.
 *
 * Every method is exported deliberately. Without an explicit export Next
 * installs its own handler for the verb, which would answer outside this file
 * and hand back the HTML page again for exactly the callers most likely to probe
 * with `OPTIONS` or `HEAD`.
 */

export const dynamic = 'force-dynamic';

async function miss(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url);
  return apiError({
    status: 404,
    code: 'unknown_endpoint',
    message: `No API endpoint exists at ${pathname}.`,
    hint: 'Fetch /openapi.json for the full list of endpoints, their parameters and response schemas.',
  });
}

export const GET = miss;
export const POST = miss;
export const PUT = miss;
export const PATCH = miss;
export const DELETE = miss;
export const HEAD = miss;
export const OPTIONS = miss;
