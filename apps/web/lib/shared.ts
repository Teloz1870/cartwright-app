export const appName = 'cartwright';
export const docsRoute = '/docs';
export const docsImageRoute = '/og/docs';
export const docsContentRoute = '/llms.mdx/docs';

export const gitConfig = {
  user: 'Teloz1870',
  repo: 'cartwright-app',
  branch: 'main',
};

// `discord` points at the GitHub repo until a Discord server exists — keeps it
// an external URL so Next.js does not RSC-prefetch a same-origin redirect
// (which fails CORS). Swap to the invite URL once the server is created.
export const social = {
  github: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  discord: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  npm: 'https://www.npmjs.com/package/create-cartwright',
};

export const isGithubPublic =
  process.env.NEXT_PUBLIC_GITHUB_PUBLIC === 'true';

// Public contact address — single source of truth for footer, legal pages,
// and the support FAQ. Update here to change it everywhere.
export const contactEmail = 'km@teloz.net';
