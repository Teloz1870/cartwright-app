// Cartwright Live Canvas — 3D scene catalogue, DERIVED from the engine's
// marketplace-manifest v2 (see lib/marketplace.ts — vendored at
// lib/marketplace-manifest.json, refresh with `pnpm sync:manifest`). Every
// scene is PALETTE-REACTIVE: it reads the active brand's colours at runtime.
// Preview assets: public/scenes/<slug>.{webm,mp4,jpg}.
//
// App-only gallery fields (`vibe`, `isNew`) + the English copy overrides live
// in marketplace.ts (SCENE_OVERRIDES). This file is a thin re-export so every
// existing consumer keeps importing from '@/lib/scenes-data' unchanged.

import { getScenes } from './marketplace';

export type { SceneEntry } from './marketplace';

export const SCENES = getScenes();
