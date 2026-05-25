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
      { text: 'Onboarding', url: '/onboarding' },
      { text: 'Docs', url: '/docs' },
      { text: 'Integrations', url: '/integrations' },
      { text: 'Pricing', url: '/services' },
      { text: 'Showcase', url: '/showcase' },
      { text: 'Changelog', url: '/changelog' },
    ],
    githubUrl: isGithubPublic ? social.github : undefined,
  };
}

export { appName, gitConfig };
