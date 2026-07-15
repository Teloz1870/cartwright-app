/**
 * Unit tests for the Plus access key (lib/plus-token.ts) and the pure
 * entitlement logic (lib/plus-entitlement.ts).
 *
 * The Ed25519 keypair used here is THROWAWAY — generated fresh per test run,
 * never persisted, never a real production key.
 */

import { generateKeyPairSync } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  PLUS_TOKEN_PREFIX,
  buildPlusTokenPayload,
  getPlusPublicKey,
  getPlusPublicKeyring,
  getPlusSigningPrivateKey,
  isPlusSigningConfigured,
  issuePlusKey,
  signPlusToken,
  verifyPlusToken,
  verifyPlusTokenWithKeyring,
} from './plus-token';
import {
  mapSubscriptionStatus,
  validateSessionForPlus,
  type SessionForValidation,
} from './plus-entitlement';
import { getStripe, isStripeConfigured } from './stripe';

// Fresh throwaway keypair for every run.
const { privateKey, publicKey } = generateKeyPairSync('ed25519');
const { publicKey: wrongPublicKey } = generateKeyPairSync('ed25519');

const basePayload = buildPlusTokenPayload({
  customer: 'cus_test123',
  subscription: 'sub_test456',
  issuedAt: 1784050000,
  kid: '2026-01',
});

describe('plus token sign/verify', () => {
  it('roundtrips: sign → verify returns the exact payload', () => {
    const token = signPlusToken(basePayload, privateKey);
    expect(token.startsWith(`${PLUS_TOKEN_PREFIX}.`)).toBe(true);
    expect(token.split('.')).toHaveLength(3);

    const result = verifyPlusToken(token, publicKey);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload).toEqual(basePayload);
      expect(result.kidMismatch).toBeUndefined();
    }
  });

  it('is deterministic for identical payloads', () => {
    const a = signPlusToken(basePayload, privateKey);
    const b = signPlusToken({ ...basePayload }, privateKey);
    expect(a).toBe(b);
  });

  it('rejects a tampered payload', () => {
    const token = signPlusToken(basePayload, privateKey);
    const [prefix, payloadB64, sig] = token.split('.');
    const tampered = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8'),
    ) as typeof basePayload;
    tampered.subscription = 'sub_someone_else';
    const tamperedB64 = Buffer.from(JSON.stringify(tampered), 'utf8').toString(
      'base64url',
    );

    const result = verifyPlusToken(`${prefix}.${tamperedB64}.${sig}`, publicKey);
    expect(result).toEqual({ ok: false, reason: 'signature' });
  });

  it('rejects a signature from the wrong keypair', () => {
    const token = signPlusToken(basePayload, privateKey);
    const result = verifyPlusToken(token, wrongPublicKey);
    expect(result).toEqual({ ok: false, reason: 'signature' });
  });

  it('rejects malformed tokens with reason=format', () => {
    for (const bad of [
      '',
      'nonsense',
      'cw_plus_v1.onlyonepart',
      'cw_plus_v2.a.b', // wrong version prefix
      'cw_plus_v1.a.b.c', // too many segments
    ]) {
      expect(verifyPlusToken(bad, publicKey)).toEqual({
        ok: false,
        reason: 'format',
      });
    }
  });

  it('rejects a structurally invalid payload with reason=payload', () => {
    const badPayload = Buffer.from(
      JSON.stringify({ v: 2, plan: 'gold' }),
      'utf8',
    ).toString('base64url');
    const result = verifyPlusToken(
      `${PLUS_TOKEN_PREFIX}.${badPayload}.AAAA`,
      publicKey,
    );
    expect(result).toEqual({ ok: false, reason: 'payload' });
  });

  it('notes (but does not reject) a wrong kid when expectedKid is passed', () => {
    const token = signPlusToken(basePayload, privateKey);

    const mismatch = verifyPlusToken(token, publicKey, {
      expectedKid: '2027-01',
    });
    expect(mismatch.ok).toBe(true);
    if (mismatch.ok) expect(mismatch.kidMismatch).toBe(true);

    const match = verifyPlusToken(token, publicKey, { expectedKid: '2026-01' });
    expect(match.ok).toBe(true);
    if (match.ok) expect(match.kidMismatch).toBeUndefined();
  });
});

