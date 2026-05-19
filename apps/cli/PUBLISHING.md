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
3. After merging to `main`, the (planned) Changesets GitHub Action opens a "Version Packages" PR.
4. Merging that PR runs `pnpm release` and publishes to npm.

The release script is wired in `package.json:scripts.release`:

```json
"release": "turbo run build --filter=create-cartwright && changeset publish"
```

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
