---
"create-cartwright": patch
---

Scaffold first-run now prefers the engine's robust `db:setup` (v0.27.0+): it tries `prisma db push` and, if the intermittent Prisma 7.8 schema-engine error hits, falls back to applying the schema via the libSQL client (bypassing the flaky schema engine) before seeding — so onboarding can't get stuck. Older templates without `db:setup` keep the legacy push (+retry) + seed path. The "Next steps" list and the failure message now point at `db:setup` instead of telling the user to "just run it again."
