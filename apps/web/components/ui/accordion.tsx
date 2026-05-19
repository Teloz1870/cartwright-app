'use client';

import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';
import { useState } from 'react';

type Item = {
  q: string;
  a: ReactNode;
};

export function Accordion({
  items,
  className,
}: {
  items: Item[];
  className?: string;
}) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div
      className={cn(
        'divide-y divide-cw-stone-200 dark:divide-cw-stone-800 border-y border-cw-stone-200 dark:border-cw-stone-800',
        className,
      )}
    >
      {items.map((item, idx) => {
        const isOpen = open === idx;
        return (
          <div key={idx}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : idx)}
              className="flex w-full items-center justify-between gap-4 py-5 text-left text-base font-medium text-cw-stone-900 dark:text-cw-stone-50 hover:text-cw-terracotta transition-colors"
            >
              <span>{item.q}</span>
              <span
                aria-hidden
                className={cn(
                  'shrink-0 text-cw-stone-400 transition-transform duration-200',
                  isOpen && 'rotate-45 text-cw-terracotta',
                )}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                >
                  <path d="M8 3v10M3 8h10" />
                </svg>
              </span>
            </button>
            <div
              className={cn(
                'overflow-hidden transition-[grid-template-rows] grid duration-200',
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
              )}
            >
              <div className="min-h-0">
                <div className="pb-5 pr-8 text-sm leading-relaxed text-cw-stone-500 dark:text-cw-stone-400">
                  {item.a}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
