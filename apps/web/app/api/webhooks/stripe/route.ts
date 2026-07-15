/**
 * POST /api/webhooks/stripe
 *
 * Stripe webhook for Cartwright Plus. Stripe remains the entitlement store —
 * this handler keeps NO local state. It exists to (1) authoritatively fulfill
 * `checkout.session.completed` by emailing the Plus access key, and (2) log
 * lifecycle events (payment failures, cancellations) for the operator.
 *
 * Contract:
 * - 501 when the webhook is not configured (missing STRIPE_WEBHOOK_SECRET /
 *   STRIPE_SECRET_KEY) — clear log, nothing else.
 * - 400 on a bad/missing signature (raw-body verification).
 * - For fulfillment events, PERMANENT outcomes ack with 2xx (a retry cannot
 *   change the facts of the session: wrong price, wrong mode, no email on
 *   the session) while TRANSIENT/FIXABLE failures return 5xx so Stripe
 *   retries with backoff for up to ~3 days: Stripe/network retrieval errors,
 *   Resend send failures (thrown OR resolved-with-{error}), and missing
 *   signing/Resend/price config — the retry window is exactly the window in
 *   which an operator can fix config without a paying member losing their
 *   activation email. The Resend idempotency key makes all retries safe.
 * - Delayed payment methods: `checkout.session.completed` may arrive with
 *   the subscription still `incomplete` (acked — not a failure); the later
 *   `checkout.session.async_payment_succeeded` runs the SAME fulfillment
 *   path and sends the key. `async_payment_failed` is logged and acked.
 *
 * Email idempotency: Resend is called with idempotency key
 * `plus-activation/<session-id>`, so Stripe's at-least-once delivery cannot
 * double-send the activation email.
 *
 * Required env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
 * Optional env: RESEND_API_KEY (activation email), PLUS_FROM_EMAIL
 *   (default noreply@cartwright.app), CARTWRIGHT_PLUS_SIGNING_PRIVATE_KEY
 *   (key issuance), STRIPE_PORTAL_URL (email footer link).
 */

import type Stripe from 'stripe';
import { Resend } from 'resend';
import { getStripe } from '@/lib/stripe';
import { fulfillCheckoutSession } from '@/lib/plus-entitlement';
import { issuePlusKey } from '@/lib/plus-token';
import { contactEmail } from '@/lib/shared';

export const runtime = 'nodejs';

const DEFAULT_FROM = 'Cartwright <noreply@cartwright.app>';

export async function POST(request: Request): Promise<Response> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || !process.env.STRIPE_SECRET_KEY) {
    console.warn(
      '[stripe-webhook] Not configured (STRIPE_WEBHOOK_SECRET and/or ' +
        'STRIPE_SECRET_KEY missing) — returning 501. See apps/web/.env.example.',
    );
    return Response.json(
      { ok: false, error: 'webhook_not_configured' },
      { status: 501 },
    );
  }

  // Signature verification needs the exact raw body — read it as text.
  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return Response.json(
      { ok: false, error: 'missing_signature' },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  try {
    event = await getStripe().webhooks.constructEventAsync(
      rawBody,
      signature,
      webhookSecret,
    );
  } catch (err) {
    console.warn(
      '[stripe-webhook] Signature verification failed:',
      err instanceof Error ? err.message : String(err),
    );
    return Response.json(
      { ok: false, error: 'invalid_signature' },
      { status: 400 },
    );
  }

  switch (event.type) {
    // Both events run the same validated fulfillment: `completed` covers
    // instant payment methods; `async_payment_succeeded` covers delayed
    // methods (bank debits etc.) whose `completed` event arrived while the
    // subscription was still `incomplete`.
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const session = event.data.object;
      return handleCheckoutFulfillment(session, event.type);
    }

    case 'checkout.session.async_payment_failed':
      console.info(
        `[stripe-webhook] checkout.session.async_payment_failed for session ` +
          `${event.data.object.id} — delayed payment did not clear; no key ` +
          `issued (event ${event.id}).`,
      );
      break;

    // No store to update — Stripe is the entitlement store, and the verify
    // endpoint asks Stripe live. Log so the operator sees lifecycle changes.
    case 'invoice.payment_failed':
      console.info(
        `[stripe-webhook] invoice.payment_failed — subscription enters ` +
          `past_due/grace via Stripe retries (event ${event.id}).`,
      );
      break;
    case 'customer.subscription.deleted':
    case 'customer.subscription.updated': {
      const sub = event.data.object;
      console.info(
        `[stripe-webhook] ${event.type} — subscription ${sub.id} status=` +
          `${sub.status} (event ${event.id}). No local store; verify endpoint ` +
          'reflects this immediately.',
      );
      break;
    }

    default:
      // Unhandled event types are acknowledged so Stripe stops retrying.
      break;
  }

  return Response.json({ ok: true, received: true });
}

/** 2xx ack — Stripe stops retrying. For outcomes a retry cannot change. */
function ack(note: string): Response {
  return Response.json({ ok: true, received: true, note });
}

/** 5xx — Stripe retries with backoff. For transient/fixable failures. */
function retryLater(error: string): Response {
  return Response.json({ ok: false, error }, { status: 500 });
}

