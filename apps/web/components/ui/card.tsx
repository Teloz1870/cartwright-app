import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-cw-stone-200 dark:border-cw-stone-800 bg-cw-paper dark:bg-cw-stone-900/40 p-6 transition-colors',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={cn(
        'text-base font-semibold text-cw-stone-900 dark:text-cw-stone-50 tracking-tight',
        className,
      )}
    >
      {children}
    </h3>
  );
}

export function CardBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        'mt-2 text-sm leading-relaxed text-cw-stone-500 dark:text-cw-stone-400',
        className,
      )}
    >
      {children}
    </p>
  );
}
