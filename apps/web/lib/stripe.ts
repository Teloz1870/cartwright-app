/**
 * Server-only Stripe singleton for cartwright.app.
 *
 * Lazy by design: importing this module NEVER throws, so every route and page
 * that references Stripe still builds and serves with zero Stripe env vars
 * set. The error only fires when a code path actually needs the client
 * (`getStripe()`) without `STRIPE_SECRET_KEY` configured — callers that want
 * a graceful fallback should check `isStripeConfigured()` first.
 *
 * Never import this from a Client Component — the secret key must stay on
 * the server.
 */

import Stripe from 'stripe';

let cached: Stripe | null = null;

/** True when STRIPE_SECRET_KEY is set — check before calling getStripe(). */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/**
 * The lazily-created Stripe client.
 *
 * @throws Error with a clear, actionable message when STRIPE_SECRET_KEY is
 *   missing. Guard call sites with `isStripeConfigured()` when the feature
 *   should degrade gracefully instead of erroring.
 */
export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      'STRIPE_SECRET_KEY is not set. Plus purchase fulfillment, the Stripe ' +
        'webhook, and access-key verification are disabled until it is ' +
        'configured (see apps/web/.env.example).',
    );
  }
  cached = new Stripe(key);
  return cached;
}
