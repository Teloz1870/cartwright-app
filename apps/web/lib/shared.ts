export const appName = 'cartwright';
export const docsRoute = '/docs';
export const docsImageRoute = '/og/docs';
export const docsContentRoute = '/llms.mdx/docs';

export const gitConfig = {
  user: 'Teloz1870',
  repo: 'cartwright-app',
  branch: 'main',
};

export const social = {
  github: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  discord: 'https://cartwright.app/discord',
  npm: 'https://www.npmjs.com/package/create-cartwright',
};

export const isGithubPublic =
  process.env.NEXT_PUBLIC_GITHUB_PUBLIC === 'true';