describe('env-backed key parsing (throwaway keys only)', () => {
  const ENV_VARS = [
    'CARTWRIGHT_PLUS_SIGNING_PRIVATE_KEY',
    'CARTWRIGHT_PLUS_SIGNING_KEY_ID',
  ] as const;
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const name of ENV_VARS) {
      saved[name] = process.env[name];
      delete process.env[name];
    }
  });
  afterEach(() => {
    for (const name of ENV_VARS) {
      if (saved[name] === undefined) delete process.env[name];
      else process.env[name] = saved[name];
    }
  });

  it('returns null / not-configured when the env var is unset', () => {
    expect(getPlusSigningPrivateKey()).toBeNull();
    expect(getPlusPublicKey()).toBeNull();
    expect(isPlusSigningConfigured()).toBe(false);
    expect(
      issuePlusKey({ customer: 'cus_x', subscription: 'sub_x' }),
    ).toBeNull();
  });

  it('parses base64 PKCS#8 DER and issues verifiable keys', () => {
    process.env.CARTWRIGHT_PLUS_SIGNING_PRIVATE_KEY = privateKey
      .export({ type: 'pkcs8', format: 'der' })
      .toString('base64');
    process.env.CARTWRIGHT_PLUS_SIGNING_KEY_ID = '2026-01';

    const key = issuePlusKey({
      customer: 'cus_env',
      subscription: 'sub_env',
      issuedAt: 1784050000,
    });
    expect(key).toBeTruthy();
    const result = verifyPlusToken(key!, publicKey);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.customer).toBe('cus_env');
      expect(result.payload.kid).toBe('2026-01');
    }
  });

  it('parses PEM (including \\n-escaped) private keys', () => {
    const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
    for (const variant of [pem, pem.replace(/\n/g, '\\n')]) {
      process.env.CARTWRIGHT_PLUS_SIGNING_PRIVATE_KEY = variant;
      expect(getPlusSigningPrivateKey()).not.toBeNull();
    }
    // base64 of the PEM text also works
    process.env.CARTWRIGHT_PLUS_SIGNING_PRIVATE_KEY = Buffer.from(
      pem,
      'utf8',
    ).toString('base64');
    expect(getPlusSigningPrivateKey()).not.toBeNull();
  });

  it('throws a clear error on a present-but-garbage key', () => {
    process.env.CARTWRIGHT_PLUS_SIGNING_PRIVATE_KEY = 'not-a-key!!';
    expect(() => getPlusSigningPrivateKey()).toThrow(
      /CARTWRIGHT_PLUS_SIGNING_PRIVATE_KEY/,
    );
  });
});

