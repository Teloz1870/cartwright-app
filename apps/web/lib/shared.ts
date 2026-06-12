export const appName = 'cartwright';
export const docsRoute = '/docs';
export const docsImageRoute = '/og/docs';
export const docsContentRoute = '/llms.mdx/docs';

export const gitConfig = {
  user: 'Teloz1870',
  repo: 'cartwright-app',
  branch: 'main',
};

// `templateRepo` is the open-source engine template — public + MIT — that
// `npx create-cartwright` scaffolds from. `github` is this monorepo (the docs
// site + CLI), where docs/CLI issues live.
export const social = {
  github: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  templateRepo: 'https://github.com/Teloz1870/cartwright-template',
  npm: 'https://www.npmjs.com/package/create-cartwright',
  x: 'https://x.com/CartwrightApp',
};

/** X / Twitter handle — used for `twitter.site` / `twitter.creator` metadata. */
export const xHandle = '@CartwrightApp';

// Public contact address — single source of truth for footer, legal pages,
// and the support FAQ. Update here to change it everywhere.
export const contactEmail = 'hello@cartwright.app';
