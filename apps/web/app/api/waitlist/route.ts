/**
 * POST /api/waitlist
 *
 * Receives a waitlist signup from the pricing page tier cards (Plus, Cloud).
 * Notifies the operator and emails the signer a confirmation via Resend.
 *
 * No database — Resend is the system of record for now. When signup volume
 * justifies it, swap in Vercel KV or Postgres + keep the email side-effect.
 *
 * Required env: RESEND_API_KEY
 * Optional env: WAITLIST_FROM_EMAIL (defaults to noreply@cartwright.app)
 *               WAITLIST_NOTIFY_EMAIL (defaults to contactEmail in shared.ts)
 */

import { contactEmail } from '@/lib/shared';
import { Resend } from 'resend';

export const runtime = 'nodejs';

const ALLOWED_TIERS = ['plus', 'cloud'] as const;
type Tier = (typeof ALLOWED_TIERS)[number];

const TIER_LABELS: Record<Tier, string> = {
  plus: 'Cartwright Plus ($49/mo)',
  cloud: 'Cartwright Cloud ($199/mo)',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type WaitlistPayload = {
  email?: unknown;
  tier?: unknown;
};

function bad(error: string, status = 400): Response {
  return Response.json({ ok: false, error }, { status });
}

export async function POST(request: Request): Promise<Response> {
  let body: WaitlistPayload;
  try {
    body = (await request.json()) as WaitlistPayload;
  } catch {
    return bad('invalid_json');
  }

  const email =
    typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const tier = typeof body.tier === 'string' ? body.tier : '';

  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return bad('invalid_email');
  }
  if (!ALLOWED_TIERS.includes(tier as Tier)) {
    return bad('invalid_tier');
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return bad('email_not_configured', 503);
  }

  const fromAddress =
    process.env.WAITLIST_FROM_EMAIL ?? 'Cartwright <noreply@cartwright.app>';
  const notifyAddress = process.env.WAITLIST_NOTIFY_EMAIL ?? contactEmail;
  const tierLabel = TIER_LABELS[tier as Tier];

  const resend = new Resend(apiKey);

  // Notification to the operator must succeed — it's the system of record for
  // signups (no DB). If it fails, the signup is effectively lost, so block on it.
  try {
    await resend.emails.send({
      from: fromAddress,
      to: notifyAddress,
      replyTo: email,
      subject: `[Waitlist] ${tierLabel} — ${email}`,
      text: `New waitlist signup\n\nTier: ${tierLabel}\nEmail: ${email}\n\nReply directly to this email to reach the signup.`,
    });
  } catch (err) {
    return Response.json(
      {
        ok: false,
        error: 'email_send_failed',
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 502 },
    );
  }

  // Confirmation to the signup is best-effort. During the testing window
  // (onboarding@resend.dev FROM, cartwright.app DNS unverified), Resend only
  // allows sending to the account owner — so confirmation to random visitors
  // will fail with 403. We still tell them they're on the list because the
  // operator notification went through.
  void resend.emails
    .send({
      from: fromAddress,
      to: email,
      replyTo: contactEmail,
      subject: `You're on the ${tierLabel.split(' (')[0]} waitlist`,
      text: [
        `Thanks for joining the ${tierLabel} waitlist.`,
        '',
        "We'll email you as soon as it's ready — no spam, no drip campaign.",
        '',
        'Until then:',
        `  - Scaffold a free self-hosted shop:  npx create-cartwright@latest my-shop`,
        `  - Docs:                              https://cartwright.app/docs`,
        `  - Pricing details:                   https://cartwright.app/services`,
        '',
        'Questions? Just reply to this email.',
        '',
        '— Kenni',
        '   Cartwright',
      ].join('\n'),
    })
    .catch((err: unknown) => {
      console.warn(
        '[waitlist] confirmation email failed (signup still recorded):',
        err instanceof Error ? err.message : String(err),
      );
    });

  return Response.json({ ok: true });
}
