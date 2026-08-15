import Link from 'next/link';

/**
 * Ownership as a primary capability, not a footnote.
 *
 * This argument was previously a paragraph after the Three Doors cards and a
 * repeat in the footer — buried under demos and design packs. It is the single
 * strongest reason to choose an open engine over a hosted platform, and the
 * only claim here a competitor structurally cannot copy. It belongs above the
 * showcase, stated as a receipt rather than as reassurance.
 */
const RECEIPT = [
  ['repository', 'customer-owned'],
  ['database', 'customer-chosen'],
  ['infrastructure', 'customer-controlled'],
  ['license', 'MIT'],
  ['platform fee', '0%'],
];

export function ExitFreedom() {
  return (
    <section className="border-b border-cw-rule bg-cw-canvas">
      <div className="cw-rail-track mx-auto max-w-7xl px-6 py-20 sm:py-24">
        <div className="lg:grid lg:grid-cols-[1fr_38%] lg:gap-14">
          <div className="pl-12 lg:pl-0 lg:pr-14">
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-cw-muted">
              Exit freedom
            </p>
            <h2 className="mt-6 max-w-[18ch] font-display [font-size:clamp(2.25rem,5vw,4rem)] [line-height:0.95] [letter-spacing:-0.03em] text-cw-fg">
              The first commit is the exit plan.
            </h2>
            <p className="mt-7 max-w-[62ch] text-base sm:text-lg leading-relaxed text-cw-muted">
              Cartwright scaffolds into a repository you own and then gets out of
              the way. There is no control plane holding your storefront up, and
              no per-order cut on the way through.
            </p>
            <p className="mt-5 max-w-[62ch] text-base leading-relaxed text-cw-fg">
              Stop using Cartwright services tomorrow and the deployed shop keeps
              running — because it was never running on ours.
            </p>
            <Link
              href="/docs/why-cartwright"
              className="mt-8 inline-block font-mono text-xs uppercase tracking-[0.14em] text-cw-action underline-offset-4 hover:underline"
            >
              What you keep, in detail →
            </Link>
          </div>

          <dl className="mt-12 pl-12 lg:mt-0 lg:pl-8 font-mono text-xs">
            <div className="mb-4 flex items-center gap-2 text-cw-muted">
              <span className="cw-stamp" data-state="verified">
                receipt
              </span>
            </div>
            {RECEIPT.map(([k, v]) => (
              <div
                key={k}
                className="flex items-baseline justify-between gap-4 border-b border-cw-rule py-3"
              >
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
