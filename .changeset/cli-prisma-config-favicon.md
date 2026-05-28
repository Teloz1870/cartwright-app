---
"create-cartwright": patch
---

Remove the Prisma 7 deprecation warning and the favicon 404 from fresh scaffolds.

- **Prisma config:** the template kept its seed command in `package.json#prisma`, which Prisma 6.19 warns is deprecated (removed in Prisma 7) on every command. The scaffolder now migrates it to a `prisma.config.ts` that also loads dotenv (`.env` then `.env.local`) — required because Prisma stops auto-loading `.env` once a config file exists, so DATABASE_URL keeps resolving.
- **Favicon 404:** the Next metadata icon route (`/icon`, no file extension) was caught by the proxy matcher and locale-prefixed to `/da/icon`, which 404s. The scaffolder adds `icon` to the matcher exclusion so it serves directly.

Both verified end-to-end: a fresh scaffold runs `prisma db push` + `db seed` with no deprecation warning, serves `/icon` 200, and passes `npm run build`.
