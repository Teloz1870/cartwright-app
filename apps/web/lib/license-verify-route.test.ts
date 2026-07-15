/**
 * Behavioral tests for POST /api/v1/license/verify — the P2 rotation fix:
 * keys issued under a RETIRED kid must keep verifying (via
 * CARTWRIGHT_PLUS_PUBLIC_KEYS) instead of 401'ing paying members, while
 * unknown kids and bad signatures still 401. Stripe mocked; keys throwaway.
 */

import { generateKeyPairSync } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRetrieveSubscription } = vi.hoisted(() => ({
  mockRetrieveSubscription: vi.fn(),
}));

vi.mock('@/lib/stripe', () => ({
  isStripeConfigured: () => Boolean(process.env.STRIPE_SECRET_KEY),
  getStripe: () => ({
    subscriptions: { retrieve: mockRetrieveSubscription },
  }),
}));

import { POST } from '@/app/api/v1/license/verify/route';
import { buildPlusTokenPayload, signPlusToken } from './plus-token';

const { privateKey: currentPriv } = generateKeyPairSync('ed25519');
const { privateKey: oldPriv, publicKey: oldPub } =
  generateKeyPairSync('ed25519');

const ENV = [
  'STRIPE_SECRET_KEY',
  'CARTWRIGHT_PLUS_SIGNING_PRIVATE_KEY',
  'CARTWRIGHT_PLUS_SIGNING_KEY_ID',
  'CARTWRIGHT_PLUS_PUBLIC_KEYS',
] as const;
const saved: Record<string, string | undefined> = {};

function post(body: unknown): Promise<Response> {
  return POST(
    new Request('http://localhost/api/v1/license/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );
}

function tokenWithKid(kid: string, priv: typeof currentPriv): string {
  return signPlusToken(
    buildPlusTokenPayload({
      customer: 'cus_t',
      subscription: 'sub_t',
      issuedAt: 1784050000,
      kid,
    }),
    priv,
  );
}

beforeEach(() => {
  for (const name of ENV) saved[name] = process.env[name];
  process.env.STRIPE_SECRET_KEY = 'sk_test_throwaway';
  process.env.CARTWRIGHT_PLUS_SIGNING_PRIVATE_KEY = currentPriv
    .export({ type: 'pkcs8', format: 'der' })
    .toString('base64');
  process.env.CARTWRIGHT_PLUS_SIGNING_KEY_ID = '2026-01';
  // Rotation state: the old kid's PUBLIC key is parked in the env map.
  process.env.CARTWRIGHT_PLUS_PUBLIC_KEYS = JSON.stringify({
    '2025-07': oldPub.export({ type: 'spki', format: 'der' }).toString('base64'),
  });
  mockRetrieveSubscription.mockReset();
  mockRetrieveSubscription.mockResolvedValue({ status: 'active' });
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  for (const name of ENV) {
    if (saved[name] === undefined) delete process.env[name];
    else process.env[name] = saved[name];
  }
  vi.restoreAllMocks();
});

describe('kid-keyed verification (P2 rotation fix)', () => {
  it('a key signed under the CURRENT kid verifies', async () => {
    const res = await post({ key: tokenWithKid('2026-01', currentPriv) });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'active', plan: 'plus' });
  });

  it('a key issued BEFORE rotation (retired kid) still verifies', async () => {
    const res = await post({ key: tokenWithKid('2025-07', oldPriv) });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'active', plan: 'plus' });
  });

  it('401 on an unknown kid', async () => {
    const res = await post({ key: tokenWithKid('1999-01', currentPriv) });
    expect(res.status).toBe(401);
  });

  it("401 on a signature that fails its own kid's key", async () => {
    // Old private key forging the current kid.
    const res = await post({ key: tokenWithKid('2026-01', oldPriv) });
    expect(res.status).toBe(401);
  });

  it('503 (not 500/401) on a malformed CARTWRIGHT_PLUS_PUBLIC_KEYS', async () => {
    process.env.CARTWRIGHT_PLUS_PUBLIC_KEYS = 'not json';
    const res = await post({ key: tokenWithKid('2026-01', currentPriv) });
    expect(res.status).toBe(503);
  });

  it('grace/inactive statuses map through from Stripe', async () => {
    mockRetrieveSubscription.mockResolvedValue({ status: 'past_due' });
    let res = await post({ key: tokenWithKid('2026-01', currentPriv) });
    expect(await res.json()).toEqual({ status: 'grace', plan: 'plus' });

    mockRetrieveSubscription.mockResolvedValue({ status: 'canceled' });
    res = await post({ key: tokenWithKid('2026-01', currentPriv) });
    expect(await res.json()).toEqual({ status: 'inactive', plan: 'plus' });
  });
});
