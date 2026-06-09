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
      // Explore ▾ — the "what you build with" cluster (designs, voices, parts, 3D, Pro).
      {
        type: 'menu',
        text: 'Explore',
        items: [
          { text: 'Designs', url: '/designs', description: '24 whole-page design packs' },
          { text: 'Voices', url: '/verticals', description: 'Re-tone any design for your industry' },
          { text: 'Parts', url: '/parts', description: 'Swappable page sections' },
          { text: '3D scenes', url: '/scenes', description: 'Live-Canvas WebGL heroes' },
          { text: 'Pro', url: '/pro', description: 'Breakthrough premium elements' },
          { text: 'Showcase', url: '/showcase', description: 'Real sites built with Cartwright' },
        ],
      },
      // Docs — promoted to a direct, prominent top-level item.
      { text: 'Docs', url: '/docs' },
      // Resources ▾ — the "learn & help" cluster (adopts the orphaned routes too).
      {
        type: 'menu',
        text: 'Resources',
        items: [
          { text: 'Learn', url: '/learn', description: 'Guides & deep-dives' },
          { text: 'Onboarding', url: '/onboarding', description: 'From zero to live' },
          { text: 'Integrations', url: '/integrations', description: 'Stripe, Resend, Turso & more' },
          { text: 'Use cases', url: '/use-cases', description: 'Cartwright by industry' },
          { text: 'Compare', url: '/compare', description: 'Cartwright vs the alternatives' },
          { text: 'Glossary', url: '/glossary', description: 'Terms, defined' },
          { text: 'Changelog', url: '/changelog', description: "What's new in the engine" },
        ],
      },
      { text: 'Pricing', url: '/pricing' },
      // Primary CTA — sits on the right, next to the GitHub icon.
      {
        type: 'button',
        text: 'Get started',
        url: '/docs/getting-started/quick-start',
        secondary: true,
      },
    ],
    githubUrl: isGithubPublic ? social.github : undefined,
  };
}

export { appName, gitConfig };
