/**
 * POST /api/contact
 *
 * Receives a contact-form submission from /contact. Notifies the operator
 * and emails the sender a confirmation via Resend.
 *
 * No database — Resend is the system of record. Sender email is captured
 * as the replyTo on the operator notification, so the operator can reply
 * directly without copy-pasting addresses.
 *
 * Required env: RESEND_API_KEY
 * Optional env: CONTACT_FROM_EMAIL (defaults to noreply@cartwright.app)
 *               CONTACT_NOTIFY_EMAIL (defaults to contactEmail in shared.ts)
 */

import { contactEmail } from '@/lib/shared';
import { Resend } from 'resend';

export const runtime = 'nodejs';

const ALLOWED_SUBJECTS = [
  'setup-help',
  'partnership',
  'press',
  'security',
  'other',
] as const;
type Subject = (typeof ALLOWED_SUBJECTS)[number];

const SUBJECT_LABELS: Record<Subject, string> = {
  'setup-help': 'Setup help',
  partnership: 'Partnership',
  press: 'Press',
  security: 'Security disclosure',
  other: 'Other',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const NAME_MAX = 120;
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 4000;

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  subject?: unknown;
  message?: unknown;
};

function bad(error: string, status = 400): Response {
  return Response.json({ ok: false, error }, { status });
}

export async function POST(request: Request): Promise<Response> {
  let body: ContactPayload;
  try {
    body = (await request.json()) as ContactPayload;
  } catch {
    return bad('invalid_json');
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email =
    typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const subjectRaw = typeof body.subject === 'string' ? body.subject : 'other';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (!name || name.length > NAME_MAX) {
    return bad('invalid_name');
  }
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return bad('invalid_email');
  }
  if (!ALLOWED_SUBJECTS.includes(subjectRaw as Subject)) {
    return bad('invalid_subject');
  }
  if (message.length < MESSAGE_MIN || message.length > MESSAGE_MAX) {
    return bad('invalid_message');
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return bad('email_not_configured', 503);
  }

  const fromAddress =
    process.env.CONTACT_FROM_EMAIL ?? 'Cartwright <noreply@cartwright.app>';
  const notifyAddress = process.env.CONTACT_NOTIFY_EMAIL ?? contactEmail;
  const subjectLabel = SUBJECT_LABELS[subjectRaw as Subject];

  const resend = new Resend(apiKey);

  // Notification to the operator must succeed — it's the system of record for
  // contact submissions (no DB). If it fails, the message is effectively lost,
  // so block on it.
  try {
    await resend.emails.send({
      from: fromAddress,
      to: notifyAddress,
      replyTo: email,
      subject: `[Contact] ${subjectLabel} — ${name}`,
      text: [
        `New contact-form submission`,
        '',
        `Subject:  ${subjectLabel}`,
        `Name:     ${name}`,
        `Email:    ${email}`,
        '',
        '— Message —',
        message,
        '',
        'Reply directly to this email to reach the sender.',
      ].join('\n'),
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

  // Confirmation to the sender is best-effort — same Resend-domain-not-verified
  // caveat applies as on /api/waitlist. We still return ok if the operator
  // notification went through.
  void resend.emails
    .send({
      from: fromAddress,
      to: email,
      replyTo: contactEmail,
      subject: 'We got your message',
      text: [
        `Hi ${name},`,
        '',
        `Thanks for reaching out — we'll get back within 48 hours (often faster).`,
        '',
        `For reference, here's what you sent:`,
        '',
        `  Subject: ${subjectLabel}`,
        '',
        message,
        '',
        '— Until then —',
        `  - Docs:        https://cartwright.app/docs`,
        `  - Pricing:     https://cartwright.app/pricing`,
        `  - Scaffold:    npx create-cartwright@latest my-shop`,
        '',
        'Talk soon,',
        'Kenni',
        'Cartwright',
      ].join('\n'),
    })
    .catch((err: unknown) => {
      console.warn(
        '[contact] confirmation email failed (submission still recorded):',
        err instanceof Error ? err.message : String(err),
      );
    });

  return Response.json({ ok: true });
}
