import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import { contactEmail } from '@/lib/shared';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of use',
  description: 'Terms of use for cartwright.app.',
};

export default function TermsPage() {
  return (
    <HomeLayout {...baseOptions()}>
      <main className="mx-auto max-w-3xl px-6 py-16 prose prose-stone dark:prose-invert">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-cw-terracotta">
          Legal
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
          Terms of use
        </h1>

        <p className="text-cw-stone-500 dark:text-cw-stone-400 mt-4">
          Last updated: 2026-05-19.
        </p>

        <h2 className="mt-10 text-2xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
          The site
        </h2>
        <p className="mt-3 text-cw-stone-700 dark:text-cw-stone-300">
          <strong>cartwright.app</strong> is a documentation and marketing
          site for the Cartwright open-source project. It is provided as-is,
          without warranty of any kind. Content is for informational purposes
          and may change without notice.
        </p>

        <h2 className="mt-8 text-2xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
          The software
        </h2>
        <p className="mt-3 text-cw-stone-700 dark:text-cw-stone-300">
          The <code>create-cartwright</code> CLI and the cartwright-app
          repository are licensed under the{' '}
          <a
            href="https://github.com/Teloz1870/cartwright-app/blob/main/LICENSE"
            className="text-cw-terracotta hover:underline"
          >
            MIT License
          </a>
          . The Cartwright template repository is currently private; sanitised
          public snapshots are published at{' '}
          <a
            href="https://github.com/Teloz1870/cartwright-template"
            className="text-cw-terracotta hover:underline"
          >
            cartwright-template
          </a>
          {' '}under the same MIT license.
        </p>

        <h2 className="mt-8 text-2xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
          Trademarks
        </h2>
        <p className="mt-3 text-cw-stone-700 dark:text-cw-stone-300">
          The name &quot;cartwright&quot; and the cartwright wordmark are unregistered
          marks of Teloz. The MIT license covers code; it does not grant
          permission to use the name to imply official endorsement of forked
          shops.
        </p>

        <h2 className="mt-8 text-2xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
          No warranty
        </h2>
        <p className="mt-3 text-cw-stone-700 dark:text-cw-stone-300">
          The software is provided as-is. The maintainers are not liable for
          damages, lost revenue, or any other consequence of using Cartwright
          in production. Operate it like you operate any commerce stack you
          own: with backups, monitoring, and a deploy strategy.
        </p>

        <h2 className="mt-8 text-2xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
          Contact
        </h2>
        <p className="mt-3 text-cw-stone-700 dark:text-cw-stone-300">
          Questions about these terms:{' '}
          <a href={`mailto:${contactEmail}`} className="text-cw-terracotta">
            {contactEmail}
          </a>
          .
        </p>
      </main>
    </HomeLayout>
  );
}
