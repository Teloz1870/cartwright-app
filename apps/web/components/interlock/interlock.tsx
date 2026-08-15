import { WHEEL_PATH } from '@/components/brand/wheel';

/**
 * The Interlock — one instruction becoming trustworthy, as a mechanism.
 *
 * `discount.update` enters from the left, is checked against a scope, and then
 * physically cannot advance: a pawl blocks the ratchet and the scene turns
 * amber. Only after release does the wheel index one tooth, execute, and stamp
 * an audit receipt — after which the wheel disengages and rolls into
 * `your-repo/`. AI supplies the force; policy and a human control transmission;
 * ownership stays portable. That is the whole product argument, and it needs no
 * voiceover.
 *
 * Built as CSS scroll-driven animation over an inline SVG, so the signature
 * moment of the site costs zero JavaScript and no hydration. Browsers without
 * `animation-timeline` get the complete static diagram — every station drawn,
 * every label present — rather than a broken or empty frame. That fallback is
 * also the `prefers-reduced-motion` state and the mobile state, which is why it
 * had to be a complete composition rather than a poster: if the still frame
 * cannot carry the argument, the argument is wrong.
 *
 * The 3D version replaces the SVG inside this same chapter later; the DOM
 * ledger, the ranges and the fallback stay exactly as they are.
 */
const STATIONS = [
  {
    key: 'plan',
    stamp: 'plan',
    state: '',
    title: 'The agent proposes',
    body: 'An instruction arrives from a coding agent, the admin assistant, or a buyer agent.',
  },
  {
    key: 'scope',
    stamp: 'scope',
    state: 'action',
    title: 'The key is checked, not the intent',
    body: 'The tool declares the scope it needs. The key either carries it or the call stops here — nothing is inferred from phrasing.',
  },
  {
    key: 'confirm',
    stamp: 'confirm',
    state: 'pending',
    title: 'The mechanism refuses to turn',
    body: 'A write halts and returns a preview. Advancing needs a token the server issued and a person released.',
  },
  {
    key: 'execute',
    stamp: 'execute',
    state: 'action',
    title: 'One indexed step',
    body: 'Released, the ratchet advances exactly one tooth. Replaying the instruction does not move it twice.',
  },
  {
    key: 'audit',
    stamp: 'audited',
    state: 'verified',
    title: 'Recorded, and reversible',
    body: 'Stamped into an append-only log, with the actor typed by origin. Anything it changed reverts from that row.',
  },
];

export function Interlock() {
  return (
    <section className="cw-interlock border-b border-cw-rule bg-cw-canvas">
      <div className="cw-interlock-viewport">
        {/* `w-full` is load-bearing: the sticky viewport is a flex row, so without
          it this shrink-to-fits to its content and the mechanism gets squeezed
          into the right margin instead of filling the chapter. */}
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col justify-center px-6 py-10">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-cw-muted">
            One operation, end to end
          </p>

          <div className="mt-6 lg:grid lg:grid-cols-[38%_1fr] lg:items-center lg:gap-14">
            {/* The ledger. Text stays in the DOM — never rendered into the
                drawing — so it is selectable, translatable and readable to a
                screen reader in the order the mechanism runs. */}
            <ol className="order-2 mt-8 space-y-px lg:order-1 lg:mt-0">
              {STATIONS.map((s, i) => (
                <li
                  key={s.key}
                  data-station={i}
                  className="cw-station border-l-2 border-transparent py-2.5 pl-4"
                >
                  <span className="cw-stamp" data-state={s.state || undefined}>
                    {s.stamp}
                  </span>
                  <h3 className="mt-2 text-sm font-medium text-cw-fg">{s.title}</h3>
                  <p className="mt-1 max-w-[48ch] text-[0.8125rem] leading-snug text-cw-muted">
                    {s.body}
                  </p>
                </li>
              ))}
            </ol>

            {/* The mechanism. Decorative: everything it says is said above. */}
            <div className="order-1 lg:order-2">
              <svg
                viewBox="0 0 720 360"
                className="w-full"
                aria-hidden
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* The rail — the same datum the page is built on. */}
                <line
                  x1="24"
                  y1="286"
                  x2="696"
                  y2="286"
                  stroke="var(--cw-rail)"
                  strokeWidth="1"
                />
                {[92, 226, 360, 494, 628].map((x, i) => (
                  <g key={x}>
                    <line
                      x1={x}
                      y1="278"
                      x2={x}
                      y2="294"
                      stroke="var(--cw-rule)"
                      strokeWidth="1"
                    />
                    <text
                      x={x}
                      y="314"
                      textAnchor="middle"
                      className="cw-tick"
                      data-station={i}
                      fill="var(--cw-muted)"
                      fontSize="9"
                      fontFamily="var(--font-mono)"
                      letterSpacing="1.4"
                    >
                      {STATIONS[i].stamp.toUpperCase()}
                    </text>
                  </g>
                ))}

                {/* your-repo/ — where the wheel ends up. */}
                <g className="cw-repo">
                  <rect
                    x="604"
                    y="150"
                    width="92"
                    height="92"
                    fill="none"
                    stroke="var(--cw-rule)"
                    strokeDasharray="3 3"
                  />
                  <text
                    x="650"
                    y="136"
                    textAnchor="middle"
                    fill="var(--cw-muted)"
                    fontSize="10"
                    fontFamily="var(--font-mono)"
                  >
                    your-repo/
                  </text>
                </g>

                {/* The pawl. Drops to block, lifts to release. */}
                <g className="cw-pawl">
                  <path
                    d="M352 78 L368 78 L362 116 L358 116 Z"
                    fill="var(--cw-pending)"
                  />
                </g>

                {/* The wheel. Indexes one tooth, then leaves. */}
                <g className="cw-wheel">
                  <g transform="translate(360 196) scale(3.4) translate(-16 -16)">
                    <path d={WHEEL_PATH} fill="currentColor" fillRule="evenodd" />
                  </g>
                </g>

                {/* The instruction, and the receipt it becomes. */}
                <g className="cw-puck">
                  <rect x="-13" y="-13" width="26" height="26" fill="var(--cw-action)" />
                  <text
                    x="0"
                    y="-24"
                    textAnchor="middle"
                    fill="var(--cw-muted)"
                    fontSize="10"
                    fontFamily="var(--font-mono)"
                  >
                    discount.update
                  </text>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
