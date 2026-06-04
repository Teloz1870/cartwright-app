# create-cartwright

## 2.0.33

### Patch Changes

- de78837: Bump default template ref to v0.14.0 (was v0.11.0).
- a797f48: Bump default template ref to v0.17.0 (was v0.14.0). Ships v0.15.0 (true multi-currency + multi-language), v0.16.0 (AI-agent editability), and v0.17.0 (per-page Open Graph share cards) — all additive / default-off.

## 2.0.32

### Patch Changes

- ac8b18a: Onboarding: the CLI now headlines the GitHub → Vercel path in its next-steps and offers an optional "Publish to GitHub now?" step (uses `gh`, fail-soft to manual instructions). Adds a `--no-github` flag (skipped under `--yes`). Links the new beginner guide at cartwright.app/docs/getting-started/from-code-to-live.
- 46c2c8b: Bump default template ref to v0.11.0 (was v0.10.0).

## 2.0.31

### Patch Changes

- 8ef59da: Onboarding: the CLI now headlines the GitHub → Vercel path in its next-steps and offers an optional "Publish to GitHub now?" step (uses `gh`, fail-soft to manual instructions). Adds a `--no-github` flag (skipped under `--yes`). Links the new beginner guide at cartwright.app/docs/getting-started/from-code-to-live.
- 0ea626e: Bump default template ref to v0.10.0 (was v0.9.11).

## 2.0.30

### Patch Changes

- 46c705d: Bump default template ref to v0.9.11 (was v0.9.10).

## 2.0.29

### Patch Changes

- 838a2f0: Bump default template ref to v0.9.10 (was v0.9.9).

## 2.0.28

### Patch Changes

- e8a7713: Bump default template ref to v0.9.9 (was v0.9.8).

## 2.0.27

### Patch Changes

- e33c816: Bump default template ref to v0.9.8 (was v0.9.7).

## 2.0.26

### Patch Changes

- ad02efc: Bump default template ref to v0.9.7 (was v0.9.6).

## 2.0.25

### Patch Changes

- 63be864: Bump default template ref to v0.9.6 (was v0.9.5).

## 2.0.24

### Patch Changes

- b2ba50b: Bump default template ref to v0.9.5 (was v0.9.4).

## 2.0.23

### Patch Changes

- b495bbe: Bump default template ref to v0.9.4 (was v0.9.3).

## 2.0.22

### Patch Changes

- 0fa3727: Bump default template ref to v0.9.3 (was v0.9.2).

## 2.0.21

### Patch Changes

- 0179819: Bump default template ref to v0.9.2 (was v0.9.1).

## 2.0.20

### Patch Changes

- 5ca5514: Bump default template ref to v0.9.1 (was v0.9.0).

## 2.0.19

### Patch Changes

- ad79dc6: Bump default template ref to v0.9.0 (was v0.8.0).

## 2.0.18

### Patch Changes

- 99ca2d9: Personalize the v2 AI shop's homepage hero with the brief's brand.

  The active homepage (designs/webshop-classic/homepage.tsx) hardcoded "Your shop starts here" and the hero sub-headline only showed a generic default, so a v2 shop's landing didn't reflect the brand even after the palette + catalog were applied. `injectBriefFiles` now seeds `BrandingSettings.tagline` from the brief (drives the hero sub-headline) and swaps the hardcoded H1 for the brief's store name. The landing now reads e.g. "KaffeMekka" / "Din destination for kvalitetskaffe." in the brand palette.

## 2.0.17

### Patch Changes

