---
"create-cartwright": patch
---

Security: the CLI no longer pulls `tar@6.2.1` into every scaffold run. `giget` 1.x depended on it, and `pnpm audit` reports one critical and seven high advisories against that line (decompression DoS, path traversal, arbitrary file overwrite). `giget` 3.3.1 has no `tar` dependency at all, and `downloadTemplate` behaves the same for the three places the CLI calls it. Measured after the bump: `pnpm why tar` is empty and `pnpm audit --prod` reports 0 critical.
