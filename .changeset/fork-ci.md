---
"create-cartwright": minor
---

Every scaffold now ships a CI safety net: the CLI writes `.github/workflows/ci.yml`
(typecheck · unit tests · migration verify · production build, with dummy env vars) into the
project before the initial commit. The public template mirror cannot carry workflow files
(token scope), so the CLI is the delivery path — your repo, your CI.
