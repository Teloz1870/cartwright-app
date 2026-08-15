'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * A boolean kept in `localStorage`, read as an external store.
 *
 * Reading it inside an effect and copying it into state renders once with the
 * wrong answer and then again with the right one, and never notices the same
 * key changing in another tab. Subscribing to `storage` fixes both, and the
 * server snapshot is `false` so hydration has something stable to match.
 */
export function useLocalFlag(key: string): [boolean, (next: boolean) => void] {
  const subscribe = useCallback((onChange: () => void) => {
    const handler = (e: StorageEvent) => {
      if (e.key === null || e.key === key) onChange();
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [key]);

  const value = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(key) === '1';
      } catch {
        // Private browsing and blocked storage both throw here; the feature is
        // cosmetic, so failing closed is the right answer.
        return false;
      }
    },
    () => false,
  );

  const set = useCallback((next: boolean) => {
    try {
      if (next) localStorage.setItem(key, '1');
      else localStorage.removeItem(key);
    } catch {
      /* ignore — see above */
    }
    // `storage` does not fire in the tab that wrote it, so nudge our own
    // subscribers by hand.
    window.dispatchEvent(new StorageEvent('storage', { key }));
  }, [key]);

  return [value, set];
}
