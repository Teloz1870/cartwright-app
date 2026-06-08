/**
 * Which designs have a recorded hero VIDEO (the animated WebGL/three.js heroes).
 * Kept here — not in the auto-generated designs-data.ts — and matched to the
 * committed assets in public/designs/<slug>.{webm,mp4} (+ <slug>.jpg poster).
 * Designs without motion above the fold use the static screenshot only.
 */
export const DESIGNS_WITH_VIDEO = new Set<string>([
  'engineered',
  'nocturne',
  'saas-dark',
  'aurora-site',
  'aurora-shop',
]);

export function hasVideo(slug: string): boolean {
  return DESIGNS_WITH_VIDEO.has(slug);
}
