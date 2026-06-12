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
        source: '/services',
        destination: '/pricing',
        permanent: false,
      },
    ];
  },
};

export default withMDX(config);
