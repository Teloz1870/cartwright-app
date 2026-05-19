# Contributing to cartwright-app

Thanks for your interest! cartwright-app is the docs site + CLI for [Cartwright](https://github.com/Teloz1870/cartwright). Both live in this monorepo.

## Local development

```bash
pnpm install
pnpm dev
```

This starts all apps in parallel via Turborepo.

## Apps

- **`apps/web`** — Fumadocs-powered docs site. Run only: `pnpm --filter web dev`
- **`apps/cli`** — `create-cartwright` CLI. Run only: `pnpm --filter cli dev`

## Pull requests

1. Fork the repo (when public) or create a feature branch
2. Branch naming: `feat/<short-desc>`, `fix/<short-desc>`, `docs/<short-desc>`
3. Commits follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`
4. Run `pnpm lint && pnpm typecheck && pnpm test` locally before pushing
5. Open PR against `main` with description of change + screenshots if UI

## Adding a changelog entry (for CLI releases)

```bash
pnpm changeset
```

Then commit the generated `.changeset/*.md` file alongside your changes. Changesets-Action picks it up on merge to `main` and publishes the next CLI version to npm.

## Docs contributions

Docs live in `apps/web/content/docs/`. Each MDX file gets an "Edit this page on GitHub" link in the rendered output — that's the easiest way to find what to edit.

## Reporting issues

Use the issue templates in `.github/ISSUE_TEMPLATE/`:
- 🐛 Bug report — for broken docs, broken CLI commands, broken links
- ✨ Feature request — new docs sections, CLI flags, etc.
- 📚 Docs improvement — typos, clarifications, missing content

## Security issues

**Do not** open public issues for security vulnerabilities. Email **security@cartwright.app** instead. See [SECURITY.md](./SECURITY.md).
