---
"create-cartwright": minor
---

`--profile light|full` — Cartwright Light is now the DEFAULT scaffold profile. One engine, two scaffold profiles: `light` (default) scaffolds a website-mode site with the curated design set (aurora-site, fable, stillwater, halo, jungle, meridian, brutalist, apex + the structural aurora-shop/studio) and prunes the FULL-ONLY modules (A2A/agent-marketplace, UCP identity-linking, WebMCP, hoptify, and 16 non-curated design packs — re-installable via `cartwright design install <slug>`). `--profile full` keeps everything and is byte-identical to the pre-profile scaffold; `--template agent-marketplace` requires it. Also adds `--help`. A real site — design, database, backend — live in minutes.
