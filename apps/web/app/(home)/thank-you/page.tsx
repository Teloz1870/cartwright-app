import { ButtonLink } from '@/components/ui/button';
import { CopyCommand } from '@/components/landing/copy-command';
import { CheckIcon } from 'lucide-react';

export const metadata = {
  title: 'Thank you',
  description: 'Your payment was received — here is what happens next.',
};

// Post-purchase landing for the Stripe Payment Links on /pricing.
// Each Payment Link's success-redirect should point here
// (https://cartwright.app/thank-you).
export default function ThankYouPage() {
  return (
    <main className="relative min-h-screen overflow-hidden pb-32">
      <div aria-hidden className="absolute inset-0 cw-grid-bg opacity-50" />

      <div className="relative mx-auto max-w-2xl px-6 pt-32 sm:pt-40 flex flex-col items-center text-center">
        <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-cw-terracotta/10 text-cw-terracotta">
          <CheckIcon className="size-8" />
        </div>

        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
          Thank you — we&apos;ve got it.
        </h1>

        <p className="mt-6 max-w-xl text-base sm:text-lg text-cw-stone-500 dark:text-cw-stone-400">
          Your payment went through and a receipt is on its way to your inbox.
          We&apos;ll reach out within one business day to kick things off. No
          action needed from you right now.
        </p>

        <div className="mt-10 w-full rounded-2xl border border-cw-stone-200 dark:border-cw-stone-800 bg-cw-stone-50/50 dark:bg-cw-stone-900/50 p-6 text-left">
          <p className="text-xs font-mono uppercase tracking-[0.16em] text-cw-stone-500 dark:text-cw-stone-400 mb-3">
            While you wait
          </p>
          <p className="text-sm text-cw-stone-600 dark:text-cw-stone-300 mb-4">
            Want to get a head start? Scaffold a shop locally — it&apos;s free
            and self-hosted forever.
          </p>
          <CopyCommand command="npx create-cartwright@latest my-shop" />
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/docs/getting-started/quick-start" size="lg">
            Read the docs
          </ButtonLink>
          <ButtonLink href="/pricing" variant="outline" size="lg">
            Back to pricing
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
