import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/docs',
        destination: '/docs/introduction',
        permanent: false,
      },
      {
        source: '/github',
        destination: 'https://github.com/Teloz1870/cartwright-app',
        permanent: false,
      },
      {
        source: '/npm',
        destination: 'https://www.npmjs.com/package/create-cartwright',
        permanent: false,
      },
      {
        // No Discord server yet — early-access folks watch the repo.
        // Swap this destination to the invite URL once the server exists.
        source: '/discord',
        destination: 'https://github.com/Teloz1870/cartwright-app',
        permanent: false,
      },
      {
        source: '/pricing',
        destination: '/services',
        permanent: false,
      },
    ];
  },
};

export default withMDX(config);
