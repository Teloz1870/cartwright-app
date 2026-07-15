---
"create-cartwright": minor
---

New subcommand: `cartwright doctor` — a read-only health check for existing projects.
Seven checks (project sentinels, `.cartwright/release.json` marker, engine-vs-CLI version
compare (offline), scaffold profile, Node ≥ 22, env preflight for `AUTH_SECRET` + database
URL, and the project's own `db:verify` migration-baseline gate), with `--json` output for
machines. Diagnostic only: no fixes, no mutations, no network. Also consolidates the
triplicated `DEFAULT_REF`/`REF_ALIASES` constants into a single shared `src/refs.ts`
module (the bump-template-ref workflow now seds one file).