describe('keyring verification + rotation (throwaway keys only)', () => {
  const ENV_VARS = [
    'CARTWRIGHT_PLUS_SIGNING_PRIVATE_KEY',
    'CARTWRIGHT_PLUS_SIGNING_KEY_ID',
    'CARTWRIGHT_PLUS_PUBLIC_KEYS',
  ] as const;
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const name of ENV_VARS) {
      saved[name] = process.env[name];
      delete process.env[name];
    }
  });
  afterEach(() => {
    for (const name of ENV_VARS) {
      if (saved[name] === undefined) delete process.env[name];
      else process.env[name] = saved[name];
    }
  });

  // A second throwaway pair, playing the RETIRED key in rotation scenarios.
  const { privateKey: oldPrivateKey, publicKey: oldPublicKey } =
    generateKeyPairSync('ed25519');
  const oldPayload = buildPlusTokenPayload({
    customer: 'cus_early',
    subscription: 'sub_early',
    issuedAt: 1700000000,
    kid: '2025-07',
  });

  it('verifies via the keyring, selecting the key by the token kid', () => {
    const token = signPlusToken(basePayload, privateKey);
    const result = verifyPlusTokenWithKeyring(token, {
      '2026-01': publicKey,
      '2025-07': oldPublicKey,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.payload).toEqual(basePayload);
  });

  it('rejects an unknown kid (never tries other keys)', () => {
    const token = signPlusToken(basePayload, privateKey); // kid 2026-01
    expect(
      verifyPlusTokenWithKeyring(token, { '2025-07': oldPublicKey }),
    ).toEqual({ ok: false, reason: 'unknown_kid' });
  });

  it("rejects a signature that fails against its own kid's key", () => {
    // Signed with the OLD private key but claiming the CURRENT kid.
    const forged = signPlusToken(basePayload, oldPrivateKey);
    expect(
      verifyPlusTokenWithKeyring(forged, {
        '2026-01': publicKey,
        '2025-07': oldPublicKey,
      }),
    ).toEqual({ ok: false, reason: 'signature' });
  });

  it('ROTATION: keys issued under a retired kid keep verifying via CARTWRIGHT_PLUS_PUBLIC_KEYS', () => {
    // Deployment state AFTER rotation: new private key signs, old public
    // key parked in the env map.
    process.env.CARTWRIGHT_PLUS_SIGNING_PRIVATE_KEY = privateKey
      .export({ type: 'pkcs8', format: 'der' })
      .toString('base64');
    process.env.CARTWRIGHT_PLUS_SIGNING_KEY_ID = '2026-01';
    process.env.CARTWRIGHT_PLUS_PUBLIC_KEYS = JSON.stringify({
      '2025-07': oldPublicKey
        .export({ type: 'spki', format: 'der' })
        .toString('base64'),
    });

    const ring = getPlusPublicKeyring();
    expect(Object.keys(ring).sort()).toEqual(['2025-07', '2026-01']);

    // A key issued BEFORE the rotation still verifies...
    const oldToken = signPlusToken(oldPayload, oldPrivateKey);
    const oldResult = verifyPlusTokenWithKeyring(oldToken, ring);
    expect(oldResult.ok).toBe(true);

    // ...and so does a freshly issued one.
    const newToken = issuePlusKey({
      customer: 'cus_new',
      subscription: 'sub_new',
    });
    expect(newToken).toBeTruthy();
    expect(verifyPlusTokenWithKeyring(newToken!, ring).ok).toBe(true);
  });

  it('accepts PEM public keys in the map and works without a private key', () => {
    process.env.CARTWRIGHT_PLUS_PUBLIC_KEYS = JSON.stringify({
      '2025-07': oldPublicKey.export({ type: 'spki', format: 'pem' }),
    });
    const ring = getPlusPublicKeyring();
    expect(Object.keys(ring)).toEqual(['2025-07']);
    const token = signPlusToken(oldPayload, oldPrivateKey);
    expect(verifyPlusTokenWithKeyring(token, ring).ok).toBe(true);
  });

  it('returns an empty ring when nothing is configured', () => {
    expect(getPlusPublicKeyring()).toEqual({});
  });

  it('throws clear errors on malformed CARTWRIGHT_PLUS_PUBLIC_KEYS', () => {
    process.env.CARTWRIGHT_PLUS_PUBLIC_KEYS = 'not json';
    expect(() => getPlusPublicKeyring()).toThrow(
      /CARTWRIGHT_PLUS_PUBLIC_KEYS/,
    );

    process.env.CARTWRIGHT_PLUS_PUBLIC_KEYS = '["array"]';
    expect(() => getPlusPublicKeyring()).toThrow(/JSON object/);

    process.env.CARTWRIGHT_PLUS_PUBLIC_KEYS = JSON.stringify({
      '2025-07': 'garbage-not-a-key',
    });
    expect(() => getPlusPublicKeyring()).toThrow(/could not be parsed/);
  });
});

