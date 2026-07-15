/**
 * Cartwright Plus access key ("Plus access key") — construction and offline
 * verification.
 *
 * Format:
 *
 *     cw_plus_v1.<base64url-payload>.<base64url-ed25519-signature>
 *
 * The payload is deterministic JSON with a fixed field order:
 *
 *     { "v": 1, "plan": "plus", "customer": "cus_...",
 *       "subscription": "sub_...", "issuedAt": 1784050000, "kid": "2026-01" }
 *
 * The Ed25519 signature covers the UTF-8 bytes of the string
 * `cw_plus_v1.<base64url-payload>` — the prefix is signed too, so a payload
 * cannot be replayed under a different key-format version.
 *
 * Why Ed25519 (node:crypto, no JWT dependency):
 * - the private signing key exists only on cartwright.app;
 * - the public key can ship safely inside every MIT fork;
 * - a self-hosted shop can authenticate a key fully offline;
 * - online verification can still ask Stripe about the subscription.
 *
 * Env vars (see .env.example):
 *
 * `CARTWRIGHT_PLUS_SIGNING_PRIVATE_KEY` — the Ed25519 private key, in ONE of:
 *   1. PEM (PKCS#8), i.e. the literal `-----BEGIN PRIVATE KEY-----...` block
 *      (newlines may be encoded as `\n`);
 *   2. base64 of that PEM text; or
 *   3. base64 of the raw PKCS#8 DER bytes.
 *   Generate one with:
 *     node -e "const{generateKeyPairSync}=require('crypto');
 *       console.log(generateKeyPairSync('ed25519').privateKey
 *         .export({type:'pkcs8',format:'der'}).toString('base64'))"
 *
 * `CARTWRIGHT_PLUS_SIGNING_KEY_ID` — the `kid` stamped into new keys
 *   (e.g. `2026-01`); rotate it together with the keypair.
 *
 * This is NOT DRM. The key proves Plus membership (support, guidance,
 * artifacts). Verification failure never shuts down a customer's site.
 */

import {
  createPrivateKey,
  createPublicKey,
  sign as edSign,
  verify as edVerify,
  type KeyObject,
} from 'node:crypto';

export const PLUS_TOKEN_PREFIX = 'cw_plus_v1';

export type PlusTokenPayload = {
  v: 1;
  plan: 'plus';
  /** Stripe customer id (cus_...). */
  customer: string;
  /** Stripe subscription id (sub_...). */
  subscription: string;
  /** Unix seconds when the key was issued. */
  issuedAt: number;
  /** Signing key id — lets us rotate keypairs without breaking old keys. */
  kid: string;
};

export type PlusTokenVerification =
  | {
      ok: true;
      payload: PlusTokenPayload;
      /**
       * Set when the caller passed `expectedKid` and the token was signed
       * under a different key id. The signature itself is valid (it verified
       * against the provided public key) — the mismatch is informational,
       * e.g. "this key predates the current rotation".
       */
      kidMismatch?: boolean;
    }
  | {
      ok: false;
      reason: 'format' | 'payload' | 'signature';
    };

/** Deterministic payload construction — fixed field order, no extras. */
export function buildPlusTokenPayload(input: {
  customer: string;
  subscription: string;
  issuedAt?: number;
  kid: string;
}): PlusTokenPayload {
  return {
    v: 1,
    plan: 'plus',
    customer: input.customer,
    subscription: input.subscription,
    issuedAt: input.issuedAt ?? Math.floor(Date.now() / 1000),
    kid: input.kid,
  };
}

