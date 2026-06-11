---
"create-cartwright": patch
---

DX-trim for the light profile: light scaffolds now prune three proven-orphan dependencies from package.json before install — `@ai-sdk/openai` (the engine only ever imports `@ai-sdk/openai-compatible`), `fast-check` (sole consumer is the pruned `tests/unit/negotiation` property test), and `ts-node` (everything runs via `tsx`; prisma.config.ts documents this explicitly). The committed `pnpm-lock.yaml` is surgically kept in sync (root-importer entries removed) so the first `pnpm install` still skips the resolution step and keeps every remaining version pinned exactly as tested — verified e2e (install → db:setup → build → 1016 scaffold tests → /da 200). −18 packages / ~17 MB in node_modules; `--profile full` remains byte-identical to before.
