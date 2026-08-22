import type { ReactNode } from 'react';

/**
 * A station on the page's spine.
 *
 * The design system already called the page "a cutaway of a trusted transaction
 * machine", and `themes`/`global.css` already shipped `.cw-rail-track` for it —
 * but only the Interlock chapter ever behaved that way. Every other section was
 * an independent band that happened to share a padding value.
 *
 * This makes the rail the page's actual datum: one continuous line, a numbered
 * index left of it, a tick where each section attaches. Sections stop being
 * fourteen blocks and become stations on one mechanism, which is the argument
 * the product is making anyway — a request travels a machine and is recorded at
 * every stop.
 *
 * ## The heading contract
 *
 * `title` renders as the station's `<h2>` and `id` wires `aria-labelledby`, so
 * the document outline and the accessibility tree agree by construction. The
 * ENTRY station passes `as="h1"` instead — there is exactly one, and it is the
 * page's claim.
 *
 * Station 06 shipped in the mockup with no heading at any level; requiring
 * `title` here is what stops that recurring. A section that genuinely has no
 * heading does not belong on the spine.
 */

type StationProps = {
  /** Two digits, e.g. "00". Rendered above the label, muted. */
  index: string;
  /** Short label under the index — the station's job, not its title. */
  label: ReactNode;
  /** The heading text. Becomes the h2 (or h1 for the entry station). */
  title: ReactNode;
  /** Anchor id: the heading gets it, the section points at it. */
  id: string;
  /** `h1` for the entry station only. */
  as?: 'h1' | 'h2';
  /** Vermilion tick instead of the hollow one — the entry and the exit. */
  live?: boolean;
  /** Standfirst under the heading. */
  lede?: ReactNode;
  /** Set when the heading is rendered by `children` instead (the hero). */
  headingInChildren?: boolean;
  className?: string;
  children: ReactNode;
};

export function Station({
  index,
  label,
  title,
  id,
  as = 'h2',
  live = false,
  lede,
  headingInChildren = false,
  className,
  children,
}: StationProps) {
  const Heading = as;

  return (
    <section
      aria-labelledby={id}
      className={`relative grid grid-cols-1 lg:grid-cols-[300px_1fr] pt-14 lg:pt-24 ${className ?? ''}`}
    >
      {/* Left of the spine: which station this is. Right-aligned so the index
          sits against the rail rather than drifting away from it. */}
      <div className="mb-5 flex items-baseline gap-2 px-6 lg:mb-0 lg:block lg:px-0 lg:pr-8 lg:pl-10 lg:text-right">
        <div className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-cw-stone-400">
          Station {index}
        </div>
        <span aria-hidden className="font-mono text-[0.625rem] text-cw-stone-400 lg:hidden">
          ·
        </span>
        <div className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-cw-muted lg:mt-2 [&_br]:hidden lg:[&_br]:block">
          {label}
        </div>
      </div>

      {/* Right of the spine: the content, and the tick that attaches it. */}
      <div className="relative min-w-0 px-6 lg:px-10 lg:pl-12">
        <div
          aria-hidden
          className={`absolute top-2 hidden size-[9px] lg:block ${
            live
              ? 'left-[-5px] bg-cw-action'
              : 'left-[-5px] border border-cw-stone-400 bg-cw-canvas'
          }`}
        />

        {!headingInChildren && (
          <Heading
            id={id}
            className={
              as === 'h1'
                ? 'font-display text-[clamp(2.75rem,7vw,4.75rem)] leading-[0.87] tracking-[-0.042em] text-cw-fg'
                : 'font-display text-[clamp(1.875rem,4vw,2.5rem)] leading-[1.05] tracking-[-0.025em] text-cw-fg'
            }
          >
            {title}
          </Heading>
        )}

        {lede && (
          <p className="mt-3.5 max-w-[58ch] text-base leading-relaxed text-cw-muted">
            {lede}
          </p>
        )}

        {children}
      </div>
    </section>
  );
}

/**
 * The spine itself.
 *
 * One absolutely-positioned hairline behind every station, stopping short of
 * the footer so the mechanism ends where the page stops arguing. Hidden below
 * `lg`: at 390px there is no room for a 300px index column, so the mobile
 * layout drops the rail entirely rather than cramming it — the same breakpoint
 * choice `.cw-rail-track` already makes.
 */
export function Spine({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto max-w-7xl">
      <div
        aria-hidden
        className="absolute left-[300px] top-0 bottom-32 hidden w-px bg-[var(--cw-rail)] lg:block"
      />
      {children}
    </div>
  );
}
