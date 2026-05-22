import Link from 'next/link';
import { Wordmark } from '@/components/wordmark';
import { ButtonLink } from '@/components/ui/button';
import { contactEmail, isGithubPublic, social } from '@/lib/shared';

const docsCols = [
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
      { label: 'Discord', href: social.discord },
      { label: 'GitHub', href: social.github },
      { label: 'npm', href: social.npm },
      { label: 'Contact', href: `mailto:${contactEmail}` },
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
            flow up before lunch. No platform contract, no per-order fee.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink
              href="/docs/getting-started/quick-start"
              size="lg"
              variant="secondary"
            >
              Get started
            </ButtonLink>
            <ButtonLink
              href={isGithubPublic ? social.github : social.discord}
              variant="outline"
              size="lg"
            >
              {isGithubPublic ? 'Star on GitHub' : 'Join the Discord'}
            </ButtonLink>
            <ButtonLink
              href="/services"
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
      <div className="mx-auto max-w-6xl px-6 py-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Wordmark />
          <p className="mt-3 max-w-sm text-sm text-cw-stone-500 dark:text-cw-stone-400">
            The AI-first webshop template you actually own. Built by Teloz.
            Released under MIT.
          </p>
        </div>
        {docsCols.map((col) => (
          <div key={col.heading}>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-cw-stone-500 dark:text-cw-stone-400">
              {col.heading}
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-cw-stone-700 dark:text-cw-stone-300 hover:text-cw-terracotta transition-colors"
                  >
                    {l.label}
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
