import Link from 'next/link';
import { Station } from '@/components/landing/station';

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
    <Station
      index="04"
      label="What you keep"
      id="s04"
      title="The first commit is the exit plan."
    >
      <div className="mt-6 lg:grid lg:grid-cols-[1fr_38%] lg:gap-14">
          <div>
            <p className="max-w-[62ch] text-base sm:text-lg leading-relaxed text-cw-muted">
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
    </Station>
  );
}
