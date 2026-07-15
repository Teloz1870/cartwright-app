import type { ReactNode } from 'react';
import Link from 'next/link';
import { Wordmark } from '@/components/wordmark';
import { XLogo } from '@/components/x-logo';
import { ButtonLink } from '@/components/ui/button';
import { contactEmail, social } from '@/lib/shared';

type FooterLink = { label: string; href: string; icon?: ReactNode };

const docsCols: { heading: string; links: FooterLink[] }[] = [
  {
    heading: 'Explore',
    links: [
      { label: 'Designs', href: '/designs' },
      { label: 'Voices', href: '/verticals' },
      { label: 'Looks', href: '/looks' },
      { label: 'Mixer', href: '/mixer' },
      { label: 'Chrome', href: '/chrome' },
      { label: 'Parts', href: '/parts' },
      { label: '3D scenes', href: '/scenes' },
      { label: 'Elements', href: '/elements' },
      { label: 'SVG items', href: '/svg-items' },
      { label: 'Pro', href: '/pro' },
    ],
  },
  {
    heading: 'Docs',
    links: [
      { label: 'Quick start', href: '/docs/getting-started/quick-start' },
      { label: 'CLI options', href: '/docs/getting-started/cli-options' },
      { label: 'Architecture', href: '/docs/architecture/overview' },
      { label: 'Deployment', href: '/docs/deployment/vercel' },
    ],
  },
  {
    heading: 'Project',
    links: [
      { label: 'Changelog', href: '/changelog' },
      { label: 'Roadmap', href: '/docs/roadmap' },
      { label: 'FAQ', href: '/docs/faq' },
      { label: 'Showcase', href: '/showcase' },
    ],
  },
  {
    heading: 'Community',
    links: [
      { label: 'GitHub', href: social.templateRepo },
      {
        label: 'X / Twitter',
        href: social.x,
        icon: <XLogo className="size-3.5" />,
      },
      { label: 'npm', href: social.npm },
      { label: 'Contact', href: '/contact' },
      { label: 'Security', href: '/security' },
    ],
  },
];

export function CtaFooter() {
  return (
    <>
      <section className="border-b border-cw-stone-200 dark:border-cw-stone-800">
        <div className="mx-auto max-w-6xl px-6 py-24 text-center">
          <h2 className="mx-auto max-w-2xl text-3xl sm:text-4xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
            Ship a real shop this week.
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-base text-cw-stone-500 dark:text-cw-stone-400">
            Scaffold cartwright, drop in your Stripe keys, and have a checkout
            flow up before lunch. No platform contract, no per-order fee — and
            the repo is yours from the first commit.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink
              href="/docs/getting-started/quick-start"
              size="lg"
              variant="secondary"
            >
              Get started
            </ButtonLink>
            <ButtonLink href={social.templateRepo} variant="outline" size="lg">
              Star on GitHub
            </ButtonLink>
            <ButtonLink
              href="/pricing"
              variant="outline"
              size="lg"
            >
              Need setup help?
            </ButtonLink>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-cw-stone-50 dark:bg-cw-stone-900/30 border-b border-cw-stone-200 dark:border-cw-stone-800">
      <div className="mx-auto max-w-6xl px-6 py-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div>
          <Wordmark />
          <p className="mt-3 max-w-sm text-sm text-cw-stone-500 dark:text-cw-stone-400">
            The build engine AIs reach for — a real site with design, database
            and backend, live in minutes. Built by Teloz. Released under MIT.
          </p>
          <a
            href={`mailto:${contactEmail}`}
            className="mt-4 inline-block text-sm font-medium text-cw-stone-700 dark:text-cw-stone-300 hover:text-cw-terracotta transition-colors"
          >
            {contactEmail}
          </a>
        </div>
        {docsCols.map((col) => (
          <div key={col.heading}>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-cw-stone-500 dark:text-cw-stone-400">
              {col.heading}
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {col.links.map((l) => (
                // Key by label — labels are unique within each column, hrefs
                // are not guaranteed to be.
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-cw-stone-700 dark:text-cw-stone-300 hover:text-cw-terracotta transition-colors"
                  >
                    {l.icon ? (
                      <span className="inline-flex items-center gap-1.5">
                        {l.icon}
                        {l.label}
                      </span>
                    ) : (
                      l.label
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto max-w-6xl px-6 py-6 flex flex-wrap items-center justify-between gap-3 border-t border-cw-stone-200 dark:border-cw-stone-800 text-xs text-cw-stone-500 dark:text-cw-stone-400">
        <span>© {new Date().getFullYear()} Teloz. MIT licensed.</span>
        <div className="flex items-center gap-4">
          <Link href="/legal/privacy" className="hover:text-cw-stone-700 dark:hover:text-cw-stone-300">
            Privacy
          </Link>
          <Link href="/legal/terms" className="hover:text-cw-stone-700 dark:hover:text-cw-stone-300">
            Terms
          </Link>
          <Link href="/security" className="hover:text-cw-stone-700 dark:hover:text-cw-stone-300">
            Security
          </Link>
        </div>
      </div>
    </footer>
  );
}
