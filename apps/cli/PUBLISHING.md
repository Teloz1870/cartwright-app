# Publishing `create-cartwright`

Operator playbook for releasing the existing npm package. Required: publish access to `create-cartwright` and a valid `NPM_TOKEN` repository secret.

## One-time repository setup

1. **Verify npm access:**
   ```bash
   npm whoami     # log in if needed: npm login
   npm view create-cartwright
   # → confirms the currently published package
   ```

2. **Add `NPM_TOKEN` repo secret** (for future CI auto-publish):
   - Generate: https://www.npmjs.com/settings/<your-username>/tokens → "Granular Access Token" → write access to `create-cartwright`
   - Set: `gh secret set NPM_TOKEN --repo Teloz1870/cartwright-app`

## Normal releases (Changesets workflow)

1. Add a changeset for any user-visible change:
   ```bash
   pnpm changeset
   ```
2. Commit the resulting `.changeset/<random>.md` file in your PR.
3. After merging to `main`, the Changesets GitHub Action (`.github/workflows/release.yml`) opens a "Version Packages" PR.
4. Merging that PR runs `pnpm release` and publishes to npm under `latest`.
5. The post-publish smoke workflow (`.github/workflows/postpublish-smoke.yml`) automatically scaffolds a throwaway project against the new version and asserts brand-config patch + AUTH_SECRET generation + no leaked files. If it fails, see the rollback playbook in `cartwright-private/internal-docs/mirror-setup.md`.

The release script is wired in `package.json:scripts.release`:

```json
"release": "turbo run build --filter=create-cartwright && changeset publish"
```

## Template version bump checklist (automated)

The CLI's `DEFAULT_REF` (the template tag that `--ref stable` resolves to) is auto-bumped via `.github/workflows/bump-template-ref.yml`. You don't manually edit `DEFAULT_REF` in `apps/cli/src/refs.ts` — let the automation do it.

**The auto-flow:**

1. A new engine release tag is mirrored to `cartwright-template`.
2. The mirror publishes the matching tag and release metadata.
3. The sync workflow fires `repository_dispatch` (event_type: `template-released`) at this repo, **if** `CARTWRIGHT_APP_DISPATCH_PAT` is set on cartwright-private. If not, daily cron at 06:17 UTC catches it within 24h.
4. `bump-template-ref.yml` runs:
   - Queries `cartwright-template` for the latest tag.
   - Compares to `DEFAULT_REF` in `apps/cli/src/refs.ts`.
   - If different: updates the value, adds a Changeset (patch bump), and opens a version-specific PR.
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

## Major releases

Use a major Changeset only for an intentionally breaking CLI contract. A marketing milestone or score change is not, by itself, a reason to change the semver major.
