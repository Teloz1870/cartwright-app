import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { CopyCommand } from '@/components/landing/copy-command';
import { ContactForm } from '@/components/landing/contact-form';
import { contactEmail, social } from '@/lib/shared';
import { Mail, Code2, Star, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Contact',
  description:
    'Talk to a human at Cartwright. Setup help, partnerships, press, security disclosures — anything that does not fit a GitHub issue.',
};

const altContacts = [
  {
    icon: Mail,
    label: 'Direct email',
    detail: contactEmail,
    href: `mailto:${contactEmail}`,
    external: false,
  },
  {
    icon: Code2,
    label: 'GitHub Issues',
    detail: 'Bug reports + docs corrections',
    href: social.github,
    external: true,
  },
  {
    icon: Star,
    label: 'Engine on GitHub',
    detail: 'cartwright-template — public + MIT',
    href: social.templateRepo,
    external: true,
  },
  {
    icon: ShieldCheck,
    label: 'Security disclosures',
    detail: 'Coordinated vulnerability reporting',
    href: '/security',
    external: false,
  },
];

export default function ContactPage() {
  return (
    <main className="relative min-h-screen overflow-hidden pb-32">
      <div aria-hidden className="absolute inset-0 cw-grid-bg opacity-50" />

      <div className="relative mx-auto max-w-6xl px-6 pt-24 sm:pt-32">
        {/* Hero */}
        <div className="flex flex-col items-center text-center">
          <Badge tone="terracotta" className="mb-6">
            <span className="size-1.5 rounded-full bg-cw-terracotta" />
            Contact
          </Badge>
          <h1 className="max-w-3xl text-4xl sm:text-5xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
            Talk to a human.{' '}
            <span className="relative inline-block text-cw-terracotta">
              <span className="relative z-10">Or write.</span>
              <span
                aria-hidden
                className="absolute inset-x-0 -bottom-1 h-3 bg-cw-terracotta/20 dark:bg-cw-terracotta/30 -z-0"
              />
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-base sm:text-lg text-cw-stone-500 dark:text-cw-stone-400">
            Setup help, partnerships, press, security disclosures — anything
            that does not fit a GitHub issue. We reply within 48 hours
            (usually faster).
          </p>
        </div>

        {/* Form + alt-contacts */}
        <div className="mt-16 sm:mt-20 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          {/* Form column */}
          <div className="rounded-3xl border border-cw-stone-200 dark:border-cw-stone-800 bg-cw-stone-50/50 dark:bg-cw-stone-900/50 backdrop-blur-sm p-8 sm:p-10">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-cw-terracotta">
              Write us
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
              Send a message
            </h2>
            <p className="mt-3 text-sm text-cw-stone-500 dark:text-cw-stone-400 mb-6">
              The more context you give, the faster we can be useful. Code
              snippets and screenshots welcome.
            </p>
            <ContactForm />
          </div>

          {/* Alt-contacts column */}
          <div className="space-y-4">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-cw-terracotta">
              Other ways to reach us
            </p>
            <ul className="space-y-3">
              {altContacts.map((c) => (
                <li key={c.label}>
                  <a
                    href={c.href}
                    target={c.external ? '_blank' : undefined}
                    rel={c.external ? 'noopener noreferrer' : undefined}
                    className="flex items-start gap-4 rounded-2xl border border-cw-stone-200 dark:border-cw-stone-800 bg-cw-stone-50/30 dark:bg-cw-stone-900/30 p-5 transition-all hover:border-cw-stone-300 dark:hover:border-cw-stone-700 hover:bg-cw-stone-50/60 dark:hover:bg-cw-stone-900/60"
                  >
                    <div className="size-10 shrink-0 rounded-lg bg-cw-terracotta/10 text-cw-terracotta flex items-center justify-center">
                      <c.icon className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-cw-stone-900 dark:text-cw-stone-50">
                        {c.label}
                      </p>
                      <p className="mt-0.5 text-sm text-cw-stone-500 dark:text-cw-stone-400 break-words">
                        {c.detail}
                      </p>
                    </div>
                  </a>
                </li>
              ))}
            </ul>

            <p className="text-xs text-cw-stone-500 dark:text-cw-stone-400 pt-2">
              For bug reports, GitHub Issues is the fastest path — it&apos;s where
              we live during the day.
            </p>
          </div>
        </div>

        {/* CTA footer */}
        <div className="mt-24 sm:mt-32 flex flex-col items-center text-center">
          <h2 className="max-w-2xl text-3xl sm:text-4xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
            Or scaffold a shop right now.
          </h2>
          <p className="mt-4 max-w-xl text-base text-cw-stone-500 dark:text-cw-stone-400">
            Self-hosted, free, MIT. Start exploring before you write — we&apos;ll be
            here when you have specific questions.
          </p>
          <div className="mt-8 w-full max-w-xl">
            <CopyCommand command="npx create-cartwright@latest my-shop" />
          </div>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <ButtonLink href="/docs/getting-started/quick-start" size="lg">
              Read the docs
            </ButtonLink>
            <ButtonLink href="/pricing" variant="outline" size="lg">
              See pricing
            </ButtonLink>
          </div>
        </div>
      </div>
    </main>
  );
}
