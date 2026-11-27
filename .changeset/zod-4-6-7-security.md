---
"create-cartwright": patch
---
`create-cartwright` now depends on zod 4.6.7 (was 4.4.3), which closes GHSA-mrhx-c7xc-m3w5: an older zod parsed every element of an array before checking its size limit, so an oversized shop brief from the model could exhaust memory. The brief is now rejected on its size alone. Nothing else changes for you: the CLI's test suite passes unchanged on the new version.
