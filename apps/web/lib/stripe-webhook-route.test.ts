/**
 * Behavioral tests for POST /api/webhooks/stripe — the three money-path
 * guarantees Codex review demanded:
 *
 * 1. A Resend send that RESOLVES with { error } (the SDK does not throw on
 *    API errors) returns 5xx so Stripe retries — never a silent 2xx.
 * 2. Transient session-retrieval failures return 5xx (retry); only genuine
 *    resource_missing/validation verdicts ack with 2xx.
 * 3. checkout.session.async_payment_succeeded (delayed payment methods)
 *    runs the same fulfillment path and sends the activation email;
 *    async_payment_failed is logged + acked.
 *
 * Stripe and Resend are both mocked at the module boundary; the signing
 * keypair is THROWAWAY, generated per run.
 */

import { generateKeyPairSync } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockConstructEvent,
  mockRetrieveSession,
  mockRetrieveSubscription,
  mockSendEmail,
} = vi.hoisted(() => ({
  mockConstructEvent: vi.fn(),
  mockRetrieveSession: vi.fn(),
  mockRetrieveSubscription: vi.fn(),
  mockSendEmail: vi.fn(),
}));

vi.mock('@/lib/stripe', () => ({
  isStripeConfigured: () => Boolean(process.env.STRIPE_SECRET_KEY),
  getStripe: () => ({
    webhooks: { constructEventAsync: mockConstructEvent },
    checkout: { sessions: { retrieve: mockRetrieveSession } },
    subscriptions: { retrieve: mockRetrieveSubscription },
  }),
}));

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: mockSendEmail };
  },
}));

import { POST } from '@/app/api/webhooks/stripe/route';

const { privateKey } = generateKeyPairSync('ed25519');

const ENV = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PLUS_PRICE_ID',
  'RESEND_API_KEY',
  'PLUS_FROM_EMAIL',
  'CARTWRIGHT_PLUS_SIGNING_PRIVATE_KEY',
  'CARTWRIGHT_PLUS_SIGNING_KEY_ID',
] as const;
const saved: Record<string, string | undefined> = {};

const SESSION_ID = 'cs_test_abc';

function sessionEvent(type: string) {
  return {
    id: 'evt_1',
    type,
    data: {
      object: {
        id: SESSION_ID,
        customer_details: { email: 'buyer@example.com' },
        customer_email: null,
      },
    },
  };
}

function goodRetrievedSession() {
  return {
    mode: 'subscription',
    created: 1_752_000_000,
    line_items: { data: [{ price: { id: 'price_plus_49' } }] },
    customer: 'cus_ok',
    subscription: { id: 'sub_ok', status: 'active' },
  };
}

function post(): Promise<Response> {
  return POST(
    new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': 't=1,v1=sig' },
      body: '{}',
    }),
  );
}

