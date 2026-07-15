'use client';

import { useState } from 'react';
import { track } from '@vercel/analytics';
import { cn } from '@/lib/cn';

export function CopyCommand({
  command,
  size = 'lg',
  className,
}: {
  command: string;
  size?: 'md' | 'lg';
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      // The #1 conversion action on the site — the funnel's key event.
      track('copy_command', { command });
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // graceful no-op
    }
  };

  const sizes = {
    md: 'h-12 px-4 text-sm',
    lg: 'h-14 px-5 text-base sm:text-[15px]',
  };

  return (
    <div
      className={cn(
        'group relative flex w-full items-center justify-between gap-3 rounded-lg border border-cw-stone-200 dark:border-cw-stone-700 bg-cw-stone-900 dark:bg-cw-code-bg text-cw-stone-100 shadow-sm font-mono',
        sizes[size],
        className,
      )}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <span className="select-none text-cw-terracotta">$</span>
        <span className="truncate">
          <span className="cw-typed-line">{command}</span>
          <span className="cw-caret" aria-hidden>
            &nbsp;
          </span>
        </span>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy command"
        className="shrink-0 rounded-md border border-cw-stone-700 bg-cw-stone-800 hover:bg-cw-stone-700 px-3 h-9 inline-flex items-center gap-1.5 text-xs text-cw-stone-300 transition-colors"
      >
        {copied ? (
          <>
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 8.5L6.5 12 13 4" />
            </svg>
            Copied
          </>
        ) : (
          <>
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="5" y="5" width="9" height="9" rx="1.5" />
              <path d="M3 11V3.5A1.5 1.5 0 0 1 4.5 2H11" />
            </svg>
            Copy
          </>
        )}
      </button>
    </div>
  );
}
