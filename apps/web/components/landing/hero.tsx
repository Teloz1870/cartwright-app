import Link from 'next/link';
import { CopyCommand } from '@/components/landing/copy-command';
import { Station } from '@/components/landing/station';
import { GatePanel } from '@/components/landing/gate-panel';
import { social } from '@/lib/shared';
import { HOME_H1_LINES, HOME_LEDE, INSTALL_COMMAND } from '@/lib/home-copy';

/**
 * Station 00 — the claim, and the machine holding a write next to it.
 *
 * The old hero put the claim on the left and a facts table on the right: engine
 * version, licence, platform fee. True, and inert — every competitor can print
 * the same four rows.
 *
 * What no competitor can print is the gate actually holding something. So the
 * right column is now a real write, paused: an agent has proposed a price
 * change, the shop has shown exactly what it would do, and nothing has happened
 * yet. That is the product's whole argument, in the first viewport, before a
 * single scroll.
 *
 * The facts did not disappear — they moved to Station 03, where they sit in a
 * ledger next to the guardrail that makes each one true.
 */
export function Hero() {
  return (
    <Station
      index="00"
      label="The claim"
      id="s00"
      as="h1"
      live
      headingInChildren
      title={HOME_H1_LINES.join(' ')}
    >
      {/* One grid, three items, two orders. On desktop: claim | panel, with the
          command spanning beneath both. On a phone the columns stack, and a
          full-width command would land BELOW the gate panel — pushing the page's
          primary action off the first screen. `order` puts it back directly
          under the claim without moving anything on desktop. */}
      <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[1fr_372px]">
        {/* `min-w-0`: a grid item will not shrink below its content's min-content
            width, and both the mono install command and the gate panel are wider
            than 390px. Without it the whole page scrolls sideways on a phone. */}
        <div className="order-1 min-w-0 lg:order-none">
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-cw-muted">
            Open source · MIT · Next.js
          </p>

          <h1
            id="s00"
            className="mt-5 font-display text-cw-fg [font-size:clamp(2.75rem,7vw,4.75rem)] [line-height:0.87] [letter-spacing:-0.042em]"
          >
            <span className="cw-rise block">{HOME_H1_LINES[0]}</span>{' '}
            {/* The space is for text extraction, not layout: both spans are
                `display: block`, so this whitespace node collapses and renders
                as nothing. Without it the h1's text content is the run-together
                "AI runs the shop.You keep the keys." — which is exactly what a
                crawler, a screen reader and an AI summariser read. */}
            <span className="cw-rise cw-rise-2 block text-cw-muted">
              {HOME_H1_LINES[1]}
            </span>
          </h1>

          <p className="mt-7 max-w-[44ch] text-base leading-relaxed text-cw-stone-700 dark:text-cw-stone-300 sm:text-lg">
            {HOME_LEDE}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href="/security"
              className="font-mono text-xs uppercase tracking-[0.13em] text-cw-action underline-offset-4 hover:underline"
            >
              Inspect the safety model →
            </Link>
            <Link
              href={social.templateRepo}
              className="font-mono text-xs uppercase tracking-[0.13em] text-cw-muted underline-offset-4 hover:underline"
            >
              Source on GitHub
            </Link>
          </div>
        </div>

        <div className="order-3 min-w-0 lg:order-none lg:col-start-2 lg:row-start-1">
          <GatePanel />
        </div>

        <div className="order-2 min-w-0 max-w-3xl lg:order-none lg:col-span-2 lg:row-start-2 lg:mt-1">
          <CopyCommand command={INSTALL_COMMAND} />
        </div>
      </div>

      {/* The command spans BOTH columns rather than sitting in the left one.
          `CopyCommand` clamps to a single line on purpose — its docstring
          explains that the clamp is what stops the mono text pushing the page
          sideways at 390px — so inside the narrower station column it truncated
          to "npx create-cartwright@latest my". Truncating the page's primary
          action is not a trade worth making, and full width reads better
          anyway: the claim, the machine, then how you get it. */}
    </Station>
  );
}
