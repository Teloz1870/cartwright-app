import Link from 'next/link';
import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import { USE_CASES } from '@/lib/use-cases';

export const metadata: Metadata = {
  title: 'Use cases',
  description:
    'What you can build with Cartwright — the open-source, AI-first commerce engine: AI-first webshops, agent-commerce, multi-currency European shops, and Shopify migrations.',
  alternates: { canonical: '/use-cases' },
};

export default function UseCasesHubPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Cartwright use cases',
    url: 'https://cartwright.app/use-cases',
    description: metadata.description,
    hasPart: USE_CASES.map((u) => ({
      '@type': 'WebPage',
      name: u.title,
      url: `https://cartwright.app/use-cases/${u.slug}`,
    })),
  };
  return (
    <>
      <JsonLd data={jsonLd} />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-4xl font-black tracking-tight">Use cases</h1>
        <p className="mt-4 text-lg text-fd-muted-foreground">
          Cartwright is one engine that runs as a webshop, a website, or an agent-marketplace. Here are
          the jobs teams reach for it to do.
        </p>
        <ul className="mt-10 space-y-4">
          {USE_CASES.map((u) => (
            <li key={u.slug}>
              <Link
                href={`/use-cases/${u.slug}`}
                className="block rounded-2xl border border-fd-border p-5 transition-colors hover:border-cw-terracotta"
              >
                <span className="font-bold">{u.title}</span>
                <span className="mt-1 block text-sm text-fd-muted-foreground">{u.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
