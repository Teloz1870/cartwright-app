import { Section } from '@/components/landing/section';
import { CopyCommand } from '@/components/landing/copy-command';
import { ButtonLink } from '@/components/ui/button';

export function InstallBand() {
  return (
    <Section className="bg-cw-stone-900 dark:bg-cw-ink text-cw-stone-50 border-cw-stone-800">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] items-center">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-cw-terracotta">
            install
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">
            One line. Real shop in five minutes.
          </h2>
          <p className="mt-4 text-base text-cw-stone-400 max-w-md">
            Works on macOS, Linux, and Windows (via WSL). Node 22+ required.
            No GitHub token, no marketplace install — just npm.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ButtonLink
              href="/docs/getting-started/quick-start"
              variant="secondary"
              size="lg"
            >
              Quick start →
            </ButtonLink>
            <ButtonLink
              href="/docs/cli-options"
              variant="ghost"
              size="lg"
              className="text-cw-stone-300 hover:text-cw-stone-50 hover:bg-cw-stone-800"
            >
              All CLI flags
            </ButtonLink>
          </div>
        </div>
        <div className="space-y-3">
          <CopyCommand command="npx create-cartwright@latest my-shop" />
          <div className="grid grid-cols-3 gap-2 text-xs font-mono text-cw-stone-400">
            <span className="rounded-md border border-cw-stone-800 px-3 py-2 text-center">
              pnpm create cartwright
            </span>
            <span className="rounded-md border border-cw-stone-800 px-3 py-2 text-center">
              npm create cartwright@latest
            </span>
            <span className="rounded-md border border-cw-stone-800 px-3 py-2 text-center">
              bunx create-cartwright
            </span>
          </div>
        </div>
      </div>
    </Section>
  );
}
