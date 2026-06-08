'use client';

import { useEffect, useState } from 'react';
import { hasVideo } from '@/lib/design-media';

/**
 * Big framed homepage preview for a design detail page. Renders an autoplaying,
 * muted, looping VIDEO for animated (WebGL) designs and a static screenshot for
 * the rest. Client component so a missing asset (onError) degrades gracefully to
 * the palette swatches instead of a broken frame.
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
  // Render the static poster on SSR/first paint; upgrade to the autoplaying
  // video only after mount AND only when the user hasn't asked for reduced
  // motion (mirrors the engine's three.js reduced-motion fallback).
  const [motion, setMotion] = useState(false);
  useEffect(() => {
    setMotion(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

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

  const frame =
    'mt-8 overflow-hidden rounded-2xl border border-cw-stone-200 shadow-lg shadow-cw-stone-900/10 dark:border-cw-stone-700';
  const media = 'aspect-[16/10] w-full object-cover object-top';

  if (hasVideo(slug) && motion) {
    return (
      <div className={frame}>
        <video
          poster={`/designs/${slug}.jpg`}
          width={1280}
          height={800}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={`${name} — animated homepage preview`}
          onError={() => setFailed(true)}
          className={media}
        >
          <source src={`/designs/${slug}.webm`} type="video/webm" />
          <source src={`/designs/${slug}.mp4`} type="video/mp4" />
        </video>
      </div>
    );
  }

  return (
    <div className={frame}>
      <img
        src={`/designs/${slug}.jpg`}
        width={1280}
        height={800}
        alt={`${name} — homepage preview`}
        decoding="async"
        onError={() => setFailed(true)}
        className={media}
      />
    </div>
  );
}
