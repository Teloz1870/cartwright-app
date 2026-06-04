import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import { pageOg } from '@/lib/og';

const GLOSSARY_DESCRIPTION =
  'Plain-English definitions of the AI-commerce terms Cartwright is built around: AEO, GEO, MCP, ACP, A2A, presentment currency, structured data, and llms.txt.';

export const metadata: Metadata = {
  title: 'Commerce & AI Glossary',
  description: GLOSSARY_DESCRIPTION,
  alternates: { canonical: '/glossary' },
  ...pageOg('Commerce & AI Glossary', GLOSSARY_DESCRIPTION),
};

const TERMS: { term: string; def: string }[] = [
  {
    term: 'AEO (Answer Engine Optimization)',
    def: 'Structuring content so AI answer engines (ChatGPT, Perplexity, Google AI Overviews) can extract and quote it directly — answer-first copy, self-contained FAQs, and Schema.org markup.',
  },
  {
    term: 'GEO (Generative Engine Optimization)',
    def: 'Getting your brand and products surfaced and recommended inside AI-generated answers — the AI-era successor to SEO. Cartwright measures AI-citation share over time.',
  },
  {
    term: 'MCP (Model Context Protocol)',
    def: 'An open protocol that lets AI agents discover and call an application’s tools over a typed interface. Cartwright ships an MCP server so agents can run shop operations natively.',
  },
  {
    term: 'ACP (Agentic Commerce Protocol)',
    def: 'Endpoints that let an external buying agent create a checkout session and complete a purchase on a user’s behalf — first-class agent customers, same auth path as humans.',
  },
  {
    term: 'A2A (Agent-to-Agent)',
    def: 'A buyer agent negotiating and transacting with a seller agent — price negotiation, escrow verification, and a signed Agent Card for discovery.',
  },
  {
    term: 'Presentment currency',
    def: 'The currency shown to and charged to the customer at checkout, which may differ from the store’s base accounting currency. Cartwright snapshots it plus the FX rate on the order.',
  },
  {
    term: 'Structured data (JSON-LD)',
    def: 'Machine-readable Schema.org markup embedded in a page so search engines and AI crawlers understand it without executing JavaScript. Cartwright ships it server-side on every citable page.',
  },
  {
    term: 'llms.txt',
    def: 'A plain-text/Markdown file at a site’s root giving AI agents a curated, token-efficient index of the site and what they are permitted to do with it.',
  },
];

function slugify(s: string): string {
  return s.toLowerCase().replace(/\([^)]*\)/g, '').trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function GlossaryPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: 'Cartwright Commerce & AI Glossary',
    url: 'https://cartwright.app/glossary',
    hasDefinedTerm: TERMS.map((t) => ({
      '@type': 'DefinedTerm',
      name: t.term,
      description: t.def,
    })),
  };
  return (
    <>
      <JsonLd data={jsonLd} />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-4xl font-black tracking-tight">Commerce &amp; AI glossary</h1>
        <p className="mt-4 text-lg text-fd-muted-foreground">
          The AI-commerce vocabulary Cartwright is built around.
        </p>
        <dl className="mt-10 space-y-6">
          {TERMS.map((t) => (
            <div key={t.term} id={slugify(t.term)}>
              <dt className="font-bold">{t.term}</dt>
              <dd className="mt-1 text-fd-muted-foreground">{t.def}</dd>
            </div>
          ))}
        </dl>
      </main>
    </>
  );
}
