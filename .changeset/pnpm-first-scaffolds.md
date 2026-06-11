---
"create-cartwright": patch
---

Prefer pnpm when present: `npx create-cartwright` always reports npm in the user agent, but every doc in the scaffold says `pnpm <cmd>` — an npm-locked scaffold guaranteed a package-manager mismatch on the first `pnpm add`. Explicit `--pm` still wins. Also: the light profile no longer warns about deps already removed at the engine source.
