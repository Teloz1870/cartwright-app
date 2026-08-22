import { SITE_URL } from './agent-resources';

/**
 * One shape for every JSON error this API returns.
 *
 * The audit finding behind this was "agents can't parse HTML error pages", and
 * the literal HTML case is fixed by `app/api/[...unknown]/route.ts`. This is the
 * other half: the endpoints that *did* return JSON returned a bare machine code
 * — `{"error":"invalid_tier"}` — with nothing a caller could act on. A code tells
 * an agent that something is wrong; it does not tell it what to do differently,
 * and guessing at the fix is exactly the loop an agent gets stuck in.
 *
 * So the envelope carries three things, and the third is the one that matters:
 *
 *   { error: "invalid_tier",              // stable code — safe to branch on
 *     message: "…",                       // one sentence, human- and model-readable
 *     hint: "…",                          // what to change and try again
 *     documentation: "…" }                // where the contract is written down
 *
 * **`error` keeps its existing values.** Every code already returned stays
 * byte-identical, because `create-cartwright` and the Plus client branch on
 * them; `message`, `hint` and `documentation` are additive fields an older
 * consumer ignores. That is the whole reason this is a helper rather than a
 * rewrite of each route.
 */

export type ApiErrorInit = {
  status: number;
  /** Stable, lowercase, snake_case. Callers branch on this; never reword it. */
  code: string;
  /** One sentence stating what went wrong, in plain language. */
  message: string;
  /** What the caller should change. Omit when there is genuinely nothing to do. */
  hint?: string;
  /** Extra response headers (rate-limit, cache-control, …). */
  headers?: Record<string, string>;
};

export function apiError({
  status,
  code,
  message,
  hint,
  headers,
}: ApiErrorInit): Response {
  return Response.json(
    {
      error: code,
      message,
      ...(hint ? { hint } : {}),
      documentation: `${SITE_URL}/openapi.json`,
    },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
        ...headers,
      },
    },
  );
}
