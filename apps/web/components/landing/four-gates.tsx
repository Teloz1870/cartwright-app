import { Station } from '@/components/landing/station';

/**
 * Station 01 — one write, end to end.
 *
 * This replaces the Interlock: a 240vh scroll-driven chapter that spent a
 * quarter of its length on a deliberate hold. The dwell was a good argument and
 * an expensive way to make it — it needed `animation-timeline: view()`, a full
 * static fallback for every browser and `prefers-reduced-motion`, and a
 * viewport tall enough to be worth entering. Below `lg` it degraded to the
 * static panel anyway, which is what most readers saw.
 *
 * So the argument stays and the machinery goes. Four cells, in order, all
 * legible at once: the pause is made by the middle two being where the product
 * lives, not by making the reader wait through it.
 *
 * The stamps carry the design system's four state colours, and they are the
 * reason those colours exist — `global.css` is explicit that they mark state
 * and are never decorative. `Pending` in ochre next to two vermilions is the
 * whole sequence in one glance.
 *
 * Each stage title is an `<h3>`: they are genuine subsections of this station,
 * and the mockup rendered them as styled `<div>`s, which is how the page ended
 * up with a flat outline an audit could correctly call out.
 */

const GATES = [
  {
    state: 'action',
    stamp: 'Request',
    detail: 'products.update',
    body: "The API key's scopes are checked before the tool is even resolved. Out of scope, out of luck.",
  },
  {
    state: 'pending',
    stamp: 'Pending',
    detail: 'plan + token',
    body: 'The tool returns the exact diff instead of executing it. Nothing has been written.',
  },
  {
    state: 'action',
    stamp: 'Write',
    detail: '41 rows · price',
    body: 'A person released it. The token is single-use and spends itself here.',
  },
  {
    state: 'verified',
    stamp: 'Audited',
    detail: 'actor · diff · revert',
    body: 'Recorded with who asked, what changed, and a revert that actually works.',
  },
] as const;

export function FourGates() {
  return (
    <Station
      index="01"
      label={
        <>
          One write,
          <br />
          end to end
        </>
      }
      id="s01"
      title="Four gates, in order."
      lede="Every tool call takes the same path, whether it came from the admin, your terminal, or a customer talking to the storefront. A gate that is already open proves nothing, so the second one is where the product actually lives."
    >
      <div className="mt-6 grid border border-cw-rule bg-cw-surface sm:grid-cols-2 lg:grid-cols-4">
        {GATES.map((gate, i) => (
          <div
            key={gate.stamp}
            className={`px-4 py-5 ${
              i < GATES.length - 1
                ? 'border-b border-cw-rule sm:border-b-0 sm:border-r lg:border-r'
                : ''
            } ${i === 1 ? 'sm:border-r-0 lg:border-r' : ''}`}
          >
            <h3>
              <span className="cw-stamp" data-state={gate.state}>
                {gate.stamp}
              </span>
            </h3>
            <div className="mt-3.5 font-mono text-[0.6875rem] text-cw-fg">
              {gate.detail}
            </div>
            <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-cw-muted">
              {gate.body}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-baseline gap-3.5">
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-cw-pending">
          Gate two is the product
        </span>
        <span aria-hidden className="h-px flex-1 bg-cw-rule" />
      </div>
    </Station>
  );
}
