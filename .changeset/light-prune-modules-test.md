---
"create-cartwright": patch
---

Light profile: prune `tests/unit/modules.test.ts` as well — its "every declared module file exists on disk" invariant pins the full module graph (light prunes design packs). The release scaffold-gate's boot step also sets `ALLOW_SQLITE_IN_PRODUCTION=1` so the engine's production sqlite guard (launch-hardening) doesn't fail the sqlite-based gate legs.
