---
"create-cartwright": minor
---

Webshop templates (`--template coffee | sunglasses | generic`) now scaffold with `brand.features.webMcp: true` — the store is WebMCP-native out of the box: page-contextual browser tools register the moment an agent-capable browser opens it, while the render stays byte-identical everywhere else. Website-mode and agent-marketplace scaffolds keep the flag off (it carries an ecommerce precondition). README/help/docs updated to the same story.