async function handleCheckoutFulfillment(
  session: Stripe.Checkout.Session,
  eventType: string,
): Promise<Response> {
  // Re-retrieve + validate (mode, price, subscription status) — never trust
  // the event payload alone for fulfillment.
  const result = await fulfillCheckoutSession(session.id);
  if (!result.ok) {
    // Transient Stripe/network error → 5xx so Stripe redelivers. Permanent
    // facts about the session (wrong price/mode, not active) → ack.
    if (result.reason === 'retrieval_error') {
      console.warn(
        `[stripe-webhook] Transient error retrieving session ${session.id} ` +
          `for ${eventType} — returning 500 so Stripe retries.`,
      );
      return retryLater('session_retrieval_failed');
    }
    if (result.reason === 'not_configured') {
      // STRIPE_PLUS_PRICE_ID missing on the money path — fixable config.
      // Retrying gives the operator Stripe's ~3-day window to set it.
      console.error(
        `[stripe-webhook] STRIPE_PLUS_PRICE_ID missing — cannot validate ` +
          `session ${session.id} as a Plus purchase. Returning 500 so Stripe ` +
          'retries once configuration is fixed.',
      );
      return retryLater('price_id_not_configured');
    }
    console.warn(
      `[stripe-webhook] ${eventType} for ${session.id} did not validate as a ` +
        `Plus purchase (reason: ${result.reason}) — no key issued.` +
        (result.reason === 'subscription_not_active'
          ? ' If this is a delayed payment method, ' +
            'checkout.session.async_payment_succeeded will fulfill later.'
          : ''),
    );
    return ack(`not_fulfilled:${result.reason}`);
  }

  const key = issuePlusKey({
    customer: result.customer,
    subscription: result.subscription,
    // Stable issuedAt (session creation time): Stripe retries must produce
    // the IDENTICAL key/email payload under the same Resend idempotency key,
    // or Resend rejects the retry as invalid_idempotent_request (codex P1).
    issuedAt: result.sessionCreated,
  });
  if (!key) {
    // Fixable config on the money path — retry window, not silent loss.
    console.error(
      `[stripe-webhook] CARTWRIGHT_PLUS_SIGNING_PRIVATE_KEY missing — cannot ` +
        `issue access key for session ${session.id}. Returning 500 so Stripe ` +
        'retries once the signing key is configured.',
    );
    return retryLater('signing_key_not_configured');
  }

  const email = session.customer_details?.email ?? session.customer_email;
  if (!email) {
    // Permanent: the session itself has no email; retrying redelivers the
    // same session. The success page shows the key; support can reissue.
    console.error(
      `[stripe-webhook] No customer email on session ${session.id} — cannot ` +
        'send activation email. Key can be reissued from the success page.',
    );
    return ack('no_customer_email');
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Fixable config on the money path — same retry-window reasoning.
    console.error(
      `[stripe-webhook] RESEND_API_KEY missing — activation email for ` +
        `session ${session.id} NOT sent. Returning 500 so Stripe retries ` +
        'once Resend is configured.',
    );
    return retryLater('resend_not_configured');
  }

  const from = process.env.PLUS_FROM_EMAIL ?? DEFAULT_FROM;
  const portalUrl = process.env.STRIPE_PORTAL_URL;
  const resend = new Resend(apiKey);

  try {
    // NOTE: the Resend SDK does NOT throw on API errors — it resolves with
    // { data: null, error }. Both failure shapes must return 5xx, or the
    // activation email is permanently lost.
    const { error } = await resend.emails.send(
      {
        from,
        to: email,
        replyTo: contactEmail,
        subject: 'Your Cartwright Plus access key',
        text: [
          'Thanks for joining Cartwright Plus.',
          '',
          'Your Plus access key (keep it like a password):',
          '',
          `  ${key}`,
          '',
          'Activate it in your shop:',
          '  - Admin UI: /admin/plus (arrives with engine v0.40), or',
          '  - Environment: set CARTWRIGHT_PLUS_KEY=<your key> on your deployment.',
          '',
          'Billing and cancellation are self-service via the Stripe customer portal:',
          `  ${portalUrl ?? 'https://billing.stripe.com/ (link arrives with your receipt)'}`,
          '',
          'Cancel anytime — your site and all code you already have keep running.',
          `Lost the key? Just reply to this email or write ${contactEmail} and we reissue it.`,
          '',
          '— Kenni',
          '   Cartwright',
        ].join('\n'),
      },
      // Stripe delivers at-least-once; this makes the email exactly-once.
      { idempotencyKey: `plus-activation/${session.id}` },
    );
    if (error) {
      console.error(
        `[stripe-webhook] Resend rejected the activation email for session ` +
          `${session.id} (${error.name}): ${error.message}. Returning 500 so ` +
          'Stripe retries (idempotency key prevents duplicates).',
      );
      return retryLater('activation_email_failed');
    }
    console.info(
      `[stripe-webhook] Activation email sent for session ${session.id}.`,
    );
    return ack('activation_email_sent');
  } catch (err) {
    console.error(
      `[stripe-webhook] Activation email for session ${session.id} threw — ` +
        'returning 500 so Stripe retries (idempotency key prevents duplicates):',
      err instanceof Error ? err.message : String(err),
    );
    return retryLater('activation_email_failed');
  }
}