beforeEach(() => {
  for (const name of ENV) saved[name] = process.env[name];
  process.env.STRIPE_SECRET_KEY = 'sk_test_throwaway';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_throwaway';
  process.env.STRIPE_PLUS_PRICE_ID = 'price_plus_49';
  process.env.RESEND_API_KEY = 're_test_throwaway';
  process.env.CARTWRIGHT_PLUS_SIGNING_PRIVATE_KEY = privateKey
    .export({ type: 'pkcs8', format: 'der' })
    .toString('base64');
  process.env.CARTWRIGHT_PLUS_SIGNING_KEY_ID = '2026-01';

  mockConstructEvent.mockReset();
  mockRetrieveSession.mockReset();
  mockRetrieveSubscription.mockReset();
  mockSendEmail.mockReset();
  vi.spyOn(console, 'info').mockImplementation(() => {});
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

describe('signature & config gates', () => {
  it('501 when webhook env is missing', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const res = await post();
    expect(res.status).toBe(501);
  });

  it('400 on bad signature', async () => {
    mockConstructEvent.mockRejectedValue(new Error('bad sig'));
    const res = await post();
    expect(res.status).toBe(400);
  });
});

describe('fix 5 — retries produce a byte-identical email payload (stable issuedAt)', () => {
  it('two deliveries of the same session issue the SAME key (Resend idempotency contract)', async () => {
    mockConstructEvent.mockResolvedValue(
      sessionEvent('checkout.session.completed'),
    );
    mockRetrieveSession.mockResolvedValue(goodRetrievedSession());
    mockSendEmail.mockResolvedValue({ data: { id: 'em_1' }, error: null });

    await post();
    const firstArgs = JSON.stringify(mockSendEmail.mock.calls[0]);

    mockSendEmail.mockClear();
    // Simulate a Stripe retry seconds later — payload must not drift.
    await new Promise((r) => setTimeout(r, 5));
    await post();
    const secondArgs = JSON.stringify(mockSendEmail.mock.calls[0]);

    expect(secondArgs).toBe(firstArgs);
  });
});

describe('fix 1 — Resend { error } result is a retriable failure', () => {
  it('returns 5xx when send() RESOLVES with an error object', async () => {
    mockConstructEvent.mockResolvedValue(
      sessionEvent('checkout.session.completed'),
    );
    mockRetrieveSession.mockResolvedValue(goodRetrievedSession());
    mockSendEmail.mockResolvedValue({
      data: null,
      error: { name: 'validation_error', message: 'from domain not verified' },
    });

    const res = await post();
    expect(res.status).toBe(500);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
  });

  it('returns 5xx when send() throws', async () => {
    mockConstructEvent.mockResolvedValue(
      sessionEvent('checkout.session.completed'),
    );
    mockRetrieveSession.mockResolvedValue(goodRetrievedSession());
    mockSendEmail.mockRejectedValue(new Error('ECONNRESET'));

    const res = await post();
    expect(res.status).toBe(500);
  });

  it('acks 2xx and passes the idempotency key on success', async () => {
    mockConstructEvent.mockResolvedValue(
      sessionEvent('checkout.session.completed'),
    );
    mockRetrieveSession.mockResolvedValue(goodRetrievedSession());
    mockSendEmail.mockResolvedValue({ data: { id: 'email_1' }, error: null });

    const res = await post();
    expect(res.status).toBe(200);
    const [payload, options] = mockSendEmail.mock.calls[0];
    expect(payload.to).toBe('buyer@example.com');
    expect(payload.text).toContain('cw_plus_v1.');
    expect(options).toEqual({ idempotencyKey: `plus-activation/${SESSION_ID}` });
  });
});

describe('fix 2 — transient retrieval errors retry, permanent verdicts ack', () => {
  it('5xx on a transient Stripe/network error (Stripe will redeliver)', async () => {
    mockConstructEvent.mockResolvedValue(
      sessionEvent('checkout.session.completed'),
    );
    mockRetrieveSession.mockRejectedValue(new Error('ETIMEDOUT'));

    const res = await post();
    expect(res.status).toBe(500);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('2xx ack on a genuine resource_missing session', async () => {
    mockConstructEvent.mockResolvedValue(
      sessionEvent('checkout.session.completed'),
    );
    mockRetrieveSession.mockRejectedValue(
      Object.assign(new Error('no such session'), {
        code: 'resource_missing',
        statusCode: 404,
      }),
    );

    const res = await post();
    expect(res.status).toBe(200);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('2xx ack on a permanent validation verdict (wrong price)', async () => {
    mockConstructEvent.mockResolvedValue(
      sessionEvent('checkout.session.completed'),
    );
    mockRetrieveSession.mockResolvedValue({
      ...goodRetrievedSession(),
      line_items: { data: [{ price: { id: 'price_other' } }] },
    });

    const res = await post();
    expect(res.status).toBe(200);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('5xx when signing key is missing (fixable config, not silent loss)', async () => {
    delete process.env.CARTWRIGHT_PLUS_SIGNING_PRIVATE_KEY;
    mockConstructEvent.mockResolvedValue(
      sessionEvent('checkout.session.completed'),
    );
    mockRetrieveSession.mockResolvedValue(goodRetrievedSession());

    const res = await post();
    expect(res.status).toBe(500);
  });
});

describe('fix 3 — delayed payment methods', () => {
  it('async_payment_succeeded runs the same fulfillment and sends the key', async () => {
    mockConstructEvent.mockResolvedValue(
      sessionEvent('checkout.session.async_payment_succeeded'),
    );
    mockRetrieveSession.mockResolvedValue(goodRetrievedSession());
    mockSendEmail.mockResolvedValue({ data: { id: 'email_2' }, error: null });

    const res = await post();
    expect(res.status).toBe(200);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail.mock.calls[0][1]).toEqual({
      idempotencyKey: `plus-activation/${SESSION_ID}`,
    });
  });

  it('completed-with-incomplete-subscription acks (async flow will follow)', async () => {
    mockConstructEvent.mockResolvedValue(
      sessionEvent('checkout.session.completed'),
    );
    mockRetrieveSession.mockResolvedValue({
      ...goodRetrievedSession(),
      subscription: { id: 'sub_pending', status: 'incomplete' },
    });

    const res = await post();
    expect(res.status).toBe(200);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('async_payment_failed is logged and acked, no email', async () => {
    mockConstructEvent.mockResolvedValue(
      sessionEvent('checkout.session.async_payment_failed'),
    );

    const res = await post();
    expect(res.status).toBe(200);
    expect(mockRetrieveSession).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });
});
