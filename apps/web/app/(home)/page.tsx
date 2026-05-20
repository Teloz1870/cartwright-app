import { Hero } from '@/components/landing/hero';
import { ValueProps } from '@/components/landing/value-props';
import { HowItWorks } from '@/components/landing/how-it-works';
import { FeatureGrid } from '@/components/landing/feature-grid';
import { AgentSurface } from '@/components/landing/agent-surface';
import { StackGrid } from '@/components/landing/stack-grid';
import { LivePreview } from '@/components/landing/live-preview';
import { CodePeek } from '@/components/landing/code-peek';
import { InstallBand } from '@/components/landing/install-band';
import { Faq } from '@/components/landing/faq';
import { CtaFooter } from '@/components/landing/cta-footer';

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://cartwright.app/#website',
      url: 'https://cartwright.app',
      name: 'cartwright',
      description:
        'The AI-first webshop template you actually own. A Next.js commerce stack with an AI-native admin, MCP server, and Stripe checkout.',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://cartwright.app/#software',
      name: 'cartwright',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Node.js 22+',
      description:
        'An open-source AI-first webshop template. Scaffold a production-shaped Next.js commerce app with one command.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      license: 'https://opensource.org/license/mit',
      softwareVersion: '0.1.0-beta',
    },
  ],
};

export default function HomePage() {
  return (
    <div className="flex-1 bg-cw-paper dark:bg-cw-ink text-cw-stone-700 dark:text-cw-stone-300">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <ValueProps />
      <HowItWorks />
      <FeatureGrid />
      <AgentSurface />
      <StackGrid />
      <LivePreview />
      <CodePeek />
      <InstallBand />
      <Faq />
      <CtaFooter />
    </div>
  );
}
