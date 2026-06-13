---
"create-cartwright": patch
---

Light-profile scaffolds now fully remove the full-only `hoptify` plugin, so `pnpm test` is green on a fresh light scaffold. The light profile already pruned hoptify's impl (`lib/hoptify`, `app/admin/hoptify`), but the plugin stayed registered and the shipped `tests/unit/plugins.test.ts` then failed its "every declared file exists" + "route mounts wired" invariants on the now-missing files. The profile now also de-registers hoptify from `plugins/registry.ts` (a codemod mirroring the design-registry prune, so `/api/admin/plugins` doesn't list a pruned plugin), prunes the `plugins/hoptify/` dir, and prunes `tests/unit/plugins.test.ts` (which pins the full plugin registry — including hoptify-specific assertions — and so can't survive the prune, like `design-mixable.test.ts`).
