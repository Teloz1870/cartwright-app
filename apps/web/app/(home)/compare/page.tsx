import Link from 'next/link';
import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import { COMPARISONS } from '@/lib/comparisons';
import { pageOg } from '@/lib/og';

const COMPARE_DESCRIPTION =
  'How Cartwright — the open-source, AI-first Next.js commerce engine you own — compares to Shopify, Medusa, Vercel Commerce, and WooCommerce.';

export const metadata: Metadata = {
  title: 'Compare Cartwright',
  description: COMPARE_DESCRIPTION,
  alternates: { canonical: '/compare' },
  ...pageOg('Compare Cartwright', COMPARE_DESCRIPTION),
};

export default function CompareHubPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Compare Cartwright',
    url: 'https://cartwright.app/compare',
    description: metadata.description,
    hasPart: COMPARISONS.map((c) => ({
      '@type': 'WebPage',
      name: c.title,
      url: `https://cartwright.app/compare/${c.slug}`,
    })),
  };
  return (
    <>
      <JsonLd data={jsonLd} />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-4xl font-black tracking-tight">Compare Cartwright</h1>
        <p className="mt-4 text-lg text-fd-muted-foreground">
          Cartwright is an open-source, AI-first Next.js commerce engine you own outright. Here is how
          it stacks up against the platforms teams usually weigh it against — named fairly, including
          what each one does better.
        </p>
        <ul className="mt-10 space-y-4">
          {COMPARISONS.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/compare/${c.slug}`}
                className="block rounded-2xl border border-fd-border p-5 transition-colors hover:border-cw-terracotta"
              >
                <span className="font-bold">{c.title}</span>
                <span className="mt-1 block text-sm text-fd-muted-foreground">{c.answer.split('. ')[0]}.</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
