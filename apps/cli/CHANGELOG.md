# create-cartwright

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
