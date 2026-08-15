import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

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
    <section
      className={cn(
        'border-b border-cw-stone-200 dark:border-cw-stone-800',
        className,
      )}
    >
      <div
        className={cn(
          'mx-auto',
          bleed ? 'w-full' : 'max-w-6xl px-6 py-20 sm:py-24',
        )}
      >
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
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-cw-terracotta">
          {eyebrow}
        </p>
      )}
      <Heading className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
        {title}
      </Heading>
      {description && (
        <p className="mt-4 text-base sm:text-lg leading-relaxed text-cw-stone-500 dark:text-cw-stone-400">
          {description}
        </p>
      )}
    </div>
  );
}
