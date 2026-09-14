---
"create-cartwright": patch
---

Security: the CLI no longer pulls `tar@6.2.1` into every scaffold run. `giget` 1.x depended on it, and `pnpm audit` reports one critical and seven high advisories against that line (decompression DoS, path traversal, arbitrary file overwrite). `giget` 3.3.1 has no `tar` dependency; it bundles its own copy of node-tar, built against `tar@^7.5.21` — every advisory in that audit is patched at 7.5.21 or earlier — and still unpacks the template tarball in-process (it spawns `git` only for `git:` sources, which the CLI never uses). `downloadTemplate` behaves the same for the three places the CLI calls it; a real `--profile site` scaffold of v0.57.0 through the bumped CLI produced the same 558 files. Measured after the bump: `pnpm why tar` is empty and `pnpm audit --prod` reports 0 critical, 0 high.