function encodePayload(payload: PlusTokenPayload): string {
  // JSON.stringify preserves insertion order for string keys, and
  // buildPlusTokenPayload fixes that order — so encoding is deterministic.
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

function signedMessage(payloadB64: string): Buffer {
  return Buffer.from(`${PLUS_TOKEN_PREFIX}.${payloadB64}`, 'utf8');
}

/** Sign a payload into a full `cw_plus_v1.<payload>.<sig>` access key. */
export function signPlusToken(
  payload: PlusTokenPayload,
  privateKey: KeyObject,
): string {
  const payloadB64 = encodePayload(payload);
  const signature = edSign(null, signedMessage(payloadB64), privateKey);
  return `${PLUS_TOKEN_PREFIX}.${payloadB64}.${signature.toString('base64url')}`;
}

function isPlusTokenPayload(value: unknown): value is PlusTokenPayload {
  if (typeof value !== 'object' || value === null) return false;
  const p = value as Record<string, unknown>;
  return (
    p.v === 1 &&
    p.plan === 'plus' &&
    typeof p.customer === 'string' &&
    p.customer.length > 0 &&
    typeof p.subscription === 'string' &&
    p.subscription.length > 0 &&
    typeof p.issuedAt === 'number' &&
    Number.isFinite(p.issuedAt) &&
    typeof p.kid === 'string' &&
    p.kid.length > 0
  );
}

/**
 * Offline verification: shape → payload → Ed25519 signature. No network,
 * no Stripe. Pass `expectedKid` to get a `kidMismatch` note on keys signed
 * under an older rotation.
 */
export function verifyPlusToken(
  token: string,
  publicKey: KeyObject,
  opts?: { expectedKid?: string },
): PlusTokenVerification {
  if (typeof token !== 'string') return { ok: false, reason: 'format' };
  const parts = token.trim().split('.');
  if (parts.length !== 3 || parts[0] !== PLUS_TOKEN_PREFIX) {
    return { ok: false, reason: 'format' };
  }
  const [, payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return { ok: false, reason: 'format' };

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch {
    return { ok: false, reason: 'payload' };
  }
  if (!isPlusTokenPayload(payload)) return { ok: false, reason: 'payload' };

  let valid = false;
  try {
    valid = edVerify(
      null,
      signedMessage(payloadB64),
      publicKey,
      Buffer.from(sigB64, 'base64url'),
    );
  } catch {
    valid = false;
  }
  if (!valid) return { ok: false, reason: 'signature' };

  const kidMismatch =
    opts?.expectedKid !== undefined && payload.kid !== opts.expectedKid;
  return kidMismatch
    ? { ok: true, payload, kidMismatch: true }
    : { ok: true, payload };
}

// ---------------------------------------------------------------------------
// Env-backed helpers (cartwright.app side)
// ---------------------------------------------------------------------------

/**
 * Parse CARTWRIGHT_PLUS_SIGNING_PRIVATE_KEY (PEM, base64-PEM, or base64
 * PKCS#8 DER — see file header). Returns null when unset so callers can
 * degrade gracefully; throws only on a present-but-unparseable value.
 */
export function getPlusSigningPrivateKey(): KeyObject | null {
  const raw = process.env.CARTWRIGHT_PLUS_SIGNING_PRIVATE_KEY?.trim();
  if (!raw) return null;
  try {
    if (raw.includes('-----BEGIN')) {
      return createPrivateKey(raw.replace(/\\n/g, '\n'));
    }
    const decoded = Buffer.from(raw, 'base64');
    const asText = decoded.toString('utf8');
    if (asText.includes('-----BEGIN')) {
      return createPrivateKey(asText);
    }
    return createPrivateKey({ key: decoded, format: 'der', type: 'pkcs8' });
  } catch (err) {
    throw new Error(
      'CARTWRIGHT_PLUS_SIGNING_PRIVATE_KEY is set but could not be parsed. ' +
        'Expected PEM (PKCS#8), base64 of the PEM, or base64 of the PKCS#8 ' +
        `DER bytes. Underlying error: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

/** The public half of the signing key (derived), or null when unconfigured. */
export function getPlusPublicKey(): KeyObject | null {
  const priv = getPlusSigningPrivateKey();
  return priv ? createPublicKey(priv) : null;
}

/** The key id stamped into newly issued keys. */
export function getPlusSigningKid(): string {
  return process.env.CARTWRIGHT_PLUS_SIGNING_KEY_ID?.trim() || 'dev';
}

/** True when key issuance/verification is configured on this deployment. */
export function isPlusSigningConfigured(): boolean {
  return Boolean(process.env.CARTWRIGHT_PLUS_SIGNING_PRIVATE_KEY?.trim());
}

/**
 * Issue a Plus access key for a verified purchase. Returns null when the
 * signing key is not configured (callers surface a friendly message instead
 * of crashing — the purchase itself is never lost; support can reissue).
 */
export function issuePlusKey(input: {
  customer: string;
  subscription: string;
  issuedAt?: number;
}): string | null {
  const privateKey = getPlusSigningPrivateKey();
  if (!privateKey) return null;
  const payload = buildPlusTokenPayload({
    customer: input.customer,
    subscription: input.subscription,
    issuedAt: input.issuedAt,
    kid: getPlusSigningKid(),
  });
  return signPlusToken(payload, privateKey);
}
