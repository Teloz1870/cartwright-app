---
"create-cartwright": patch
---

Make `prisma migrate deploy` work on a fresh scaffold.

The template's migration history is drifted: four models (`Lead`, `MigrationJob`, `Service`, `Subscription`) exist in `schema.prisma` but no migration creates them (the schema moved ahead via `db push` during development), so `prisma migrate deploy` failed on a fresh DB with `P3018: no such table: Service`. After install, the scaffolder now regenerates the migrations as a single clean from-empty baseline derived from `schema.prisma`, so `migrate deploy` applies the full schema successfully. `db push` continues to work as before. Best-effort and sqlite/turso only; if generation fails the existing migrations are left untouched.
