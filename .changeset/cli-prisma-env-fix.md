---
"create-cartwright": patch
---

Fix `prisma migrate` / `prisma db seed` failing on a fresh scaffold with `Environment variable not found: DATABASE_URL`.

The scaffolder wrote `DATABASE_URL` only into `.env.local`, but the Prisma CLI auto-loads `.env` — never `.env.local` (a Next.js-only convention). So the documented next steps (`npx prisma migrate deploy`, `npx prisma db seed`) failed out of the box for every new project. `patchEnvLocal` now also mirrors `DATABASE_URL` into `.env`; Next.js still reads `.env.local` at runtime, and `.env` is already gitignored in the template.
