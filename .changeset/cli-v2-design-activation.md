---
"create-cartwright": patch
---

Make the v2 AI-scaffolder actually produce a webshop in its own design + catalog.

Previously the AI brief was inert: the generated theme used non-existent token names (`--color-accent` instead of `--color-sol-*`) and was never activated, and the generated catalog was written to an unregistered path with a product shape that didn't match the seed — so a v2 "custom" shop rendered as the generic demo shop with a different name.

Now `injectBriefFiles` activates the brief end-to-end (all on the customer's scaffold copy):
- **Catalog** — `generateSeedData` emits the engine's `IndustryTemplate` shape (slug/description/priceDkk/images/stock/featured derived from the brief; priceDkk = priceMinor) and overwrites the registered `industry-templates/generic/seed-data.ts`, so `brand.industryTemplate: "generic"` seeds the brief's categories + products.
- **Theme** — recolours `themes/generic.css` core `--color-sol-*` values AND seeds `BrandingSettings.themeJson` (via a `prisma/seed.ts` patch) with the 6-token palette derived from the brief, which wins the runtime cascade over the design-pack defaults.
- `generateThemeCss` now emits the correct `--color-sol-*` tokens.

Verified end-to-end on a deterministic brief and a live AI brief (KaffeMekka): custom palette renders, the AI catalog seeds, `npm run build` passes, zero console errors.
