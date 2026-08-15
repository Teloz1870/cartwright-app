import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

/**
 * The band every non-bespoke section sits in.
 *
 * This component WAS the design problem. Fourteen homepage sections all
 * inherited `max-w-6xl`, one padding value and a bottom hairline from here, so
 * the page had rhythm without progression — the reason it read as generic long
 * before anyone looked at the colours.
 *
 * It survives because the long tail of pages (compare, use-cases, galleries)
 * genuinely wants one shared band, and because changing it here re-skins all of
 * them at once. What changed is only what it holds: the measure now matches the
 * hand-built sections at `max-w-7xl`, so a page does not visibly narrow halfway
 * down. Sections that carry a real argument still build their own layout.
 */
export function Section({
  children,
  className,
  bleed = false,
}: {
  children: ReactNode;
  className?: string;
  bleed?: boolean;
}) {
  return (
    <section className={cn('border-b border-cw-rule', className)}>
      <div className={cn('mx-auto', bleed ? 'w-full' : 'max-w-7xl px-6 py-20 sm:py-24')}>
        {children}
      </div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'left',
  as: Heading = 'h2',
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  /**
   * The gallery pages use this component for their page title, and it always
   * rendered `h2` — so /designs, /scenes, /looks, /mixer, /chrome, /parts,
   * /elements, /svg-items and /verticals each shipped with no `h1` at all.
   * Pass `as="h1"` on the first header of a page; leave it alone everywhere
   * else, since a second `h1` is its own defect.
   */
  as?: 'h1' | 'h2';
}) {
  return (
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
      {eyebrow && (
        <p className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-cw-muted">
          {eyebrow}
        </p>
      )}
      {/* Display serif, not the interface sans. A section statement is a
          declaration and should sound like one; the sans is for explaining and
          the mono is for evidence. Half the homepage was still speaking in the
          interface voice, which is what made a partly-redesigned page read
          worse than either version whole. */}
      <Heading className="mt-6 font-display text-cw-fg [font-size:clamp(2.25rem,5vw,4rem)] [line-height:0.95] [letter-spacing:-0.03em]">
        {title}
      </Heading>
      {description && (
        <p className="mt-6 text-base sm:text-lg leading-relaxed text-cw-muted">
          {description}
        </p>
      )}
    </div>
  );
}
