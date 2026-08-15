/**
 * The Interlock — one instruction, from an agent's request to an audit row.
 *
 * This replaces an abstract ratchet-and-pawl mechanism that the owner read and
 * understood nothing from, which was fair: it asked the reader to already know
 * what a pawl is, and then to infer causation between two things that never
 * touched. The lesson is worth keeping — a metaphor for the product is harder
 * to read than the product.
 *
 * So this is the actual flow, in something close to the actual admin. There is
 * nothing to decode: an agent asks for a discount, the engine shows what it
 * would change, the write stops and waits for a person, and the approved
 * operation lands in an append-only log with a revert beside it. The pause in
 * the middle is the whole product.
 *
 * Still CSS scroll-driven over real DOM, so the chapter costs no JavaScript and
 * no hydration, the text stays selectable and translatable, and a reader who
 * never scrolls — narrow viewport, reduced motion, no `animation-timeline` —
 * gets the finished panel with every stage visible at once rather than a
 * broken frame.
 */
const PLAN = [
  ['discounts.create', 'WEEKEND20 · −20%'],
  ['products.update', '12 products in Sunglasses'],
  ['settings.update_branding', 'announcement bar'],
];

export function Interlock() {
  return (
    <section className="cw-interlock border-b border-cw-rule bg-cw-canvas">
      <div className="cw-interlock-viewport">
        <div className="mx-auto flex h-full w-full max-w-7xl flex-col justify-center px-6 py-10">
          <div className="lg:grid lg:grid-cols-[34%_1fr] lg:items-center lg:gap-14">
            <div>
              <p className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-cw-muted">
                One operation, end to end
              </p>
              <h2 className="mt-6 font-display [font-size:clamp(2rem,4vw,3.25rem)] [line-height:0.98] [letter-spacing:-0.03em] text-cw-fg">
                It asks. You decide. It is written down.
              </h2>
              <p className="mt-6 max-w-[46ch] text-sm leading-relaxed text-cw-muted">
                An agent can reach every tool its key allows — and still cannot
                change your shop on its own. Writes stop, show their work, and
                wait for a person. What you approve is recorded with the actor
                that asked, and can be put back.
              </p>
            </div>

            {/* The panel. Close enough to the real admin that there is nothing
                to interpret — you are looking at the thing itself. */}
            <div className="mt-10 lg:mt-0">
              <div className="border border-cw-rule bg-cw-surface">
                <div className="flex items-center justify-between border-b border-cw-rule px-4 py-2.5">
                  <span className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-cw-muted">
                    admin · assistant
                  </span>
                  <span className="cw-stamp" data-state="action">
                    apikey · discounts:write
                  </span>
                </div>

                <div className="space-y-4 px-5 py-5">
                  {/* 1 — the request */}
                  <div className="cw-step" data-step="0">
                    <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-cw-muted">
                      agent
                    </p>
                    <p className="mt-1.5 text-sm text-cw-fg">
                      &ldquo;Set the sunglasses 20% down for the weekend and put
                      it on the banner.&rdquo;
                    </p>
                  </div>

                  {/* 2 — what it would do, before it does it */}
                  <div className="cw-step" data-step="1">
                    <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-cw-muted">
                      it would change
                    </p>
                    <ul className="mt-2 divide-y divide-cw-rule border-y border-cw-rule">
                      {PLAN.map(([tool, what]) => (
                        <li
                          key={tool}
                          className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2"
                        >
                          <code className="font-mono text-xs text-cw-action">{tool}</code>
                          <span className="text-xs text-cw-muted">{what}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 3 — the pause. The product. */}
                  <div className="cw-step cw-await" data-step="2">
                    <div className="flex flex-wrap items-center gap-3 border border-cw-pending px-4 py-3">
                      <span className="cw-stamp" data-state="pending">
                        waiting for you
                      </span>
                      <span className="text-xs text-cw-muted">
                        Nothing has changed yet.
                      </span>
                      <span className="ml-auto flex gap-2">
                        <span className="border border-cw-rule px-3 py-1 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-cw-muted">
                          Reject
                        </span>
                        <span className="bg-cw-action px-3 py-1 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-cw-surface">
                          Approve
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* 4 — approved, and written down */}
                  <div className="cw-step" data-step="3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="cw-stamp" data-state="verified">
                        applied
                      </span>
                      <span className="text-xs text-cw-muted">
                        3 changes · approved by you
                      </span>
                    </div>
                    <p className="mt-4 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-cw-muted">
                      audit log
                    </p>
                    <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-cw-rule pt-2 font-mono text-xs">
                      <span className="text-cw-muted">10:42</span>
                      <span className="text-cw-fg">apikey:sb_live_…4f2</span>
                      <span className="text-cw-verified">discounts.create</span>
                      <span className="ml-auto text-cw-action">revert ↩</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-center font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-cw-muted">
                the write stops here until you release it
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
