'use client';

import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

/**
 * Whether motion is allowed, read as an external store rather than copied into
 * state inside an effect.
 *
 * The effect-plus-setState version renders once with the wrong answer and then
 * again with the right one, which is the cascading render `react-hooks` warns
 * about — and it never noticed the user changing the setting afterwards. This
 * subscribes, so the answer stays live, and the server snapshot is `false`
 * (no motion) so first paint is the calm one and the upgrade is the exception.
 */
export function useMotionAllowed(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => !window.matchMedia(QUERY).matches,
    () => false,
  );
}
