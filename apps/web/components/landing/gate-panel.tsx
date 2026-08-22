import { ENGINE_FACTS } from '@/lib/engine-facts';

/**
 * A write, held at the gate.
 *
 * Not a screenshot and not a feature card — the shape of the actual admin
 * exchange: an agent proposes, the shop renders the exact diff, and a
 * single-use token waits for a person. The product's claim is "nothing is
 * written until you release it", and this is the only element on the page that
 * *shows* it rather than asserting it.
 *
 * ## Two things here were wrong in the mockup and are worth not re-breaking
 *
 * **The count.** The caption read "this gate stands in front of all 25 write
 * operations the admin exposes". False: `confirmGatedCount` is the
 * confirmation-gated SUBSET of `adminToolCount`, not the total. A false
 * security claim on a product sold on trust, in the densest quotable text on the
 * page. It now says what is true — every confirmation-gated tool stops here —
 * and reads the number rather than restating it.
 *
 * **The TTL.** The panel showed `15 min`; the engine's
 * `lib/confirmation-tokens.ts` says `TTL_MS = 5 * 60 * 1000`. Both numbers are imported for exactly the reason
 * `engine-facts.tsx` gives in its own docstring: a number retyped into copy
 * drifts, and four past drifts are recorded there.
 *
 * The product/price figures are illustrative and the caption says so.
 */
export function GatePanel() {
  return (
    <div>
      <div className="border border-cw-fg bg-cw-surface">
        <div className="flex items-center justify-between border-b border-cw-rule px-3.5 py-2.5">
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-cw-muted">
            Admin · live
          </span>
          <span className="cw-stamp" data-state="pending">
            Awaiting you
          </span>
        </div>

        <div className="px-3.5 py-4">
          <div className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-cw-stone-400">
            Agent proposes
          </div>
          <p className="mt-1.5 text-sm leading-snug text-cw-fg sm:text-[0.9375rem]">
            “Drop winter frames 15% until Sunday.”
          </p>

          <div className="mt-3.5 border border-cw-rule bg-cw-canvas px-3 py-3">
            <div className="font-mono text-[0.6875rem] leading-[1.85] text-cw-stone-700 dark:text-cw-stone-300">
              41 products
              <br />
              DKK 84 320 → 71 672
              <br />
              <span className="text-cw-muted">
                token: single use · {ENGINE_FACTS.confirmTokenTtlMinutes} min
              </span>
            </div>
          </div>

          <div className="mt-3.5 flex gap-2">
            <span className="flex-1 bg-cw-fg py-2 text-center text-[0.8125rem] font-medium text-cw-canvas">
              Release
            </span>
            <span className="flex-1 border border-cw-rule py-2 text-center text-[0.8125rem] text-cw-muted">
              Discard
            </span>
          </div>
        </div>
      </div>

      <p className="mt-3 px-0.5 text-[0.8125rem] leading-relaxed text-cw-muted">
        An illustration, not a mockup of a feature. Every one of Cartwright&apos;s{' '}
        <strong className="font-medium text-cw-stone-700 dark:text-cw-stone-300">
          {ENGINE_FACTS.confirmGatedCount}
        </strong>{' '}
        confirmation-gated write tools stops here: it returns a preview instead of
        executing, and runs only against a single-use token the server issued.
      </p>
    </div>
  );
}
