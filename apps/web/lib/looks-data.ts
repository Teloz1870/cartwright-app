// Cartwright Looks — curated Skin × Voice combinations, DERIVED from the
// engine's marketplace-manifest v2 (see lib/marketplace.ts — vendored at
// lib/marketplace-manifest.json, refresh with `pnpm sync:manifest`).
//
// Content and design are orthogonal in Cartwright: a design (Skin) controls
// how the page looks, and a Voice re-tones the copy + palette for an industry.
// A "Look" is a hand-picked pairing of the two. Each Look references an
// existing design slug (designs-data.ts) and voice slug (verticals-data.ts) —
// referential integrity is validated at build time in marketplace.ts.
//
// Thin re-export so every existing consumer keeps importing from
// '@/lib/looks-data' unchanged.

import { getLooks } from './marketplace';

export type { LookEntry } from './marketplace';

export const LOOKS = getLooks();