- b34bd0f: Make the v2 AI-scaffolder actually produce a webshop in its own design + catalog.

  Previously the AI brief was inert: the generated theme used non-existent token names (`--color-accent` instead of `--color-sol-*`) and was never activated, and the generated catalog was written to an unregistered path with a product shape that didn't match the seed — so a v2 "custom" shop rendered as the generic demo shop with a different name.

  Now `injectBriefFiles` activates the brief end-to-end (all on the customer's scaffold copy):

  - **Catalog** — `generateSeedData` emits the engine's `IndustryTemplate` shape (slug/description/priceDkk/images/stock/featured derived from the brief; priceDkk = priceMinor) and overwrites the registered `industry-templates/generic/seed-data.ts`, so `brand.industryTemplate: "generic"` seeds the brief's categories + products.
  - **Theme** — recolours `themes/generic.css` core `--color-sol-*` values AND seeds `BrandingSettings.themeJson` (via a `prisma/seed.ts` patch) with the 6-token palette derived from the brief, which wins the runtime cascade over the design-pack defaults.
  - `generateThemeCss` now emits the correct `--color-sol-*` tokens.

  Verified end-to-end on a deterministic brief and a live AI brief (KaffeMekka): custom palette renders, the AI catalog seeds, `npm run build` passes, zero console errors.

## 2.0.16

### Patch Changes

- 5db63ac: Make `prisma migrate deploy` work on a fresh scaffold.

  The template's migration history is drifted: four models (`Lead`, `MigrationJob`, `Service`, `Subscription`) exist in `schema.prisma` but no migration creates them (the schema moved ahead via `db push` during development), so `prisma migrate deploy` failed on a fresh DB with `P3018: no such table: Service`. After install, the scaffolder now regenerates the migrations as a single clean from-empty baseline derived from `schema.prisma`, so `migrate deploy` applies the full schema successfully. `db push` continues to work as before. Best-effort and sqlite/turso only; if generation fails the existing migrations are left untouched.

## 2.0.15

### Patch Changes

- 3847968: Remove the Prisma 7 deprecation warning and the favicon 404 from fresh scaffolds.

  - **Prisma config:** the template kept its seed command in `package.json#prisma`, which Prisma 6.19 warns is deprecated (removed in Prisma 7) on every command. The scaffolder now migrates it to a `prisma.config.ts` that also loads dotenv (`.env` then `.env.local`) — required because Prisma stops auto-loading `.env` once a config file exists, so DATABASE_URL keeps resolving.
  - **Favicon 404:** the Next metadata icon route (`/icon`, no file extension) was caught by the proxy matcher and locale-prefixed to `/da/icon`, which 404s. The scaffolder adds `icon` to the matcher exclusion so it serves directly.

  Both verified end-to-end: a fresh scaffold runs `prisma db push` + `db seed` with no deprecation warning, serves `/icon` 200, and passes `npm run build`.

## 2.0.14

### Patch Changes

- 43a64e8: Make `next build` (and Vercel deploys) actually pass on a fresh scaffold.

  Two issues broke the production build of every scaffold (dev did not catch them because `next dev` does not fail on type errors):

  - **industryTemplate narrowed to a literal.** The brand-config patch wrote `industryTemplate: "generic"` as a bare literal. Seven files compare `brand.industryTemplate === "saas"`, which then became a "no overlap" type error. It is now emitted with a union cast (`as "saas" | "coffee" | …`), matching the existing `mode` cast.
  - **Dependency drift from lockfile deletion.** `tryInstall` deleted the template's committed `package-lock.json`, so `npm install` resolved `^` ranges to newer, untested versions — e.g. a newer Stripe SDK that rejects the pinned `apiVersion` literal. It now keeps the lockfile matching the chosen package manager, so installs are deterministic and match the versions the template was tested against.

  Verified end-to-end: a fresh `--db=sqlite` scaffold now passes `npm run build`.

## 2.0.13

### Patch Changes

- ce8b501: Polish the default storefront: no hero-video 404, no empty eyewear filters.

  - The template's `HeroVideo` hardcodes `<source>` tags for `/hero/hero-v4.webm`+`.mp4`, demo-specific assets not shipped in the base template, so a fresh scaffold 404s twice on the homepage. The scaffolder now removes those `<source>` tags from the customer copy, leaving a poster-only hero (no network request, no 404).
  - The catalog filters rendered "Frame color" / "Lens color" selects unconditionally — eyewear-specific fields that appear as empty dropdowns on non-eyewear shops. They're now wrapped in a length guard, so they only show when the shop actually has those attributes.

  Both are wrapping/removal edits that keep all referenced variables in use, so the customer's build is unaffected.

## 2.0.12

### Patch Changes

- af1898a: Remove the upstream Teloz footer attribution from scaffolded projects.

  `components/Footer.tsx` hardcodes "Ejet og drevet af Teloz ApS" (linking to teloz.net) plus a personal GitHub link — correct for the engine repo (which is the live Teloz site) but wrong on every customer's footer. The scaffolder now rewrites the customer's footer copy (store name, neutral URL, GitHub link removed) and also neutralizes `legalName` + the footer disclaimer in `brand.config.ts`. Pure-text replacements, so the customer's build is unaffected.

## 2.0.11

### Patch Changes

- 490e31c: Make a fresh scaffold's identity, DB setup and config internally consistent.

  - **Branding leak:** the scaffolder only replaced `storeName`/`storeSlug`, so every project (including the v2 AI path) shipped the upstream template's Teloz identity — `metadata.title: "Teloz Agency"`, `domain`/`url` `teloz.net`, and `@teloz.net` contact + seeded-admin emails (the seed creates its admin user from `brand.emails.admin`). `patchBrandConfigContent` now also neutralizes the SEO title/description, domain, URL and email addresses based on the project name (`example.com` placeholders).
  - **Inconsistent ecommerce flag:** a `webshop`/`generic` scaffold left `ecommerceEnabled: false` while `mode: "webshop"`, so the storefront rendered with cart + product nav gated off. `ecommerceEnabled` now tracks the template's `webshop` feature.
  - **DB setup:** the printed next steps used `prisma migrate deploy`, which fails on a fresh DB due to migration-history drift. They now use `prisma db push` (the correct path for a brand-new project), and an "Admin login" hint explains the magic-link `.mail-previews/` flow.

## 2.0.10

### Patch Changes

- 5e2fa59: Fix `prisma migrate` / `prisma db seed` failing on a fresh scaffold with `Environment variable not found: DATABASE_URL`.

  The scaffolder wrote `DATABASE_URL` only into `.env.local`, but the Prisma CLI auto-loads `.env` — never `.env.local` (a Next.js-only convention). So the documented next steps (`npx prisma migrate deploy`, `npx prisma db seed`) failed out of the box for every new project. `patchEnvLocal` now also mirrors `DATABASE_URL` into `.env`; Next.js still reads `.env.local` at runtime, and `.env` is already gitignored in the template.

## 2.0.9

### Patch Changes

- 12c63de: Fix v2 AI-scaffolder crashing with `Unexpected status 404` on Gemini key validation.

  The hardcoded `gemini-1.5-flash` model has been retired in the Gemini API, so `validateKey` received a 404 even for valid keys and crashed the whole scaffolder. Updated to `gemini-2.0-flash`.

  Also hardened `resolveKeyMode`: an unexpected/thrown validation result (404, 5xx, network) now degrades gracefully to the manual (v1) scaffold instead of crashing, so a future model retirement can't brick the CLI. Fixed the stale `v2.0.0-beta` intro banner to read the real version from `package.json`.

## 2.0.8

### Patch Changes

- 2d86d70: Bump default template ref to v0.8.0 (was v0.7.0).

## 2.0.7

### Patch Changes

- 6228bfb: Bump default template ref to v0.7.0 (was v0.6.0).

## 2.0.6

### Patch Changes

- 5ec8c2b: Bump default template ref to v0.6.0 (was v0.5.0).

## 2.0.5

### Patch Changes

- 7fbf19e: Bump default template ref to v0.5.0 (was v0.4.0).

## 2.0.4

### Patch Changes

- 90dc086: Bump default template ref to v0.4.0 (was v0.3.0).

## 2.0.3

### Patch Changes

- 30cd494: Fix `ERR_MODULE_NOT_FOUND` at runtime — relative imports now include the `.js` suffix required by Node.js ESM resolution. The package is `"type": "module"` and tsconfig uses `moduleResolution: "Bundler"` which permits extension-less imports at compile time but Node.js cannot resolve them at runtime without the explicit extension. Affected: 2.0.1 (deprecated) and 2.0.0-beta.1 if anyone tried to actually run them.
- 1057a96: Bump default template ref to v0.3.0 (was v0.2.0).

## 2.0.1

### Patch Changes

- 597dd0c: Bump default template ref to v0.2.0 (was v0.1.0-beta).

## 2.0.0

### Minor Changes

- e688c9e: Add `--ref stable` and `--ref next` channel aliases.

  - `--ref stable` (default) resolves to the latest tagged template release — same behaviour as before, but explicit.
  - `--ref next` opts into the bleeding-edge `next` branch of `Teloz1870/cartwright-template`, which is updated on every push to `cartwright-private/main`. Not recommended for production scaffolds; useful for trying new features that haven't been tagged for stable release yet.
  - `--ref <tag-or-branch>` continues to work for pinning to a specific historical tag or arbitrary mirror branch.

  The spinner now shows `alias → resolved-ref` so users can see which tag was actually pulled (helpful for support tickets).

- 3f76968: Add `--template <slug>` flag for industry-specific scaffolding.

  Choose between `generic` (default, webshop mode), `website-corporate` (corporate / holding site, no shop), `coffee` (modern ecommerce reference), `sunglasses` (legacy eyewear retail), or `agent-marketplace` (pure A2A backend with Anchor-Resume engine + Guardian middleware enabled by default).

  The flag patches `brand.config.ts` after download to set `industryTemplate`, `mode`, and the four mode-defining feature flags (`features.{webshop, acp, a2a, adminAgenticDashboard}`) to the right starting values for that template. Customers can override any field manually after scaffold.
