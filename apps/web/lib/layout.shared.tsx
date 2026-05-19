import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { Wordmark } from '@/components/wordmark';
import { appName, gitConfig, isGithubPublic, social } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <Wordmark />,
      url: '/',
    },
    links: [
      { text: 'Docs', url: '/docs' },
      { text: 'Showcase', url: '/showcase' },
      { text: 'Changelog', url: '/changelog' },
    ],
    githubUrl: isGithubPublic ? social.github : undefined,
  };
}

export { appName, gitConfig };
