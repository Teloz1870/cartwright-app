---
"create-cartwright": patch
---
`create-cartwright` now depends on zod 4.6.7 (was 4.4.3), which closes GHSA-mrhx-c7xc-m3w5 in the installed dependency: zod before 4.6.6 parsed every element of an array before checking its size limit. The CLI itself was not exposed, because it declares its shop-brief schema with zod but does not parse the model's brief with it at run time. This is a patched dependency with no behaviour change: the CLI's test suite passes on the new version.
