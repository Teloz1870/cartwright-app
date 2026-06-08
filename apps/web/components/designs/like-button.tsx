'use client';

import { useEffect, useState } from 'react';

/**
 * Anonymous like button. Self-contained: fetches the live count on mount (so it
 * works on the SSG detail page), optimistic on click, localStorage dedup. Renders
 * nothing if the likes store isn't provisioned (graceful — no broken UI).
 */
export function LikeButton({ slug }: { slug: string }) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [count, setCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    try {
      setLiked(localStorage.getItem(`liked:${slug}`) === '1');
    } catch {
      /* ignore */
    }
    fetch('/api/designs/likes')
      .then((r) => r.json())
      .then((d: { configured?: boolean; likes?: Record<string, number> }) => {
        if (!alive) return;
        setConfigured(Boolean(d.configured));
        setCount(d.likes?.[slug] ?? 0);
      })
      .catch(() => {
        if (alive) setConfigured(false);
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  async function like() {
    if (liked || busy) return;
    setBusy(true);
    setLiked(true);
    setCount((c) => c + 1);
    try {
      localStorage.setItem(`liked:${slug}`, '1');
    } catch {
      /* ignore */
    }
    try {
      const res = await fetch(`/api/designs/${slug}/like`, { method: 'POST' });
      if (res.ok) {
        const d = (await res.json()) as { count?: number };
        if (typeof d.count === 'number') setCount(d.count);
      } else {
        // revert on failure
        setLiked(false);
        setCount((c) => Math.max(0, c - 1));
        try {
          localStorage.removeItem(`liked:${slug}`);
        } catch {
          /* ignore */
        }
      }
    } catch {
      setLiked(false);
      setCount((c) => Math.max(0, c - 1));
    } finally {
      setBusy(false);
    }
  }

  if (configured === false) return null;

  return (
    <button
      type="button"
      onClick={like}
      disabled={liked || busy || configured === null}
      aria-pressed={liked}
      aria-label={liked ? 'Liked' : 'Like this design'}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
        liked
          ? 'border-cw-terracotta bg-cw-terracotta/10 text-cw-terracotta'
          : 'border-cw-stone-200 text-cw-stone-600 hover:border-cw-terracotta hover:text-cw-terracotta dark:border-cw-stone-700 dark:text-cw-stone-300'
      }`}
    >
      <span aria-hidden>{liked ? '♥' : '♡'}</span>
      <span>{count}</span>
      <span className="text-cw-stone-400">·</span>
      <span className="font-normal">{liked ? 'Liked' : 'Like'}</span>
    </button>
  );
}
