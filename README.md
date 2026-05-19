# cartwright-app

Monorepo for [cartwright.app](https://cartwright.app) — the docs+marketing site for [Cartwright](https://github.com/Teloz1870/cartwright), an AI-first Next.js webshop template.

## Apps + packages

| Path | Description |
|---|---|
| `apps/web` | Fumadocs-powered docs+marketing site → cartwright.app |
| `apps/cli` | `create-cartwright` npm package — scaffolder for new cartwright shops |
| `packages/shared` | Shared zod-schemas + brand-config-types between web + CLI |

## Local dev

```bash
pnpm install
pnpm dev   # turbo runs `dev` for all apps in parallel
```

## Repos

- **This repo** (`cartwright-app`) — public
- **`cartwright-template`** — public mirror of cartwright, auto-synced via GitHub Action
- **`cartwright`** — the actual template (private until milestones met; see plan)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).
