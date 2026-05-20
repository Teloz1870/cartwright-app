import { HomeLayout } from 'fumadocs-ui/layouts/home';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { SiteFooter } from '@/components/landing/cta-footer';
import { Section, SectionHeader } from '@/components/landing/section';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { baseOptions } from '@/lib/layout.shared';

export const metadata: Metadata = {
  title: 'Showcase',
  description:
    'Northbound Coffee Roasters — a live specialty-coffee storefront built on the Cartwright template. Browse it, check out in Stripe test mode, and talk to the AI Brew Guide.',
};

const buildFacts = [
  {
    term: 'Built on the Cartwright template',
    description: (
      <>
        Scaffolded with{' '}
        <code className="font-mono text-cw-terracotta">
          npx create-cartwright
        </code>
        .
      </>
    ),
  },
  {
    term: 'Stripe test mode',
    description: (
      <>
        Real checkout flow. Pay with test card{' '}
        <code className="font-mono">4242 4242 4242 4242</code>.
      </>
    ),
  },
  {
    term: 'Nightly database reset',
    description: 'Browse, edit, and order freely. The seed restores every night.',
  },
  {
    term: 'AI Brew Guide',
    description:
      'An in-shop chat assistant that recommends beans and pour-over recipes.',
  },
];

const templateFacts = [
  {
    title: 'Custom theme',
    body: (
      <>
        A <code className="font-mono text-cw-terracotta">themes/northbound.css</code>{' '}
        palette: roasted terracotta, espresso brown, paper cream.
      </>
    ),
  },
  {
    title: 'Real content',
    body: 'Coffee products with USD pricing, origin copy, and photography — seeded through the standard admin.',
  },
  {
    title: 'A few bespoke sections',
    body: 'A roast spectrum, a 3-step brew guide, and an origin story — ordinary React sections.',
  },
  {
    title: 'Untouched core',
    body: 'Stripe checkout, magic-link auth, the MCP server, and the AI assistant are stock Cartwright.',
  },
];

function ExternalArrow() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <path d="M6 3h7v7M13 3 4 12" />
    </svg>
  );
}

function BrowserFrame({
  src,
  width,
  height,
  alt,
  sizes,
  className = '',
  frameShadow = 'shadow-2xl',
  glow = false,
}: {
  src: string;
  width: number;
  height: number;
  alt: string;
  sizes: string;
  className?: string;
  frameShadow?: 'shadow-2xl' | 'shadow-xl';
  glow?: boolean;
}) {
  return (
    <div className={`relative ${className}`}>
      <div
        className={`rounded-xl border border-cw-stone-200 dark:border-cw-stone-800 bg-cw-paper dark:bg-cw-stone-900 ${frameShadow} shadow-cw-stone-900/10 overflow-hidden`}
      >
        <div className="flex items-center gap-2 border-b border-cw-stone-200 dark:border-cw-stone-800 bg-cw-stone-100/60 dark:bg-cw-stone-900 px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-cw-stone-300 dark:bg-cw-stone-700" />
          <span className="size-2.5 rounded-full bg-cw-stone-300 dark:bg-cw-stone-700" />
          <span className="size-2.5 rounded-full bg-cw-stone-300 dark:bg-cw-stone-700" />
          <div className="ml-3 flex-1 rounded-md bg-cw-paper dark:bg-cw-ink border border-cw-stone-200 dark:border-cw-stone-800 px-2.5 py-1 text-[11px] font-mono text-cw-stone-500 dark:text-cw-stone-400">
            demo.cartwright.app
          </div>
        </div>
        <Image
          src={src}
          width={width}
          height={height}
          sizes={sizes}
          alt={alt}
          className="w-full h-auto block"
        />
      </div>
      {glow && (
        <div
          aria-hidden
          className="absolute -inset-6 -z-10 bg-gradient-to-tr from-cw-terracotta/0 via-cw-terracotta/10 to-cw-oker/10 blur-3xl"
        />
      )}
    </div>
  );
}

