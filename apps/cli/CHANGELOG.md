# create-cartwright

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
