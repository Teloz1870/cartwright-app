/**
 * POST /api/v1/license/verify
 *
 * Online verification for a Cartwright Plus access key (public concept:
 * "Plus access key"; the URL keeps `license` for stability). Self-hosted
 * shops call this to learn the live membership status behind an
 * offline-valid key.
 *
 * Request:  { "key": "cw_plus_v1.<payload>.<signature>" }
 * Response: { "status": "active" | "grace" | "inactive", "plan": "plus" }
 *           — deliberately NO PII (no customer id, no email, no sub id).
 *
 * Status codes:
 * - 400 invalid request shape
 * - 401 bad signature / malformed key
 * - 503 verification unavailable (signing key or Stripe not configured, or
 *       Stripe unreachable) — callers treat this as "offline" and apply
 *       their local grace policy; it is NOT a revocation.
 *
 * Rate-limit friendly: no DB, no session — one signature check (cheap,
 * offline-first so garbage keys never reach Stripe) + one Stripe read.
 */

import {
  getPlusPublicKeyring,
  verifyPlusTokenWithKeyring,
} from '@/lib/plus-token';
import { getSubscriptionPlusStatus } from '@/lib/plus-entitlement';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  let body: { key?: unknown };
  try {
    body = (await request.json()) as { key?: unknown };
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const key = typeof body.key === 'string' ? body.key.trim() : '';
  if (!key || key.length > 4096) {
    return Response.json({ error: 'invalid_key_shape' }, { status: 400 });
  }

  // Offline check first — signature math is far cheaper than a Stripe call.
  // The keyring maps kid → public key (current signing key + any retired
  // keys from CARTWRIGHT_PLUS_PUBLIC_KEYS), so key rotation never 401s
  // previously issued access keys.
  let keyring: ReturnType<typeof getPlusPublicKeyring>;
  try {
    keyring = getPlusPublicKeyring();
  } catch (err) {
    // Misconfigured CARTWRIGHT_PLUS_PUBLIC_KEYS must not 401 paying members
    // — surface as unavailable so callers apply their offline grace.
    console.error(
      '[license-verify] Keyring configuration error:',
      err instanceof Error ? err.message : String(err),
    );
    return Response.json(
      { error: 'verification_unavailable' },
      { status: 503 },
    );
  }
  if (Object.keys(keyring).length === 0) {
    console.warn(
      '[license-verify] No verification keys configured (neither ' +
        'CARTWRIGHT_PLUS_SIGNING_PRIVATE_KEY nor CARTWRIGHT_PLUS_PUBLIC_KEYS) ' +
        '— cannot verify keys on this deployment.',
    );
    return Response.json(
      { error: 'verification_unavailable' },
      { status: 503 },
    );
  }

  const verified = verifyPlusTokenWithKeyring(key, keyring);
  if (!verified.ok) {
    // 'unknown_kid' lands here too: a kid outside the ring is unauthorized
    // (and if it was a legitimate retired kid, the fix is adding its public
    // key to CARTWRIGHT_PLUS_PUBLIC_KEYS — see lib/plus-token.ts).
    return Response.json({ error: 'invalid_key' }, { status: 401 });
  }

  // Live entitlement: ask Stripe. Stripe IS the entitlement store.
  const status = await getSubscriptionPlusStatus(verified.payload.subscription);
  if (status === null) {
    // Stripe not configured or unreachable — the caller falls back to its
    // offline grace window rather than treating this as a revocation.
    return Response.json(
      { error: 'verification_unavailable' },
      { status: 503 },
    );
  }

  return Response.json({ status, plan: 'plus' });
}
