"use client";

import { useState } from "react";

/**
 * A readable, copyable prompt block — full text wrapped (not a single-line
 * terminal like CopyCommand), with a copy button. Used for the (long) design
 * build-prompts on the detail + prompt-library pages.
 */
export function PromptBlock({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — no-op */
    }
  }

  return (
    <div className="relative rounded-xl border border-cw-stone-200 bg-cw-stone-50 dark:border-cw-stone-700 dark:bg-cw-stone-900/60">
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap px-4 py-3.5 pr-24 font-mono text-[13px] leading-relaxed text-cw-stone-700 dark:text-cw-stone-300">
        {prompt}
      </pre>
      <button
        type="button"
        onClick={copy}
        className="absolute right-3 top-3 rounded-lg border border-cw-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-cw-stone-700 transition-colors hover:border-cw-terracotta hover:text-cw-terracotta dark:border-cw-stone-700 dark:bg-cw-stone-800 dark:text-cw-stone-200"
        aria-label="Copy prompt"
      >
        {copied ? "Copied ✓" : "Copy"}
      </button>
    </div>
  );
}
