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
      { text: 'Learn', url: '/learn' },
      { text: 'Onboarding', url: '/onboarding' },
      { text: 'Docs', url: '/docs' },
      { text: 'Integrations', url: '/integrations' },
      { text: 'Designs', url: '/designs' },
      { text: 'Parts', url: '/parts' },
      { text: '3D', url: '/scenes' },
      { text: 'Pricing', url: '/pricing' },
      { text: 'Showcase', url: '/showcase' },
      { text: 'Changelog', url: '/changelog' },
    ],
    githubUrl: isGithubPublic ? social.github : undefined,
  };
}

export { appName, gitConfig };
