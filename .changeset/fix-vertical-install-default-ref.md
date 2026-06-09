---
"create-cartwright": patch
---

Fix `cartwright vertical install`: its `DEFAULT_REF` was pinned to v0.32.0 (before the verticals registry existed), so `stable` resolved to a tag with no `verticals/` directory and the install failed. Bumped to v0.33.0 and wired into the auto-bump workflow so it tracks future releases alongside the scaffolder and design-install.
