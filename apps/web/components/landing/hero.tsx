import Link from 'next/link';
import { ButtonLink } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CopyCommand } from '@/components/landing/copy-command';
import { social } from '@/lib/shared';
import { getEngineVersion } from '@/lib/engine';

export async function Hero() {
  // Live engine version from the engine CHANGELOG (ISR-cached, fail-soft) —
  // the same maintained source the /changelog header uses. Never hardcode a
  // version here; it drifts the moment a release ships.
  const engineVersion = await getEngineVersion();
  return (
    <section className="relative overflow-hidden border-b border-cw-stone-200 dark:border-cw-stone-800">
      <div aria-hidden className="absolute inset-0 cw-grid-bg" />
      <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="flex flex-col items-center text-center">
          <Badge tone="terracotta" className="mb-6">
            <span className="size-1.5 rounded-full bg-cw-terracotta" />
            Open source · engine v{engineVersion}
          </Badge>
          <h1 className="max-w-3xl text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50 leading-[1.05]">
            The build engine AIs{' '}
            <span className="relative inline-block">
              <span className="relative z-10">reach for.</span>
              <span
                aria-hidden
                className="absolute inset-x-0 -bottom-1 h-3 bg-cw-terracotta/20 dark:bg-cw-terracotta/30 -z-0"
              />
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-base sm:text-lg text-cw-stone-500 dark:text-cw-stone-400 leading-relaxed">
            Generating a site is becoming free — owning and{' '}
            <span className="font-semibold text-cw-stone-900 dark:text-cw-stone-50">operating</span>{' '}
            a real business is the hard part. Cartwright is an open-source
            Next.js 16 engine scaffolded into a repo you own: design, database,
            checkout, and an admin your AI can operate. One{' '}
            <span className="font-mono text-xs text-cw-terracotta">brand.mode</span>{' '}
            flag ships it as a corporate site, a webshop, or an agent
            storefront — selling to people on their phones and to buyer agents
            reading your{' '}
            <span className="font-mono text-xs">/llms.txt</span>.
          </p>
          <p className="mt-3 text-xs sm:text-sm text-cw-terracotta font-mono">
            ↓ click the mic to try voice shopping
          </p>

          <div className="mt-10 w-full max-w-2xl">
            <CopyCommand command="npx create-cartwright@latest my-shop" />
          </div>

          <p className="mt-3 text-xs sm:text-sm text-cw-stone-500 dark:text-cw-stone-400 font-mono">
            Measured cold run: designed, verified homepage in 99 s →{' '}
            <Link
              href="/docs/getting-started/ai-quick-start"
              className="text-cw-terracotta hover:underline"
            >
              AI agent quick start
            </Link>
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href="/docs/getting-started/quick-start" size="lg">
              Get started
            </ButtonLink>
            <ButtonLink href={social.templateRepo} variant="outline" size="lg">
              View on GitHub
            </ButtonLink>
          </div>

          <p className="mt-6 text-xs text-cw-stone-500 dark:text-cw-stone-400 font-mono">
            MIT · Next.js 16 · Tailwind v4 · Prisma · Stripe
          </p>
        </div>
      </div>
    </section>
  );
}