describe('subscription status mapping', () => {
  it.each([
    ['active', 'active'],
    ['trialing', 'active'],
    ['past_due', 'grace'],
    ['canceled', 'inactive'],
    ['unpaid', 'inactive'],
    ['incomplete', 'inactive'],
    ['incomplete_expired', 'inactive'],
    ['paused', 'inactive'],
    ['anything-unknown', 'inactive'],
  ] as const)('%s → %s', (stripeStatus, expected) => {
    expect(mapSubscriptionStatus(stripeStatus)).toBe(expected);
  });
});

describe('checkout session validation (mocked sessions, no Stripe SDK)', () => {
  const PLUS_PRICE = 'price_plus_49';

  const goodSession: SessionForValidation = {
    mode: 'subscription',
    created: 1_752_000_000,
    line_items: { data: [{ price: { id: PLUS_PRICE } }] },
    customer: 'cus_test123',
    subscription: { id: 'sub_test456', status: 'active' },
  };

  it('accepts a valid Plus subscription session', () => {
    const result = validateSessionForPlus(goodSession, PLUS_PRICE);
    expect(result).toEqual({
      ok: true,
      customer: 'cus_test123',
      subscription: 'sub_test456',
      subscriptionStatus: 'active',
      sessionCreated: 1_752_000_000,
    });
  });

  it('accepts a trialing subscription', () => {
    const result = validateSessionForPlus(
      {
        ...goodSession,
        subscription: { id: 'sub_trial', status: 'trialing' },
      },
      PLUS_PRICE,
    );
    expect(result.ok).toBe(true);
  });

  it('rejects the wrong price', () => {
    const result = validateSessionForPlus(
      {
        ...goodSession,
        line_items: { data: [{ price: { id: 'price_something_else' } }] },
      },
      PLUS_PRICE,
    );
    expect(result).toEqual({ ok: false, reason: 'wrong_price' });
  });

  it('rejects non-subscription mode', () => {
    const result = validateSessionForPlus(
      { ...goodSession, mode: 'payment' },
      PLUS_PRICE,
    );
    expect(result).toEqual({ ok: false, reason: 'wrong_mode' });
  });

  it('rejects an inactive (canceled/unpaid) subscription', () => {
    for (const status of ['canceled', 'unpaid', 'incomplete']) {
      const result = validateSessionForPlus(
        { ...goodSession, subscription: { id: 'sub_x', status } },
        PLUS_PRICE,
      );
      expect(result).toEqual({ ok: false, reason: 'subscription_not_active' });
    }
  });

  it('rejects a missing/unexpanded subscription', () => {
    expect(
      validateSessionForPlus({ ...goodSession, subscription: null }, PLUS_PRICE),
    ).toEqual({ ok: false, reason: 'no_subscription' });
    expect(
      validateSessionForPlus(
        { ...goodSession, subscription: 'sub_unexpanded' },
        PLUS_PRICE,
      ),
    ).toEqual({ ok: false, reason: 'no_subscription' });
  });

  it('rejects everything when STRIPE_PLUS_PRICE_ID is unset (missing-env fallback)', () => {
    expect(validateSessionForPlus(goodSession, undefined)).toEqual({
      ok: false,
      reason: 'not_configured',
    });
  });
});

describe('stripe singleton missing-env behavior', () => {
  const saved = process.env.STRIPE_SECRET_KEY;
  beforeEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
  });
  afterEach(() => {
    if (saved === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = saved;
  });

  it('reports unconfigured and throws a clear error only when used', () => {
    expect(isStripeConfigured()).toBe(false);
    expect(() => getStripe()).toThrow(/STRIPE_SECRET_KEY is not set/);
  });
});
