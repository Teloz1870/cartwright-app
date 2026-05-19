import { ButtonLink } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CopyCommand } from '@/components/landing/copy-command';
import { isGithubPublic, social } from '@/lib/shared';

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-cw-stone-200 dark:border-cw-stone-800">
      <div aria-hidden className="absolute inset-0 cw-grid-bg" />
      <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="flex flex-col items-center text-center">
          <Badge tone="terracotta" className="mb-6">
            <span className="size-1.5 rounded-full bg-cw-terracotta" />
            v0.1 beta · open early access
          </Badge>
          <h1 className="max-w-3xl text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50 leading-[1.05]">
            The AI-first webshop template{' '}
            <span className="relative inline-block">
              <span className="relative z-10">you actually own.</span>
              <span
                aria-hidden
                className="absolute inset-x-0 -bottom-1 h-3 bg-cw-terracotta/20 dark:bg-cw-terracotta/30 -z-0"
              />
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-base sm:text-lg text-cw-stone-500 dark:text-cw-stone-400 leading-relaxed">
            A production-shaped Next.js 16 commerce stack with an AI-native admin,
            built-in MCP server, and Stripe checkout. Scaffold a real shop in one
            command — then own every line.
          </p>

          <div className="mt-10 w-full max-w-2xl">
            <CopyCommand command="npx create-cartwright@latest my-shop" />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href="/docs/getting-started/quick-start" size="lg">
              Read the docs
            </ButtonLink>
            {isGithubPublic ? (
              <ButtonLink
                href={social.github}
                variant="outline"
                size="lg"
              >
                View on GitHub
              </ButtonLink>
            ) : (
              <ButtonLink href={social.discord} variant="outline" size="lg">
                Join early access
              </ButtonLink>
            )}
          </div>

          <p className="mt-6 text-xs text-cw-stone-500 dark:text-cw-stone-500 font-mono">
            MIT · Next.js 16 · Tailwind v4 · Prisma · Stripe
          </p>
        </div>
      </div>
    </section>
  );
}
