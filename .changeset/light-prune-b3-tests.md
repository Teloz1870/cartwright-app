---
"create-cartwright": patch
---

Light profile: prune the engine's B3 module-manifest tests (scaffold-manifest drift, site-profile import closure) and the newer `ucp-capability-profile` test — they pin the FULL module graph/registry and fail typecheck or assertions in a pruned light scaffold (first surfaced by the ref=next scaffold-gate run).
