# Publishing `create-cartwright`

Operator playbook for first publish to npm. Required: an npm account with publish access to the `create-cartwright` package name.

## One-time setup (you)

1. **Claim the npm package name** (if not yet done):
   ```bash
   npm whoami     # log in if needed: npm login
   npm view create-cartwright
   # → if "404", the name is free
   ```

2. **Add `NPM_TOKEN` repo secret** (for future CI auto-publish):
   - Generate: https://www.npmjs.com/settings/<your-username>/tokens → "Granular Access Token" → write access to `create-cartwright`
   - Set: `gh secret set NPM_TOKEN --repo Teloz1870/cartwright-app`

## Manual first publish (this release)

From the repo root:

```bash
# 1. Apply the pending changeset → bumps apps/cli/package.json + writes CHANGELOG
pnpm version-packages

# 2. Build the CLI
pnpm --filter=create-cartwright build

# 3. Publish to npm with the beta tag
cd apps/cli
npm publish --tag beta --access public
```

The package will be available at `https://www.npmjs.com/package/create-cartwright`. Verify by running:

```bash
npx create-cartwright@beta test-shop --yes --no-install --no-git
```

## Future releases (Changesets workflow)

1. Add a changeset for any user-visible change:
   ```bash
   pnpm changeset
   ```
2. Commit the resulting `.changeset/<random>.md` file in your PR.
3. After merging to `main`, the Changesets GitHub Action (`.github/workflows/release.yml`) opens a "Version Packages" PR.
4. Merging that PR runs `pnpm release` and publishes to npm.
5. The post-publish smoke workflow (`.github/workflows/postpublish-smoke.yml`) automatically scaffolds a throwaway project against the new version and asserts brand-config patch + AUTH_SECRET generation + no leaked files. If it fails, see the rollback playbook in `cartwright-private/internal-docs/mirror-setup.md`.

The release script is wired in `package.json:scripts.release`:

```json
"release": "turbo run build --filter=create-cartwright && changeset publish"
```

## Template version bump checklist (automated)

The CLI's `DEFAULT_REF` (the template tag that `--ref stable` resolves to) is auto-bumped via `.github/workflows/bump-template-ref.yml`. You don't manually edit `DEFAULT_REF` in `apps/cli/src/index.ts` — let the automation do it.

**The auto-flow:**

1. You cut a tag in `cartwright-private`: `git tag v0.2.0 && git push --tags`.
2. `cartwright-private/.github/workflows/sync-to-mirror.yml` mirrors that tag to `cartwright-template/main` + creates the tag.
3. The sync workflow fires `repository_dispatch` (event_type: `template-released`) at this repo, **if** `CARTWRIGHT_APP_DISPATCH_PAT` is set on cartwright-private. If not, daily cron at 06:17 UTC catches it within 24h.
4. `bump-template-ref.yml` runs:
   - Queries `cartwright-template` for the latest tag.
   - Compares to `DEFAULT_REF` in `apps/cli/src/index.ts`.
   - If different: seds the new value, adds a Changeset (patch bump), opens a PR titled `chore(cli): bump template ref → v0.2.0`.
   - If equal: logs "no bump needed" and exits cleanly (the cron runs daily even when there's nothing to do).
5. **You review and merge the bump PR.** That's the only manual touchpoint.
6. Merge triggers the existing Release workflow → `create-cartwright@<new-patch>` on npm.
7. Post-publish smoke verifies the scaffold works.

**Manual trigger** (for testing or if the dispatch chain ever breaks):

```bash
gh workflow run bump-template-ref.yml --repo Teloz1870/cartwright-app
```

Idempotent — safe to run any time. If `DEFAULT_REF` already matches the latest tag, the workflow exits with "no bump needed".

**Before merging an auto-bump PR, sanity-check:**

- The new `DEFAULT_REF` value matches the tag you intended.
- `cartwright-template/<new-tag>` actually exists: `gh api repos/Teloz1870/cartwright-template/git/refs/tags/<new-tag>`.
- The Changeset file is `patch` bump (auto-bump is always patch since the template change is opaque to CLI users).

## Bumping out of beta to stable (`1.0.0`)

Only when the template contract is stable enough that minor bumps won't break user shops. Plan target: 8-12 weeks after the first dogfood shop ships.

```bash
# In a changeset
---
"create-cartwright": major
---
1.0 — template contract is stable.
```

Then run `pnpm version-packages` and verify the version bumps to `1.0.0` (drops the `-beta` suffix).
