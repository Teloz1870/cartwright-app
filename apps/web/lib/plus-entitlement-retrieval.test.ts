/**
 * fulfillCheckoutSession / getSubscriptionPlusStatus retrieval-error
 * semantics, with the Stripe client mocked at the module boundary:
 *
 * - a genuine `resource_missing` (or 404) is the PERMANENT
 *   `session_not_found`;
 * - any other retrieval failure is the TRANSIENT `retrieval_error`, so the
 *   webhook can 5xx → Stripe retries instead of dropping the purchase.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRetrieveSession, mockRetrieveSubscription } = vi.hoisted(() => ({
  mockRetrieveSession: vi.fn(),
  mockRetrieveSubscription: vi.fn(),
}));

vi.mock('@/lib/stripe', () => ({
  isStripeConfigured: () => Boolean(process.env.STRIPE_SECRET_KEY),
  getStripe: () => ({
    checkout: { sessions: { retrieve: mockRetrieveSession } },
    subscriptions: { retrieve: mockRetrieveSubscription },
  }),
}));

import {
  fulfillCheckoutSession,
  getSubscriptionPlusStatus,
} from './plus-entitlement';

/** Shaped like a StripeError without importing the SDK. */
function stripeError(props: { code?: string; statusCode?: number }) {
  return Object.assign(new Error('stripe error'), props);
}

const ENV = ['STRIPE_SECRET_KEY', 'STRIPE_PLUS_PRICE_ID'] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const name of ENV) saved[name] = process.env[name];
  process.env.STRIPE_SECRET_KEY = 'sk_test_throwaway';
  process.env.STRIPE_PLUS_PRICE_ID = 'price_plus_49';
  mockRetrieveSession.mockReset();
  mockRetrieveSubscription.mockReset();
});
afterEach(() => {
  for (const name of ENV) {
    if (saved[name] === undefined) delete process.env[name];
    else process.env[name] = saved[name];
  }
});

describe('fulfillCheckoutSession error split', () => {
  it('maps resource_missing to the permanent session_not_found', async () => {
    mockRetrieveSession.mockRejectedValue(
      stripeError({ code: 'resource_missing', statusCode: 404 }),
    );
    expect(await fulfillCheckoutSession('cs_gone')).toEqual({
      ok: false,
      reason: 'session_not_found',
    });
  });

  it('maps a bare 404 to session_not_found too', async () => {
    mockRetrieveSession.mockRejectedValue(stripeError({ statusCode: 404 }));
    expect(await fulfillCheckoutSession('cs_gone')).toEqual({
      ok: false,
      reason: 'session_not_found',
    });
  });

  it('maps network/API failures to the TRANSIENT retrieval_error', async () => {
    for (const err of [
      new Error('ECONNRESET'),
      stripeError({ statusCode: 500 }),
      stripeError({ code: 'rate_limit', statusCode: 429 }),
    ]) {
      mockRetrieveSession.mockRejectedValue(err);
      expect(await fulfillCheckoutSession('cs_blip')).toEqual({
        ok: false,
        reason: 'retrieval_error',
      });
    }
  });

  it('still validates a successfully retrieved session', async () => {
    mockRetrieveSession.mockResolvedValue({
      mode: 'subscription',
      line_items: { data: [{ price: { id: 'price_plus_49' } }] },
      customer: 'cus_ok',
      subscription: { id: 'sub_ok', status: 'active' },
    });
    expect(await fulfillCheckoutSession('cs_ok')).toEqual({
      ok: true,
      customer: 'cus_ok',
      subscription: 'sub_ok',
      subscriptionStatus: 'active',
    });
  });
});

describe('getSubscriptionPlusStatus error split', () => {
  it('resource_missing → inactive (a definite answer)', async () => {
    mockRetrieveSubscription.mockRejectedValue(
      stripeError({ code: 'resource_missing', statusCode: 404 }),
    );
    expect(await getSubscriptionPlusStatus('sub_never')).toBe('inactive');
  });

  it('transient failure → null (caller treats as unavailable, not revoked)', async () => {
    mockRetrieveSubscription.mockRejectedValue(new Error('ETIMEDOUT'));
    expect(await getSubscriptionPlusStatus('sub_blip')).toBeNull();
  });
});
