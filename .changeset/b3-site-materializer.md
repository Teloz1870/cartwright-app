---
"create-cartwright": minor
---

New `--profile site`: a plain website with NO database, admin, auth or commerce — cut from the engine's `scaffold/manifest.json` module graph by the new profile materializer (seam-static copies, manifest-driven file exclusion, registry codemods, package.json rewrite, `.cartwright/profile.json` v2). Optional modules via `--with` (contact-form included by default, Resend-only). Requires a template ref that ships the manifest (engine ≥ the B3 release); `light`/`full` are unchanged. The release scaffold-gate gains a third `site` leg proving the materialization db-free end-to-end.
