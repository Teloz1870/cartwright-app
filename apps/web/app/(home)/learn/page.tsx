import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { Section, SectionHeader } from '@/components/landing/section';
import { BrandLogo } from '@/components/landing/brand-logo';
import { ArrowRight, GitBranch, Rocket, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Learn — from idea to live shop',
  description:
    'Never used GitHub or deployed a website? This is the friendly, no-terminal path from a scaffolded Cartwright shop to a live store on GitHub + Vercel — the free stack you own.',
};

const JOURNEY: { n: string; title: string; body: string }[] = [
  {
    n: '0',
    title: 'Scaffold your shop',
    body: 'One command — `npx create-cartwright` — gives you a complete shop on your computer. Products, cart, checkout, admin, all of it.',
  },
  {
    n: '1',
    title: 'Get on GitHub',
    body: 'Create a free GitHub account and install one friendly app (GitHub Desktop). GitHub is the home — and backup with full history — for your code.',
  },
  {
    n: '2',
    title: 'Publish your shop',
    body: 'Click “Publish repository”. Your code is now safely on GitHub, private, with every version remembered so you can always undo.',
  },
  {
    n: '3',
    title: 'Connect Vercel',
    body: 'Sign in to Vercel with GitHub, import your repo, and it builds your shop into a real website — with its own live URL — in about a minute.',
  },
  {
    n: '4',
    title: 'The everyday loop',
    body: 'Change something → see it on its own preview URL → publish when it looks right. Your live shop is never at risk while you experiment.',
  },
  {
    n: '5',
    title: 'Your own domain',
    body: 'Point yourshop.com at it. You’re live, you own the whole stack, and there’s no monthly rent to anyone.',
  },
];

const WHY: { icon: typeof GitBranch; title: string; body: string }[] = [
  {
    icon: ShieldCheck,
    title: 'You own everything',
    body: 'The code, the database, the customers. GitHub + Vercel both have a free plan that never expires. No lock-in, no per-order fees.',
  },
  {
    icon: GitBranch,
    title: 'A safety net by default',
    body: 'Every change is a save point. Preview it in isolation, and roll back instantly if anything looks off. Nothing breaks your live store by surprise.',
  },
  {
    icon: Rocket,
    title: 'Publish by saving',
    body: 'Once connected, putting a change live is just “save to GitHub”. Vercel rebuilds your shop automatically. That’s the whole deploy step.',
  },
];

export default function LearnPage() {
  return (
    <main className="relative min-h-screen pb-32">
      {/* Hero */}
      <Section>
        <div className="max-w-3xl">
          <Badge>Beginner-friendly · no terminal required</Badge>
          <h1 className="mt-5 text-4xl sm:text-6xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
            From idea to a live shop.
          </h1>
          <p className="mt-6 text-lg sm:text-xl leading-relaxed text-cw-stone-500 dark:text-cw-stone-400">
            Never used GitHub or deployed a website before? Good — this is for you. We’ll take you
            from a shop on your laptop to a real store on the internet, using{' '}
            <strong className="text-cw-stone-900 dark:text-cw-stone-50">GitHub</strong> and{' '}
            <strong className="text-cw-stone-900 dark:text-cw-stone-50">Vercel</strong>: the free
            stack you fully own. Every step has a point-and-click path.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <ButtonLink href="/docs/getting-started/from-code-to-live">
              Start the guide <ArrowRight className="ml-1 inline size-4" />
            </ButtonLink>
            <ButtonLink href="/docs/getting-started/quick-start" variant="outline">
              Scaffold a shop first
            </ButtonLink>
          </div>
          <div className="mt-8 flex items-center gap-3 text-sm text-cw-stone-500 dark:text-cw-stone-400">
            <span>Powered by</span>
            <BrandLogo brand="github" size={22} />
            <span className="font-medium text-cw-stone-700 dark:text-cw-stone-300">GitHub</span>
            <span className="text-cw-stone-300 dark:text-cw-stone-700">+</span>
            <BrandLogo brand="vercel" size={22} />
            <span className="font-medium text-cw-stone-700 dark:text-cw-stone-300">Vercel</span>
          </div>
        </div>
      </Section>

      {/* The journey */}
      <Section>
        <SectionHeader
          eyebrow="The journey"
          title="Six steps from your laptop to live"
          description="You only learn this once. After that, changing your shop is a thirty-second habit."
        />
        <ol className="mt-12 grid gap-px overflow-hidden rounded-xl border border-cw-stone-200 dark:border-cw-stone-800 bg-cw-stone-200 dark:bg-cw-stone-800 sm:grid-cols-2 lg:grid-cols-3">
          {JOURNEY.map((s) => (
            <li
              key={s.n}
              className="bg-cw-paper dark:bg-cw-stone-900/40 p-6 transition-colors hover:bg-cw-stone-50 dark:hover:bg-cw-stone-900"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-full bg-cw-terracotta/10 font-mono text-sm font-semibold text-cw-terracotta">
                  {s.n}
                </span>
                <h3 className="text-sm font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
                  {s.title}
                </h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-cw-stone-500 dark:text-cw-stone-400">
                {s.body}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Why this stack */}
      <Section>
        <SectionHeader
          eyebrow="Why GitHub + Vercel"
          title="The free stack you own"
          description="Not a SaaS you rent — the infrastructure the rest of the web runs on, on its generous free tier."
        />
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {WHY.map((w) => (
            <div key={w.title}>
              <w.icon className="size-6 text-cw-terracotta" />
              <h3 className="mt-4 text-base font-semibold text-cw-stone-900 dark:text-cw-stone-50">
                {w.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-cw-stone-500 dark:text-cw-stone-400">
                {w.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section className="border-b-0">
        <div className="rounded-2xl border border-cw-stone-200 dark:border-cw-stone-800 bg-cw-stone-50 dark:bg-cw-stone-900/40 p-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
            Ready when you are.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-cw-stone-500 dark:text-cw-stone-400">
            Create your free accounts, then follow the step-by-step guide. You’ll be live today.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <ButtonLink href="/docs/getting-started/from-code-to-live">
              Open the guide <ArrowRight className="ml-1 inline size-4" />
            </ButtonLink>
            <Link
              href="https://github.com/signup"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-cw-stone-300 dark:border-cw-stone-700 px-4 py-2 text-sm font-medium text-cw-stone-700 dark:text-cw-stone-300 transition-colors hover:bg-cw-stone-100 dark:hover:bg-cw-stone-800"
            >
              <BrandLogo brand="github" size={18} /> Create a GitHub account
            </Link>
            <Link
              href="https://vercel.com/signup"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-cw-stone-300 dark:border-cw-stone-700 px-4 py-2 text-sm font-medium text-cw-stone-700 dark:text-cw-stone-300 transition-colors hover:bg-cw-stone-100 dark:hover:bg-cw-stone-800"
            >
              <BrandLogo brand="vercel" size={18} /> Create a Vercel account
            </Link>
          </div>
        </div>
      </Section>
    </main>
  );
}
