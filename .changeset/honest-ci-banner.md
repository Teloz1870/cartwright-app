---
"create-cartwright": minor
---

The success banner no longer promises CI that cannot run. Every scaffold gets `.github/workflows/ci.yml`, but a workflow file only runs once GitHub has the repository — so the banner now checks for a git remote and says **"inactive until this project has a remote"** when there is none, with the exact `gh repo create` command to fix it. Adds `--github` for non-interactive runs: `--yes` suppresses the publish prompt rather than answering it, so agents and CI now have an explicit way to ask for the private repo instead of silently ending up without one.
