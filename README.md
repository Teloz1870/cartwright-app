# cartwright-app

[![npm](https://img.shields.io/npm/v/create-cartwright?color=d97757&label=create-cartwright)](https://www.npmjs.com/package/create-cartwright)
[![npm downloads](https://img.shields.io/npm/dw/create-cartwright?color=d97757)](https://www.npmjs.com/package/create-cartwright)
[![license](https://img.shields.io/badge/license-MIT-d97757)](./LICENSE)
[![docs](https://img.shields.io/badge/docs-cartwright.app-0a0a0b)](https://cartwright.app)

Monorepo for [cartwright.app](https://cartwright.app) — the docs+marketing site for [Cartwright](https://github.com/Teloz1870/cartwright), an AI-first Next.js webshop template.

> Scaffold a production-shaped AI-first webshop in one command:
> ```bash
> npx create-cartwright@latest my-shop
> ```

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
