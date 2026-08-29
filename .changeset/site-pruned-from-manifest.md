---
"create-cartwright": patch
---

The engine decides which dev-only scripts a `--profile site` scaffold prunes.

The list was written out by hand in two repositories with nothing checking they
agreed, so a script added to one and not the other meant either the engine's
audit asserted a pruning that never happened, or this CLI shipped a scaffold
containing a script it cannot run. The CLI now reads `sitePrunedScripts` from
`scaffold/manifest.json`; the old constant remains only as a fallback for
template refs cut before that field existed.
