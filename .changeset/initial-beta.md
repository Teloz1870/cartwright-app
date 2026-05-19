---
"create-cartwright": minor
---

Initial public beta of `create-cartwright`. Scaffolds a Cartwright shop from the public `Teloz1870/cartwright-template` mirror with three prompts (project name, database, AI features), generates `AUTH_SECRET`, patches `brand.config.ts`, and prints database-aware next-steps.

- Pinned to `v0.1.0-beta` of the template mirror by default; override with `--ref`.
- Flags: `--yes`, `--db=turso|postgres|sqlite`, `--ai`/`--no-ai`, `--pm=pnpm|npm|yarn|bun`, `--no-install`, `--no-git`, `--ref=<tag>`.
- Works without a GitHub token thanks to the public mirror pipeline.
