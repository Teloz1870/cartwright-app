---
"create-cartwright": patch
---

Light-profile scaffolds no longer ship the Teloz holding-company agency pages (`/priser`, `/cases`, `/services`) — they are `isSaas`-gated corporate pages with no use in a customer website scaffold (the engine keeps them for the Teloz canary; `--profile full` still includes them). The initial git commit is now amended after the post-commit migration-baseline + marketplace-manifest regeneration, so a freshly scaffolded project has a **clean `git status`** instead of two already-modified tracked files.
