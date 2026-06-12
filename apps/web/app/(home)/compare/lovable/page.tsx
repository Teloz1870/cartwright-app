import Link from 'next/link';
import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import { CopyCommand } from '@/components/landing/copy-command';
import { LOVABLE } from '@/lib/comparisons';
import { pageOg } from '@/lib/og';

/**
 * "Graduate from Lovable" — a dedicated comparison landing page.
 *
 * Unlike the generic /compare/[competitor] template, this page captures a
 * specific moment: a Lovable user who hit the platform ceiling (wants code
 * ownership, real commerce, no credit metering) and is searching for what
 * comes next. Tone contract: factual and generous — Lovable is genuinely
 * great at the zero-install prompt-to-app moment; Cartwright is where you
 * go when you need to own it. Never punch down.
 *
 * Comparison data (table rows, FAQ, answer-first lede) lives in
 * lib/comparisons.ts (LOVABLE); the landing-only copy (hero, stay-vs-
 * graduate, design-import note) lives here.
 */

export const metadata: Metadata = {
  title: LOVABLE.title,
  description: LOVABLE.description,
  alternates: { canonical: '/compare/lovable' },
  ...pageOg(LOVABLE.title, LOVABLE.description),
};

const STAY = [
  {
    title: 'You are validating an idea',
    body: 'Nothing beats prompt-to-working-app in the browser for a prototype or an MVP you might throw away next week. Zero install, zero ops, instant share link.',
  },
  {
    title: 'You never want to touch a repo',
    body: 'If a terminal, Node, and git are things you actively do not want in your life, Lovable’s hosted-everything model is the better home — full stop.',
  },
  {
    title: 'You want managed everything',
    body: 'Lovable Cloud runs the database, auth, and storage for you, and Visual Edits let you polish copy and styling for free, without spending credits.',
  },
] as const;

const GRADUATE = [
  {
    title: 'You want to own the code',
    body: 'Cartwright scaffolds an MIT-licensed engine into your own repo. There is no platform underneath — the repository is the product, from the first commit.',
  },
  {
    title: 'You are running a real shop',
    body: 'Orders, Stripe checkout, VAT and Stripe Tax, shipping zones, GDPR tooling, multi-currency — a commerce engine you configure with flags, not features you re-prompt into existence.',
  },
  {
    title: 'You want to stop paying per AI message',
    body: 'Bring the agent you already use — Claude Code, Cursor, Copilot, Gemini CLI — with your own API key. The engine meters nothing; you pay your provider at cost.',
  },
  {
    title: 'You want AI search to see you',
    body: 'Server-rendered pages, JSON-LD on every citable page, llms.txt. Client-rendered apps are largely invisible to AI crawlers — a shop that wants to be cited needs server HTML.',
  },
] as const;

export default function LovableComparePage() {
  const c = LOVABLE;

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
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <nav className="mb-6 text-sm text-fd-muted-foreground">
          <Link href="/compare" className="hover:underline">Compare</Link>
          <span className="mx-2">/</span>
          <span>{c.title}</span>
        </nav>

        {/* Hero — the graduation frame. */}
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
          Loved building on Lovable? Keep going — <span className="text-cw-terracotta">and own it.</span>
        </h1>

        {/* Answer-first lede — the paragraph AI engines quote. */}
        <p className="mt-6 text-lg leading-relaxed text-fd-muted-foreground">{c.answer}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <CopyCommand command="npx create-cartwright@latest my-shop" className="sm:max-w-lg" />
          <a
            href="#differences"
            className="inline-flex h-14 shrink-0 items-center justify-center rounded-lg border border-fd-border px-5 font-semibold transition-colors hover:border-cw-terracotta hover:text-cw-terracotta"
          >
            See how they differ
          </a>
        </div>

        {/* The honest table. */}
        <section id="differences" className="mt-16 scroll-mt-24">
          <h2 className="text-2xl font-black">How they differ</h2>
          <p className="mt-2 text-fd-muted-foreground">
            Both columns are written to be fair. Where Lovable is better, the table says so.
          </p>
          {/* max-w cap: the home layout's column-flex chain sizes ancestors by
              min-content, so without a viewport-derived cap the table's
              min-content width stretches the whole page on narrow screens
              instead of scrolling inside this wrapper. */}
          <div className="mt-6 max-w-[calc(100vw-2rem)] overflow-x-auto rounded-2xl border border-fd-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-fd-muted/50">
                <tr>
                  <th className="px-4 py-3 font-bold">Dimension</th>
                  <th className="px-4 py-3 font-bold text-cw-terracotta">Cartwright</th>
                  <th className="px-4 py-3 font-bold">Lovable</th>
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
          <p className="mt-3 text-xs text-fd-muted-foreground">
            Lovable details current as of June 2026 — their pricing and features move quickly; check{' '}
            <a
              href="https://lovable.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-cw-terracotta"
            >
              lovable.dev
            </a>{' '}
            for today’s numbers.
          </p>
        </section>

        {/* Stay vs graduate — the honest fork. */}
        <section className="mt-16">
          <h2 className="text-2xl font-black">Stay, or graduate?</h2>
          <p className="mt-2 text-fd-muted-foreground">
            Lovable is one of the fastest-growing app builders ever — reportedly in the hundreds of
            millions in annual revenue by 2026 — and it earned that at the idea-to-app moment. The
            question is not which product is better; it is which stage you are at.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-fd-border p-6">
              <h3 className="font-black">Stay on Lovable when…</h3>
              <ul className="mt-4 space-y-4">
                {STAY.map((item) => (
                  <li key={item.title}>
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm text-fd-muted-foreground">{item.body}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-cw-terracotta/50 p-6">
              <h3 className="font-black text-cw-terracotta">Graduate to Cartwright when…</h3>
              <ul className="mt-4 space-y-4">
                {GRADUATE.map((item) => (
                  <li key={item.title}>
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm text-fd-muted-foreground">{item.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Bring your design with you — the migration softener. */}
        <section className="mt-16 rounded-2xl border border-fd-border p-6">
          <h2 className="text-xl font-black">Bring your design with you</h2>
          <p className="mt-3 text-fd-muted-foreground">
            You do not have to start from a blank theme. Paste your Lovable app’s URL into
            Cartwright’s design import and it derives your color palette and typography hints, then
            applies them as the live theme in one click — so your new site opens looking like the
            app you already love. It transfers the design vibe (colors, typography, tone), not the
            layout or code, and uses Firecrawl under the hood (bring your own key). From there,
            currently 28 design packs, 8 industry voices, and 9 in-repo plugins are yours to mix —
            or let your agent build something custom.
          </p>
        </section>

        {/* FAQ */}
        <section className="mt-16">
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

        {/* Closing CTA */}
        <section className="mt-16 rounded-2xl border border-fd-border p-6">
          <h2 className="text-xl font-black">Graduate in one command</h2>
          <div className="mt-4">
            <CopyCommand command="npx create-cartwright@latest my-shop" size="md" className="sm:max-w-lg" />
          </div>
          <p className="mt-3 text-sm text-fd-muted-foreground">
            MIT-licensed; the repo it creates is yours. Read the{' '}
            <Link href="/docs" className="text-cw-terracotta hover:underline">docs</Link> or see the{' '}
            <Link href="/compare" className="text-cw-terracotta hover:underline">full comparison hub</Link>.
          </p>
        </section>
      </main>
    </>
  );
}
