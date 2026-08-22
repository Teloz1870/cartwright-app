import { OPENAPI_DOCUMENT } from '@/lib/openapi';

/**
 * `GET /openapi.json` — the canonical, predictable location.
 *
 * Served at the origin root rather than under `/api` because that is where a
 * tool looks first, and because the document describes more than `/api`: the
 * discovery files (`/llms.txt`, `/static.json`, this file) are part of the
 * surface an agent uses.
 *
 * Cached hard. The document is a constant — it changes only when the code does,
 * and a deploy invalidates it.
 */

export const revalidate = false;

export function GET(): Response {
  return Response.json(OPENAPI_DOCUMENT, {
    headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
      // `application/json`, not the registered `application/openapi+json`. The
      // specific type is more correct on paper and less useful in practice: the
      // clients that fetch this are generic HTTP tools that branch on
      // `application/json`, and one of them refusing to parse the document is a
      // worse outcome than an imprecise media type.
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}
