# create-cartwright

CLI scaffolder for AI-first webshops powered by [Cartwright](https://cartwright.app).

## Quick start

```bash
npx create-cartwright@latest my-shop
cd my-shop
npx prisma migrate deploy
npx prisma db seed
pnpm dev
```

Or with all defaults (no prompts):

```bash
npx create-cartwright@latest my-shop --yes --db=turso --ai
```

## Flags

| Flag | Default | What it does |
|---|---|---|
| `--yes`, `-y` | false | Skip prompts, use defaults |
| `--db=<turso\|postgres\|sqlite>` | (prompt) | Database choice — drives next-steps guidance |
| `--ai` / `--no-ai` | (prompt) | Enable / disable the AI commerce features hint |
| `--ref=<stable\|next\|tag\|branch>` | `stable` | Template channel (see below) |
| `--pm=<pnpm\|npm\|yarn\|bun>` | auto-detect | Package manager for install |
| `--no-install` | false | Skip dependency install |
| `--no-git` | false | Skip `git init` + initial commit |

## Template channels

| Channel | What it is | When to use |
|---|---|---|
| `stable` (default) | Latest tagged release of the template. Battle-tested across the maintainer's canary deploys before tagging. | Production scaffolds. New shops. |
| `next` | Bleeding-edge: the `next` branch on `cartwright-template`, updated on every push to the template's source repo. | Trying features that haven't been cut into a stable release yet. Not for production. |
| `vX.Y.Z` (any tag) | Pin to a specific historical release. | Reproducing a known-good scaffold. |
| `<branch>` (any branch) | Pin to a branch on the mirror. | Power-user experimentation. |

Examples:

```bash
npx create-cartwright@latest my-shop                    # → stable (default)
npx create-cartwright@latest my-shop --ref next         # → bleeding-edge
npx create-cartwright@latest my-shop --ref v0.1.0-beta  # → pin to a tag
```

The spinner shows the channel and the resolved ref so you can see exactly what you pulled — useful when reporting issues.

## What it does

1. Three prompts (project name, database, AI features) — skippable with `--yes`.
2. Downloads a sanitised snapshot from [`cartwright-template`](https://github.com/Teloz1870/cartwright-template) at the resolved `--ref` channel (default `stable`).
3. Generates a random 32-byte `AUTH_SECRET` and writes `.env.local`.
4. Patches `brand.config.ts` — `storeName` (Title Case of project name) + `storeSlug` (kebab-case).
5. Optional: `git init` + initial commit.
6. Optional: install dependencies with the detected (or specified) package manager.
7. Prints database-aware next-steps with copy-pastable commands.

## Requirements

- Node.js ≥ 22
- (Optional) git, for the initial commit
- (Optional) pnpm/npm/yarn/bun, for dependency install

## Why a public mirror?

The Cartwright template repo is currently in private early access. The CLI fetches from a **public sanitised mirror** (`cartwright-template`) that auto-syncs on every release tag — so you don't need a GitHub token to scaffold. When the template flips to public, the CLI will point at it directly with no breaking change.

## Source

This CLI is part of the [`cartwright-app`](https://github.com/Teloz1870/cartwright-app) monorepo. PRs welcome.

## License

MIT
