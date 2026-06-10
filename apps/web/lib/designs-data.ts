// DERIVED from the engine's marketplace-manifest v2 (see lib/marketplace.ts —
// vendored at lib/marketplace-manifest.json, refresh with `pnpm sync:manifest`).
// Kept as a thin re-export so every existing consumer keeps importing from
// '@/lib/designs-data' unchanged. Do not hand-edit entries here.

import { getDesigns } from './marketplace';

export type { DesignEntry } from './marketplace';

export const DESIGNS = getDesigns();
