import Link from 'next/link';
import { CopyCommand } from '@/components/landing/copy-command';
import { social } from '@/lib/shared';
import { getEngineVersion } from '@/lib/engine';

/**
 * The five-second argument: AI runs the shop, you keep the keys.
 *
 * Two reading velocities in one composition rather than a persona gate. The
 * owner reads the declaration; the developer's eye goes straight down the rail
 * to the command, the version and the licence. Both are served without asking
 * anyone to pick a door before they know what the product is.
 *
 * The install command is not typed out character by character any more.
 * Developers read it instantly and the delay was theatrical friction.
 */
export async function Hero() {
  // Live engine version from the engine CHANGELOG (ISR-cached, fail-soft).
  // Never hardcode a version here; it drifts the moment a release ships.
  const engineVersion = await getEngineVersion();

  return (
    <section className="relative overflow-hidden border-b border-cw-rule">
      <div aria-hidden className="absolute inset-0 cw-grid-bg" />

      <div className="cw-rail-track cw-rail-draw relative mx-auto max-w-7xl px-6 pt-24 pb-20 sm:pt-32 sm:pb-28">
        <div className="lg:grid lg:grid-cols-[1fr_38%] lg:gap-10">
          {/* Left of the rail: the claim. */}
          <div className="pl-12 lg:pl-0 lg:pr-14">
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-cw-muted">
              Open source · MIT · Next.js
            </p>

            <h1 className="mt-7 font-display text-cw-fg [font-size:clamp(3rem,9vw,7.5rem)] [line-height:0.88] [letter-spacing:-0.04em]">
              <span className="cw-rise">AI runs the shop.</span>
              <span className="cw-rise cw-rise-2 text-cw-muted">You keep the keys.</span>
            </h1>

            <p className="mt-8 max-w-[62ch] text-base sm:text-lg leading-relaxed text-cw-muted">
              Cartwright is an AI-native commerce engine built for trusted
              operation: scoped tools, confirmation-gated writes, auditable
              actions, agent checkout — and a repo you can leave with.
            </p>

            <div className="mt-10 max-w-xl">
              <CopyCommand command="npx create-cartwright@latest my-shop" />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link
                href="/security"
                className="font-mono text-xs uppercase tracking-[0.14em] text-cw-action underline-offset-4 hover:underline"
              >
                Inspect the safety model →
              </Link>
              <Link
                href={social.templateRepo}
                className="font-mono text-xs uppercase tracking-[0.14em] text-cw-muted underline-offset-4 hover:underline"
              >
                Source on GitHub
              </Link>
            </div>
          </div>

          {/* Right of the rail: what is verifiable right now. */}
          <dl className="mt-14 pl-12 lg:mt-2 lg:pl-8 space-y-5 font-mono text-xs">
            {[
              ['engine', `v${engineVersion}`],
              ['licence', 'MIT'],
              ['platform fee', '0%'],
              ['repo', 'yours, from commit one'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 border-b border-cw-rule pb-2">
                <dt className="uppercase tracking-[0.14em] text-cw-muted">{k}</dt>
                <dd className="text-cw-fg">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
