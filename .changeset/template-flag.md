---
"create-cartwright": minor
---

Add `--template <slug>` flag for industry-specific scaffolding.

Choose between `generic` (default, webshop mode), `website-corporate` (corporate / holding site, no shop), `coffee` (modern ecommerce reference), `sunglasses` (legacy eyewear retail), or `agent-marketplace` (pure A2A backend with Anchor-Resume engine + Guardian middleware enabled by default).

The flag patches `brand.config.ts` after download to set `industryTemplate`, `mode`, and the four mode-defining feature flags (`features.{webshop, acp, a2a, adminAgenticDashboard}`) to the right starting values for that template. Customers can override any field manually after scaffold.
