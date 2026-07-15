/**
 * Plus entitlement logic: Checkout Session fulfillment + subscription-status
 * mapping. Stripe IS the entitlement store — there is deliberately no DB/KV
 * in V1.
 *
 * The pure functions (`mapSubscriptionStatus`, `validateSessionForPlus`) take
 * plain data so they are unit-testable without mocking the Stripe SDK; the
 * `fulfillCheckoutSession` wrapper does the network round-trip.
 */

import type Stripe from 'stripe';
import { getStripe, isStripeConfigured } from '@/lib/stripe';

/** Membership status derived from a Stripe subscription status. */
export type PlusStatus = 'active' | 'grace' | 'inactive';

/**
 * active | trialing  → active   (full membership)
 * past_due           → grace    (renewal failed; keep access while Stripe retries)
 * everything else    → inactive (canceled, unpaid, incomplete, paused, ...)
 */
export function mapSubscriptionStatus(status: string): PlusStatus {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'past_due':
      return 'grace';
    default:
      return 'inactive';
  }
}

/** The slice of a Checkout Session that fulfillment validation reads. */
export type SessionForValidation = {
  mode: string | null;
  line_items?: {
    data: Array<{ price?: { id: string } | null } | null>;
  } | null;
  customer: string | { id: string } | null;
  subscription:
    | string
    | { id: string; status: string }
    | null;
};

export type FulfillmentResult =
  | {
      ok: true;
      customer: string;
      subscription: string;
      subscriptionStatus: string;
    }
  | {
      ok: false;
      reason:
        | 'not_configured'
        | 'session_not_found'
        | 'wrong_mode'
        | 'wrong_price'
        | 'no_subscription'
        | 'subscription_not_active'
        /**
         * TRANSIENT: Stripe/network error while retrieving the session.
         * Unlike every other reason (permanent facts about the session),
         * this one means "try again" — the webhook returns 5xx on it so
         * Stripe retries, and the success page suggests a refresh.
         */
        | 'retrieval_error';
    };

/**
 * Validate a retrieved Checkout Session as a Plus purchase:
 * mode=subscription, line item price === expectedPriceId, subscription
 * status active/trialing. Pure — pass the session data in.
 *
 * When `expectedPriceId` is unset (STRIPE_PLUS_PRICE_ID missing) we REJECT:
 * fulfilling arbitrary subscriptions as "Plus" would be worse than failing
 * loudly, and support can always reissue.
 */
export function validateSessionForPlus(
  session: SessionForValidation,
  expectedPriceId: string | undefined,
): FulfillmentResult {
  if (!expectedPriceId) return { ok: false, reason: 'not_configured' };
  if (session.mode !== 'subscription') return { ok: false, reason: 'wrong_mode' };

  const priceIds = (session.line_items?.data ?? [])
    .map((item) => item?.price?.id)
    .filter((id): id is string => typeof id === 'string');
  if (!priceIds.includes(expectedPriceId)) {
    return { ok: false, reason: 'wrong_price' };
  }

  const sub = session.subscription;
  if (!sub || typeof sub === 'string') {
    // A string means the caller forgot to expand — treat as missing rather
    // than trusting an unverified status.
    return { ok: false, reason: 'no_subscription' };
  }
  if (mapSubscriptionStatus(sub.status) === 'inactive') {
    return { ok: false, reason: 'subscription_not_active' };
  }

  const customer =
    typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id;
  if (!customer) return { ok: false, reason: 'no_subscription' };

  return {
    ok: true,
    customer,
    subscription: sub.id,
    subscriptionStatus: sub.status,
  };
}

/**
 * True when a Stripe retrieval error means "this id does not exist"
 * (permanent) rather than a transient network/API problem.
 */
function isResourceMissing(err: unknown): boolean {
  const e = err as { code?: string; statusCode?: number } | null;
  return e?.code === 'resource_missing' || e?.statusCode === 404;
}

/**
 * Retrieve a Checkout Session server-side and validate it as a Plus
 * purchase. Never throws for "expected" failures — returns a typed reason so
 * the success page and webhook can render/log a friendly outcome.
 *
 * Only a genuine Stripe `resource_missing`/404 maps to `session_not_found`;
 * any other retrieval failure (network blip, 5xx from Stripe, rate limit) is
 * the TRANSIENT `retrieval_error`, so callers can retry instead of
 * mistaking an outage for a bad session id.
 */
export async function fulfillCheckoutSession(
  sessionId: string,
): Promise<FulfillmentResult> {
  if (!isStripeConfigured()) return { ok: false, reason: 'not_configured' };

  let session: Stripe.Checkout.Session;
  try {
    session = await getStripe().checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'subscription'],
    });
  } catch (err) {
    if (isResourceMissing(err)) {
      return { ok: false, reason: 'session_not_found' };
    }
    console.warn(
      `[plus-entitlement] Transient error retrieving session ${sessionId}:`,
      err instanceof Error ? err.message : String(err),
    );
    return { ok: false, reason: 'retrieval_error' };
  }

  return validateSessionForPlus(
    session as unknown as SessionForValidation,
    process.env.STRIPE_PLUS_PRICE_ID,
  );
}

/**
 * Live subscription-status lookup for the verify endpoint.
 * Returns null when Stripe is not configured or the subscription id is
 * unknown to Stripe (deleted subscriptions still retrieve with status
 * `canceled`, so null really means "cannot answer").
 */
export async function getSubscriptionPlusStatus(
  subscriptionId: string,
): Promise<PlusStatus | null> {
  if (!isStripeConfigured()) return null;
  try {
    const sub = await getStripe().subscriptions.retrieve(subscriptionId);
    return mapSubscriptionStatus(sub.status);
  } catch (err) {
    // resource_missing → the id was never a real subscription: inactive.
    if (isResourceMissing(err)) return 'inactive';
    return null;
  }
}
