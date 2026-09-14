---
"create-cartwright": patch
---

Security: the CLI no longer pulls `tar@6.2.1` into every scaffold run. `giget` 1.x depended on it, and `pnpm audit` reports one critical, eight high and three moderate advisories against that line (decompression DoS, path traversal, arbitrary file overwrite). `giget` 3.3.1 has no dependencies; it bundles its own copy of node-tar 7.5.21 — every advisory in that audit is patched at 7.5.21 or earlier, and `pnpm audit` cannot see a bundled copy either way — and still unpacks the template tarball in-process (it spawns `git` only for `git:` sources, which the CLI never uses). `downloadTemplate` behaves the same for the three places the CLI calls it; a real `--profile site` scaffold of v0.57.0 through the bumped CLI produced the same 558 files. Measured after the bump: `pnpm why tar` is empty and `pnpm audit --prod` reports 0 critical, 0 high.

One behaviour does change: giget 1 read `HTTPS_PROXY`/`HTTP_PROXY` itself, giget 3 uses Node's own `fetch`, which honours them only when the process runs with `NODE_USE_ENV_PROXY=1` or `--use-env-proxy` (Node 24.0 / 22.21 and later; older Node cannot proxy `fetch` at all). When a template fetch fails and a proxy variable is set, the CLI now says exactly which of those applies.
