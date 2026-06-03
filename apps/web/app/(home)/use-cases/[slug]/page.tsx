import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import { USE_CASES, getUseCase } from '@/lib/use-cases';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return USE_CASES.map((u) => ({ slug: u.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const u = getUseCase(slug);
  if (!u) return {};
  return {
    title: u.title,
    description: u.description,
    alternates: { canonical: `/use-cases/${u.slug}` },
    openGraph: {
      title: u.title,
      description: u.description,
      url: `https://cartwright.app/use-cases/${u.slug}`,
      type: 'article',
    },
  };
}

export default async function UseCasePage({ params }: Props) {
  const { slug } = await params;
  const u = getUseCase(slug);
  if (!u) notFound();

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: u.title,
      description: u.description,
      author: { '@type': 'Organization', name: 'Cartwright' },
      publisher: { '@type': 'Organization', name: 'Cartwright', url: 'https://cartwright.app' },
      mainEntityOfPage: { '@type': 'WebPage', '@id': `https://cartwright.app/use-cases/${u.slug}` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: u.faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Use cases', item: 'https://cartwright.app/use-cases' },
        { '@type': 'ListItem', position: 2, name: u.title, item: `https://cartwright.app/use-cases/${u.slug}` },
      ],
    },
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <nav className="mb-6 text-sm text-fd-muted-foreground">
          <Link href="/use-cases" className="hover:underline">Use cases</Link>
          <span className="mx-2">/</span>
          <span>{u.title}</span>
        </nav>

        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{u.title}</h1>
        <p className="mt-6 text-lg leading-relaxed text-fd-muted-foreground">{u.answer}</p>

        <div className="mt-10 space-y-6">
          {u.points.map((p) => (
            <div key={p.heading} className="rounded-2xl border border-fd-border p-5">
              <h2 className="font-bold">{p.heading}</h2>
              <p className="mt-1 text-fd-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>

        <section className="mt-12">
          <h2 className="text-2xl font-black">Frequently asked</h2>
          <dl className="mt-6 space-y-6">
            {u.faq.map((f) => (
              <div key={f.q}>
                <dt className="font-bold">{f.q}</dt>
                <dd className="mt-1 text-fd-muted-foreground">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-12 rounded-2xl border border-fd-border p-6">
          <h2 className="text-xl font-black">Start in one command</h2>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-fd-muted px-4 py-3 text-sm">
            <code>npx create-cartwright@latest my-shop</code>
          </pre>
          <p className="mt-3 text-sm text-fd-muted-foreground">
            See the <Link href="/docs" className="text-cw-terracotta hover:underline">docs</Link> or{' '}
            <Link href="/compare" className="text-cw-terracotta hover:underline">compare Cartwright</Link>.
          </p>
        </section>
      </main>
    </>
  );
}
