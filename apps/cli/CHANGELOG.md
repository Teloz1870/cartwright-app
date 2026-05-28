# create-cartwright

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
