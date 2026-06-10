// Cartwright Voices — DERIVED from the engine's marketplace-manifest v2 (see
// lib/marketplace.ts — vendored at lib/marketplace-manifest.json, refresh with
// `pnpm sync:manifest`). A "Voice" re-tones a site for an industry: identity
// (tone / audience / formality / vibe) + genome copy overrides + a fitting
// palette + a palette-reactive 3D scene + a suggested skin.
//
// Thin re-export so every existing consumer keeps importing from
// '@/lib/verticals-data' unchanged. Slugs stay 1:1 with the engine
// verticals/<slug>/preset.ts by construction.

import { getVoices } from './marketplace';

export type { VoicePalette, VoiceEntry } from './marketplace';

export const VOICES = getVoices();
