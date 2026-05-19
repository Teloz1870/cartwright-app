import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description:
    'Privacy policy for cartwright.app — what we collect and how we use it.',
};

export default function PrivacyPage() {
  return (
    <HomeLayout {...baseOptions()}>
      <main className="mx-auto max-w-3xl px-6 py-16 prose prose-stone dark:prose-invert">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-cw-terracotta">
          Legal
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
          Privacy policy
        </h1>

        <p className="text-cw-stone-500 dark:text-cw-stone-400 mt-4">
          Last updated: 2026-05-19.
        </p>

        <h2 className="mt-10 text-2xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
          What this policy covers
        </h2>
        <p className="mt-3 text-cw-stone-700 dark:text-cw-stone-300">
          This policy describes how <strong>cartwright.app</strong> handles
          information on this marketing/docs site. It does not apply to
          individual shops built with the Cartwright template — those are owned
          and operated by their respective merchants.
        </p>

        <h2 className="mt-8 text-2xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
          What we collect
        </h2>
        <p className="mt-3 text-cw-stone-700 dark:text-cw-stone-300">
          cartwright.app uses Vercel Analytics and Vercel Speed Insights for
          aggregate, cookie-free traffic measurement. No personally
          identifiable information is collected. No advertising trackers.
          No third-party analytics scripts.
        </p>

        <h2 className="mt-8 text-2xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
          What we do not do
        </h2>
        <ul className="mt-3 text-cw-stone-700 dark:text-cw-stone-300">
          <li>We do not sell, share, or rent visitor data.</li>
          <li>We do not set marketing or advertising cookies.</li>
          <li>We do not track visitors across other sites.</li>
        </ul>

        <h2 className="mt-8 text-2xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
          Contact
        </h2>
        <p className="mt-3 text-cw-stone-700 dark:text-cw-stone-300">
          Questions about this policy: hello@cartwright.app.
        </p>
      </main>
    </HomeLayout>
  );
}
