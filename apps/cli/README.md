# create-cartwright

CLI scaffolder for AI-first webshops powered by [Cartwright](https://github.com/Teloz1870/cartwright).

## Quick start

```bash
npx create-cartwright@latest my-shop
cd my-shop
pnpm install
pnpm dev
```

Or with all defaults:

```bash
npx create-cartwright@latest my-shop --yes
```

## Flags

| Flag | Default | What |
|---|---|---|
| `--yes`, `-y` | false | Skip prompts, use all defaults |
| `--template=<slug>` | `generic` | Industry-template (only `generic` in v0.1) |
| `--pm=<pnpm\|npm\|yarn\|bun>` | auto-detect | Package manager for install |
| `--no-install` | false | Skip dependency install |
| `--no-git` | false | Skip git init + initial commit |

## What it does

1. Prompts for project name, database choice, AI features (3 questions max)
2. Downloads the latest cartwright-template snapshot from [github.com/Teloz1870/cartwright-template](https://github.com/Teloz1870/cartwright-template) via `giget`
3. Pre-fills `.env.local` from `.env.example` with your store-name
4. Optionally runs `pnpm install` (or your chosen package manager)
5. Optionally `git init` + initial commit

## Requirements

- Node.js ≥ 22
- (Optional) git, for the initial commit
- (Optional) pnpm/npm/yarn/bun, for dependency install

## Source

This CLI is part of the [`cartwright-app`](https://github.com/Teloz1870/cartwright-app) monorepo. See its `apps/cli/` directory for source. PRs welcome.

## License

MIT
