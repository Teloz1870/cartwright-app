import Link from 'next/link';
import { Section, SectionHeader } from '@/components/landing/section';
import { getComparison, LOVABLE } from '@/lib/comparisons';

/**
 * Landing teaser for the /compare hub. Each one-liner is the first sentence
 * (or two) of the real comparison page's answer — the honest, both-sides
 * version, not a sales line. Keep them in sync with lib/comparisons.ts.
 */
function firstSentences(text: string, count: number): string {
  const parts = text.split('. ');
  return parts.slice(0, count).join('. ') + (parts.length > count ? '.' : '');
}

const shopify = getComparison('shopify');
const createNextApp = getComparison('create-next-app');

const teasers = [
  {
    slug: 'shopify',
    competitor: 'Shopify',
    line: shopify ? firstSentences(shopify.answer, 1) : '',
  },
  {
    slug: 'lovable',
    competitor: 'Lovable',
    line: firstSentences(LOVABLE.answer, 1),
  },
  {
    slug: 'create-next-app',
    competitor: 'create-next-app',
    line: createNextApp ? firstSentences(createNextApp.answer, 1) : '',
  },
];

export function CompareTeaser() {
  return (
    <Section>
      <SectionHeader
        eyebrow="Where it fits"
        title="Compared honestly, both directions."
        description="Every comparison page names what the other tool genuinely does better. Balanced pages get cited; one-sided ones get ignored."
      />
      <div className="mt-12 divide-y divide-cw-stone-200 dark:divide-cw-stone-800 rounded-xl border border-cw-stone-200 dark:border-cw-stone-800 overflow-hidden">
        {teasers.map((t) => (
          <Link
            key={t.slug}
            href={`/compare/${t.slug}`}
            className="group flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-6 bg-cw-paper dark:bg-cw-stone-900/40 px-6 py-5 transition-colors hover:bg-cw-stone-50 dark:hover:bg-cw-stone-900"
          >
            <span className="shrink-0 font-mono text-sm text-cw-stone-900 dark:text-cw-stone-50 sm:w-44">
              vs {t.competitor}
            </span>
            <span className="flex-1 text-sm leading-relaxed text-cw-stone-500 dark:text-cw-stone-400">
              {t.line}
            </span>
            <span
              aria-hidden
              className="hidden sm:block shrink-0 text-cw-stone-300 dark:text-cw-stone-600 transition-colors group-hover:text-cw-terracotta"
            >
              →
            </span>
          </Link>
        ))}
      </div>
      <p className="mt-6 text-sm text-cw-stone-500 dark:text-cw-stone-400">
        <Link
          href="/compare"
          className="font-medium text-cw-terracotta hover:underline"
        >
          All comparisons →
        </Link>{' '}
        Medusa, Vercel Commerce, WooCommerce, Saleor, Wix, v0, Bolt, and more.
      </p>
    </Section>
  );
}
