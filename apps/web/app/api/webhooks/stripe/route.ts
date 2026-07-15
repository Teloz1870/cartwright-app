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
 * - 2xx on every handled event, even when a side-effect (email) fails —
 *   Stripe retries non-2xx, and a retry storm cannot fix a missing Resend
 *   key. Failures are logged loudly for manual reissue by support.
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
    case 'checkout.session.completed': {
      const session = event.data.object;
      await handleCheckoutCompleted(session);
      break;
    }

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

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  // Re-retrieve + validate (mode, price, subscription status) — never trust
  // the event payload alone for fulfillment.
  const result = await fulfillCheckoutSession(session.id);
  if (!result.ok) {
    console.warn(
      `[stripe-webhook] checkout.session.completed for ${session.id} did not ` +
        `validate as a Plus purchase (reason: ${result.reason}) — no key issued.`,
    );
    return;
  }

  const key = issuePlusKey({
    customer: result.customer,
    subscription: result.subscription,
  });
  if (!key) {
    console.error(
      `[stripe-webhook] CARTWRIGHT_PLUS_SIGNING_PRIVATE_KEY missing — cannot ` +
        `issue access key for session ${session.id}. Purchase is safe in ` +
        'Stripe; reissue manually once the signing key is configured.',
    );
    return;
  }

  const email = session.customer_details?.email ?? session.customer_email;
  if (!email) {
    console.error(
      `[stripe-webhook] No customer email on session ${session.id} — cannot ` +
        'send activation email. Key can be reissued from the success page.',
    );
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error(
      `[stripe-webhook] RESEND_API_KEY missing — activation email for ` +
        `session ${session.id} NOT sent. The success page still shows the key; ` +
        'support can reissue.',
    );
    return;
  }

  const from = process.env.PLUS_FROM_EMAIL ?? DEFAULT_FROM;
  const portalUrl = process.env.STRIPE_PORTAL_URL;
  const resend = new Resend(apiKey);

  try {
    await resend.emails.send(
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
    console.info(
      `[stripe-webhook] Activation email sent for session ${session.id}.`,
    );
  } catch (err) {
    console.error(
      `[stripe-webhook] Activation email for session ${session.id} failed ` +
        '(still returning 2xx; reissue via support):',
      err instanceof Error ? err.message : String(err),
    );
  }
}
