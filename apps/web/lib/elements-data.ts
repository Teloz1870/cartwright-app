// Cartwright Elements — the pro 3D & cinematic building blocks you can drop
// into any design. DERIVED from the engine's marketplace-manifest v2 (see
// lib/marketplace.ts — vendored at lib/marketplace-manifest.json, refresh with
// `pnpm sync:manifest`). Each entry points at a committed preview asset
// (image + optional hover-video) under public/scenes/ or public/designs/.
//
// Thin re-export so every existing consumer keeps importing from
// '@/lib/elements-data' unchanged.

import { getElements } from './marketplace';

export type { ElementEntry } from './marketplace';

export const ELEMENTS = getElements();
