# create-cartwright

[![npm version](https://img.shields.io/npm/v/create-cartwright)](https://www.npmjs.com/package/create-cartwright)
[![npm downloads](https://img.shields.io/npm/dw/create-cartwright)](https://www.npmjs.com/package/create-cartwright)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/Teloz1870/cartwright-template/blob/main/LICENSE)
[![node >= 22](https://img.shields.io/badge/node-%E2%89%A5%2022-brightgreen)](https://nodejs.org)

**A real site — design, database, backend — live in minutes.**

CLI scaffolder for AI-first sites and webshops powered by [Cartwright](https://cartwright.app) —
the open-source Next.js 16 + React 19 + Prisma + Stripe engine with a built-in MCP server,
JSON-LD everywhere, and an admin your AI agent can drive.

## Quick start

```bash
npx create-cartwright@latest my-site
cd my-site
pnpm dev
```

That's it. The CLI installs dependencies, creates the database schema and seeds it —
the **admin login** is printed at the end of scaffolding and saved to `.admin-credentials`
(gitignored). Open `http://localhost:3000`, sign in at `/account/login`.

No prompts at all:

```bash
npx create-cartwright@latest my-shop --yes --db=turso --ai
```

Scaffolded with `--no-install`? Then run the steps yourself:
`pnpm install && pnpm db:setup && pnpm dev` (never `prisma migrate deploy` —
`db:setup` is the robust path and prints the admin login).

## See it live

Three production sites run on the exact engine you scaffold:

- 🕶️ [solbrillen.dk](https://solbrillen-dk-teloz1.vercel.app/da) — eyewear webshop, every feature flag on
- ☕ [demo.cartwright.app](https://demo.cartwright.app) — modern coffee-shop demo (View Transitions, 3D hero)
- 🏢 [cartwright.app](https://cartwright.app) — docs, design gallery, comparisons

## Choose Cartwright when — and when not

**Choose Cartwright** when you want a real website or webshop in your own repo (one command →
designed homepage, database, admin, checkout), an AI agent building and operating it (MCP +
tool registry + agent rules in the box), agentic-commerce protocols implemented rather than
promised, and no platform fee or lock-in.

**Prefer something else** when zero-ops hosted is the point (Shopify, Wix), you want
browser-only prompt-to-app (Lovable, bolt.new, v0), you need enterprise multi-channel B2B
(Saleor), or you're building a novel non-commerce app from scratch (create-next-app).
Honest long-form comparisons: [cartwright.app/compare](https://cartwright.app/compare).

## Profiles

One engine, two scaffold profiles — never a separate light codebase.

| Profile | What you get |
|---|---|
| `light` (**default**) | The lean "real site in minutes" kit: website-mode default, a curated design set (`aurora-site`, `fable`, `stillwater`, `halo`, `jungle`, `meridian`, `brutalist`, `apex` + the structural `aurora-shop`/`studio`), full mode-gated webshop, builder/mixer, genome, MCP/JSON-LD discovery, admin, database. Heavy full-only modules are pruned from the scaffold: A2A/agent-marketplace, UCP identity-linking, WebMCP, hoptify, and the 16 non-curated design packs. |
| `full` | Everything the engine ships — identical to the pre-profile scaffold. Required for `--template agent-marketplace`. |

```bash
npx create-cartwright@latest my-site                  # light (default)
npx create-cartwright@latest my-shop --profile full   # everything
```

Pruned designs can be added back to a light project at any time:

```bash
npx cartwright design install <slug>
```

## Flags

| Flag | Default | What it does |
|---|---|---|
| `--yes`, `-y` | false | Skip prompts, use defaults |
| `--profile=<light\|full>` | `light` | Scaffold profile (see above) |
| `--template=<slug>` | `website-corporate` (light) / `generic` (full) | Mode + seed-data preset |
| `--look=<url>` | — | Scaffold wearing a shared look (see below) |
| `--help`, `-h` | — | Print usage |
| `--db=<turso\|postgres\|sqlite>` | (prompt) | Database choice — drives next-steps guidance |
| `--ai` / `--no-ai` | (prompt) | Enable / disable the AI commerce features hint |
| `--ref=<stable\|next\|tag\|branch>` | `stable` | Template channel (see below) |
| `--pm=<pnpm\|npm\|yarn\|bun>` | auto-detect | Package manager for install |
| `--no-install` | false | Skip dependency install |
| `--no-git` | false | Skip `git init` + initial commit |

## Looks (`--look <url>`)

Every Cartwright shop can share its **look** — skin (design), palette, 3D scene and chrome —
as a `cartwright-composition-v1` JSON file via its public `GET /api/look` endpoint (the
shop owner enables the `lookSharing` flag). Scaffold a new project wearing that look:

```bash
npx create-cartwright@latest my-shop --yes --look https://that-shop.example/api/look
```

After the project is created and the database is seeded, the CLI applies the look:

- **skin** → `designSlug: "<skin>"` in `brand.config.ts` (part of the initial commit),
- **palette / scene / chrome** → the seeded database's branding settings — the same
  fields the engine's `composition.apply` tool writes.

The look **never carries copy**: voice/genome text and homepage layouts are not part of
the public sharing boundary, and the CLI ignores them if present.

Interaction with `--profile`: the light profile (default) ships a curated design set, so
if the look's skin isn't included, the CLI keeps the default design and tells you how to
get it — `npx cartwright design install <slug>` afterwards, or re-scaffold with
`--profile full`. The palette/scene/chrome still apply either way (every design is
palette-adaptive). Since the palette/scene/chrome live in the database, they're skipped
under `--no-install` (no seeded DB yet).

**Fail-soft by design:** an unreachable URL, invalid JSON, wrong schema, unknown design
or database hiccup prints one warning and the scaffold completes unchanged — a broken
look never breaks a scaffold.

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

## Where the template comes from

The CLI scaffolds from [`cartwright-template`](https://github.com/Teloz1870/cartwright-template) — the public, MIT-licensed engine template repo, auto-synced on every release tag. No GitHub token required, and the code you scaffold is yours to fork, modify, and ship.

## Source

This CLI is part of the [`cartwright-app`](https://github.com/Teloz1870/cartwright-app) monorepo. PRs welcome.

## License

MIT
