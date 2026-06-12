---
"create-cartwright": minor
---

New `--look <url>` flag — scaffold wearing a shared look (`cartwright-composition-v1`).

The engine's `/built-with-cartwright` page advertises `npx create-cartwright --look <site>/api/look`; this release makes that command real. The CLI fetches the look JSON (10 s timeout), validates it, sets the skin as `designSlug` in `brand.config.ts`, and writes palette/scene/chrome into the seeded database's branding settings — the exact fields the engine's `composition.apply` writes. Fully fail-soft: a broken look (unreachable URL, bad JSON, wrong schema, pruned design, DB failure) prints one warning and the scaffold completes unchanged. Works with both profiles; under `--profile light` a non-curated skin is skipped with a re-install hint.
