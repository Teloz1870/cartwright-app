'use client';

import { useState } from 'react';

/**
 * Big framed preview screenshot for a design detail page. Client component so a
 * missing screenshot (onError) degrades gracefully to the palette swatches
 * instead of a broken-image frame.
 */
export function DesignHeroImage({
  slug,
  name,
  swatches,
}: {
  slug: string;
  name: string;
  swatches: string[];
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    if (swatches.length === 0) return null;
    return (
      <div className="mt-8 flex aspect-[16/10] w-full items-center justify-center gap-3 rounded-2xl border border-cw-stone-200 bg-cw-stone-50 dark:border-cw-stone-700 dark:bg-cw-stone-800/40">
        {swatches.map((hex, i) => (
          <span
            key={i}
            className="h-10 w-10 rounded-full border border-cw-stone-200 dark:border-cw-stone-700"
            style={{ backgroundColor: hex }}
            title={hex}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-cw-stone-200 shadow-lg shadow-cw-stone-900/10 dark:border-cw-stone-700">
      <img
        src={`/designs/${slug}.jpg`}
        width={1280}
        height={800}
        alt={`${name} — homepage preview`}
        decoding="async"
        onError={() => setFailed(true)}
        className="aspect-[16/10] w-full object-cover object-top"
      />
    </div>
  );
}
