import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import { COMPARISONS, getComparison } from '@/lib/comparisons';
import { ogImageUrl } from '@/lib/og';

type Props = { params: Promise<{ competitor: string }> };

export function generateStaticParams() {
  return COMPARISONS.map((c) => ({ competitor: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { competitor } = await params;
  const c = getComparison(competitor);
  if (!c) return {};
  const og = ogImageUrl(c.title, c.description);
  return {
    title: c.title,
    description: c.description,
    alternates: { canonical: `/compare/${c.slug}` },
    openGraph: {
      title: c.title,
      description: c.description,
      url: `https://cartwright.app/compare/${c.slug}`,
      type: 'article',
      images: [{ url: og, width: 1200, height: 630, alt: c.title }],
    },
    twitter: { card: 'summary_large_image', title: c.title, description: c.description, images: [og] },
  };
}

export default async function ComparePage({ params }: Props) {
  const { competitor } = await params;
  const c = getComparison(competitor);
  if (!c) notFound();

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: c.title,
      description: c.description,
      author: { '@type': 'Organization', name: 'Cartwright' },
      publisher: { '@type': 'Organization', name: 'Cartwright', url: 'https://cartwright.app' },
      mainEntityOfPage: { '@type': 'WebPage', '@id': `https://cartwright.app/compare/${c.slug}` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: c.faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Compare', item: 'https://cartwright.app/compare' },
        { '@type': 'ListItem', position: 2, name: c.title, item: `https://cartwright.app/compare/${c.slug}` },
      ],
    },
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      {/* w-full: this main is a flex item in the home layout's column-flex
          chain; with mx-auto alone it sizes to min-content (the install
          <pre> inside the padded section floors that at ~416px), stretching
          the whole page on narrow screens. w-full pins it to the viewport. */}
      <main className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6">
        <nav className="mb-6 text-sm text-fd-muted-foreground">
          <Link href="/compare" className="hover:underline">Compare</Link>
          <span className="mx-2">/</span>
          <span>{c.title}</span>
        </nav>

        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{c.title}</h1>

        {/* Answer-first lede — the paragraph AI engines quote. */}
        <p className="mt-6 text-lg leading-relaxed text-fd-muted-foreground">{c.answer}</p>

        {/* max-w cap: the home layout's column-flex chain sizes ancestors by
            min-content, so without a viewport-derived cap the table's
            min-content width stretches the whole page on narrow screens
            instead of scrolling inside this wrapper. */}
        <div className="mt-10 max-w-[calc(100vw-2rem)] overflow-x-auto rounded-2xl border border-fd-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-fd-muted/50">
              <tr>
                <th className="px-4 py-3 font-bold">Dimension</th>
                <th className="px-4 py-3 font-bold text-cw-terracotta">Cartwright</th>
                <th className="px-4 py-3 font-bold">{c.competitor}</th>
              </tr>
            </thead>
            <tbody>
              {c.rows.map((row) => (
                <tr key={row.dimension} className="border-t border-fd-border align-top">
                  <td className="px-4 py-3 font-semibold">{row.dimension}</td>
                  <td className="px-4 py-3">{row.cartwright}</td>
                  <td className="px-4 py-3 text-fd-muted-foreground">{row.them}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="mt-12">
          <h2 className="text-2xl font-black">Frequently asked</h2>
          <dl className="mt-6 space-y-6">
            {c.faq.map((f) => (
              <div key={f.q}>
                <dt className="font-bold">{f.q}</dt>
                <dd className="mt-1 text-fd-muted-foreground">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-12 rounded-2xl border border-fd-border p-6">
          <h2 className="text-xl font-black">Try it in one command</h2>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-fd-muted px-4 py-3 text-sm">
            <code>npx create-cartwright@latest my-shop</code>
          </pre>
          <p className="mt-3 text-sm text-fd-muted-foreground">
            MIT-licensed. Read the{' '}
            <Link href="/docs" className="text-cw-terracotta hover:underline">docs</Link> or see the{' '}
            <Link href="/compare" className="text-cw-terracotta hover:underline">full comparison hub</Link>.
          </p>
        </section>
      </main>
    </>
  );
}
