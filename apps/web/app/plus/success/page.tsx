/**
 * /plus/success?session_id={CHECKOUT_SESSION_ID}
 *
 * Post-checkout landing for Cartwright Plus. Stripe Payment Links redirect
 * here after a successful subscription purchase. The page retrieves the
 * Checkout Session server-side, validates it as a Plus purchase
 * (mode/price/subscription status), and displays the Plus access key with
 * activation instructions. The `checkout.session.completed` webhook emails
 * the same key — this page is the immediate-gratification half of the pair.
 *
 * Every failure mode renders a friendly explanation with the support
 * address; the purchase is always safe in Stripe and keys can be reissued.
 */

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { contactEmail } from '@/lib/shared';
import { isStripeConfigured } from '@/lib/stripe';
import { fulfillCheckoutSession } from '@/lib/plus-entitlement';
import { issuePlusKey } from '@/lib/plus-token';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Welcome to Cartwright Plus',
  description: 'Your Plus access key and how to activate it.',
  robots: { index: false, follow: false },
};

export default async function PlusSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  if (!sessionId) {
    return (
      <Shell title="Missing checkout session">
        <p>
          This page is the landing spot after a Cartwright Plus checkout, and
          it needs the <code className="font-mono">session_id</code> that
          Stripe appends to the redirect. If you got here from a purchase and
          see this message, your payment is still safe in Stripe — email{' '}
          <SupportLink /> and we will send your access key manually.
        </p>
      </Shell>
    );
  }

  if (!isStripeConfigured()) {
    return (
      <Shell title="Almost there">
        <p>
          Your payment went through, but this deployment cannot look up
          checkout sessions yet (Stripe is not configured server-side). Your
          access key will arrive by email — and if it does not, write{' '}
          <SupportLink /> with your receipt and we will issue it right away.
        </p>
      </Shell>
    );
  }

  const result = await fulfillCheckoutSession(sessionId);

  if (!result.ok) {
    return (
      <Shell title="We could not verify this checkout">
        <p>
          The checkout session could not be verified as a Cartwright Plus
          purchase{' '}
          <span className="text-cw-stone-400">
            (reason: <code className="font-mono">{result.reason}</code>)
          </span>
          . If you completed a payment, do not worry — the purchase is
          recorded in Stripe and the activation email is on its way. Anything
          off? Email <SupportLink /> with your receipt and we will sort it out
          the same day.
        </p>
      </Shell>
    );
  }

  const key = issuePlusKey({
    customer: result.customer,
    subscription: result.subscription,
  });

  if (!key) {
    return (
      <Shell title="Purchase confirmed — key on its way">
        <p>
          Your Cartwright Plus subscription is active, but this deployment
          cannot mint access keys right now. Support has been notified by the
          purchase itself; you will receive your key by email. If it has not
          arrived within a few hours, write <SupportLink />.
        </p>
      </Shell>
    );
  }

  const portalUrl = process.env.STRIPE_PORTAL_URL;

  return (
    <Shell title="Welcome to Cartwright Plus" badge="Purchase complete">
      <p>
        Here is your <strong>Plus access key</strong>. Treat it like a
        password — it proves your membership. A copy is also on its way to
        your inbox.
      </p>

      {/*
        Deliberately NOT the CopyCommand component: it tracks the copied
        string to analytics, and this string is a membership credential.
      */}
      <div className="mt-6 rounded-lg border border-cw-stone-200 dark:border-cw-stone-700 bg-cw-stone-900 dark:bg-cw-stone-950 p-4">
        <code className="block select-all break-all font-mono text-sm text-cw-stone-100">
          {key}
        </code>
      </div>

      <h2 className="mt-10 text-lg font-semibold text-cw-stone-900 dark:text-cw-stone-50">
        Activate it in your shop
      </h2>
      <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm">
        <li>
          <strong>Admin UI</strong> — open{' '}
          <code className="font-mono">/admin/plus</code> in your shop&apos;s
          admin and paste the key (arrives with engine v0.40).
        </li>
        <li>
          <strong>Environment variable</strong> — on your deployment
          (Vercel, Docker, anywhere), set{' '}
          <code className="font-mono">CARTWRIGHT_PLUS_KEY</code> to the key
          and redeploy. Works today on every engine version.
        </li>
      </ol>

      <h2 className="mt-10 text-lg font-semibold text-cw-stone-900 dark:text-cw-stone-50">
        Billing &amp; cancellation
      </h2>
      <p className="mt-3 text-sm">
        Manage your subscription — invoices, card, cancellation — in the
        Stripe customer portal. Cancel anytime: your site and all code you
        already have keep running. Plus is a membership, not a lock.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {portalUrl ? (
          <ButtonLink href={portalUrl} variant="primary" size="md">
            Open billing portal
          </ButtonLink>
        ) : (
          <p className="text-sm text-cw-stone-500 dark:text-cw-stone-400">
            The billing-portal link is included in your Stripe receipt email.
          </p>
        )}
        <ButtonLink href="/docs" variant="outline" size="md">
          Read the docs
        </ButtonLink>
      </div>

      <p className="mt-10 text-sm text-cw-stone-500 dark:text-cw-stone-400">
        Lost the key later? Email <SupportLink /> and we reissue it — no
        forms, no hoops.
      </p>
    </Shell>
  );
}

function SupportLink() {
  return (
    <a
      href={`mailto:${contactEmail}?subject=Cartwright%20Plus%20access%20key`}
      className="font-medium text-cw-terracotta hover:underline"
    >
      {contactEmail}
    </a>
  );
}

function Shell({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden pb-32">
      <div aria-hidden className="absolute inset-0 cw-grid-bg opacity-50" />
      <div className="relative mx-auto max-w-2xl px-6 pt-24 sm:pt-32">
        <Badge tone="terracotta" className="mb-6">
          <span className="size-1.5 rounded-full bg-cw-terracotta" />
          {badge ?? 'Cartwright Plus'}
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
          {title}
        </h1>
        <div className="mt-6 text-base leading-relaxed text-cw-stone-600 dark:text-cw-stone-300">
          {children}
        </div>
        <p className="mt-12 text-sm">
          <Link href="/pricing" className="text-cw-terracotta hover:underline">
            ← Back to pricing
          </Link>
        </p>
      </div>
    </main>
  );
}
