---
"create-cartwright": minor
---

Add `cartwright design install <slug>` — install a marketplace design into an existing Cartwright project.

Fetches just `designs/<slug>/` from the public template mirror (giget subdir clone), then registers it in `designs/index.ts` (import + `DESIGNS` map entry) and `designs/options.ts` (a `DESIGN_OPTIONS` entry built from the pack's own metadata). Falls back to printing manual steps if the registry files don't match the expected shape. Run from a project root: `npx create-cartwright design install engineered` (a `cartwright` bin alias is also installed for global installs). Closes the marketplace loop — browse at cartwright.app/designs, then install the code.