export default function ShowcasePage() {
  return (
    <HomeLayout {...baseOptions()}>
      <div className="flex-1 bg-cw-paper dark:bg-cw-ink text-cw-stone-700 dark:text-cw-stone-300">
        <Section className="relative overflow-hidden">
          <div aria-hidden className="absolute inset-0 cw-grid-bg" />
          <div className="relative mx-auto max-w-2xl text-center">
            <Badge tone="terracotta" className="mb-6">
              <span className="size-1.5 rounded-full bg-cw-terracotta" />
              First shop is live
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50 leading-[1.05]">
              Shops built with Cartwright.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-cw-stone-500 dark:text-cw-stone-400 leading-relaxed">
              The showcase starts with a real one.{' '}
              <strong className="font-semibold text-cw-stone-700 dark:text-cw-stone-300">
                Northbound Coffee Roasters
              </strong>{' '}
              is a live specialty-coffee storefront — scaffolded from the
              Cartwright template, themed, and shipped. Browse it, run a checkout
              in Stripe test mode, and ask its AI Brew Guide for a pour-over
              recipe.
            </p>
          </div>
        </Section>

        <Section className="bg-cw-stone-50 dark:bg-cw-stone-900/30">
          <SectionHeader
            eyebrow="Featured shop"
            title="Northbound Coffee Roasters"
            description="A specialty-coffee storefront with a warm editorial design — roasted-terracotta accent, espresso-brown headings, paper-cream backgrounds. Genuine Cartwright underneath: real product pages, Stripe checkout, and an AI assistant."
          />
          <div className="mt-12 grid gap-12 lg:grid-cols-[1.25fr_1fr] items-start">
            <div>
              <BrowserFrame
                src="/showcase/northbound-hero.jpg"
                width={2880}
                height={1800}
                sizes="(min-width: 1024px) 56vw, 100vw"
                alt="Northbound Coffee Roasters storefront hero in a browser frame"
                glow
              />
              <BrowserFrame
                src="/showcase/northbound-products.jpg"
                width={2880}
                height={1620}
                sizes="(min-width: 1024px) 56vw, 100vw"
                alt="Northbound Coffee Roasters featured products grid in a browser frame"
                className="mt-5"
                frameShadow="shadow-xl"
              />
            </div>

            <Card>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-cw-terracotta">
                The build
              </p>
              <ul className="mt-4 space-y-3.5">
                {buildFacts.map((fact) => (
                  <li key={fact.term} className="flex gap-3">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-cw-terracotta" />
                    <div>
                      <p className="text-sm font-semibold text-cw-stone-900 dark:text-cw-stone-50">
                        {fact.term}
                      </p>
                      <p className="text-sm text-cw-stone-500 dark:text-cw-stone-400">
                        {fact.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-6 border-t border-cw-stone-200 dark:border-cw-stone-800" />
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <ButtonLink
                  href="https://demo.cartwright.app"
                  size="lg"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit the live demo
                  <ExternalArrow />
                </ButtonLink>
              </div>
              <div className="mt-3">
                <Badge tone="oker">test mode — nightly reset</Badge>
              </div>
            </Card>
          </div>
        </Section>

        <Section>
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-cw-terracotta">
              No special sauce
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
              It&apos;s the same template you scaffold.
            </h2>
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-cw-stone-500 dark:text-cw-stone-400">
              Northbound isn&apos;t a one-off agency build. It&apos;s a stock
              Cartwright app — the exact thing{' '}
              <code className="font-mono text-cw-terracotta">
                npx create-cartwright
              </code>{' '}
              gives you — with a theme, real content, and a few bespoke sections
              layered on top.
            </p>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-cw-stone-200 dark:border-cw-stone-800 bg-cw-stone-200 dark:bg-cw-stone-800 sm:grid-cols-2 lg:grid-cols-4">
            {templateFacts.map((fact) => (
              <div
                key={fact.title}
                className="bg-cw-paper dark:bg-cw-stone-900/40 p-6"
              >
                <span className="size-1.5 rounded-full bg-cw-terracotta block mb-3" />
                <p className="text-sm font-semibold text-cw-stone-900 dark:text-cw-stone-50">
                  {fact.title}
                </p>
                <p className="mt-2 text-sm text-cw-stone-500 dark:text-cw-stone-400">
                  {fact.body}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-cw-stone-500 dark:text-cw-stone-400">
            Everything Northbound did, you can do{' '}
            <Link
              href="/docs/getting-started/quick-start"
              className="text-cw-terracotta hover:text-cw-terracotta-strong underline underline-offset-2"
            >
              from the docs
            </Link>
            .
          </p>
        </Section>

        <Section className="bg-cw-stone-50 dark:bg-cw-stone-900/30">
          <div className="rounded-xl border border-cw-stone-200 dark:border-cw-stone-800 bg-cw-paper dark:bg-cw-stone-900/40 p-8 sm:p-10 text-center">
            <div className="max-w-2xl mx-auto">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-cw-terracotta">
                Add yours
              </p>
              <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
                Shipped a shop with Cartwright?
              </h2>
              <p className="mt-4 text-base text-cw-stone-500 dark:text-cw-stone-400 leading-relaxed">
                We&apos;d like to feature it. Open a GitHub issue with your URL
                and a screenshot, or post it in the Discord. Real builds only —
                live shops, not localhost.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <ButtonLink href="/github" variant="outline" size="md">
                  Submit your shop
                </ButtonLink>
                <ButtonLink href="/discord" variant="ghost" size="md">
                  Join the Discord
                </ButtonLink>
              </div>
              <p className="mt-6 text-xs text-cw-stone-500 dark:text-cw-stone-400">
                One shop today. As more real builds ship, this page grows into a
                grid.
              </p>
            </div>
          </div>
        </Section>

        <Section>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
              Build your own.
            </h2>
            <p className="mt-4 max-w-xl mx-auto text-base text-cw-stone-500 dark:text-cw-stone-400">
              Northbound went from{' '}
              <code className="font-mono text-cw-terracotta">
                npx create-cartwright
              </code>{' '}
              to a live, charging storefront. Yours can too — the quick start
              walks the whole path.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <ButtonLink href="/docs/getting-started/quick-start" size="lg">
                Read the quick start
              </ButtonLink>
              <ButtonLink
                href="https://demo.cartwright.app"
                variant="outline"
                size="lg"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open the demo
                <ExternalArrow />
              </ButtonLink>
            </div>
          </div>
        </Section>

        <SiteFooter />
      </div>
    </HomeLayout>
  );
}
