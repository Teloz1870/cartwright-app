import { Hero } from '@/components/landing/hero';
import { FlagshipSpotlight } from '@/components/landing/flagship-spotlight';
import { VoiceShopDemo } from '@/components/landing/voice-shop-demo';
import { ThreeDoors } from '@/components/landing/three-doors';
import { HowItWorks } from '@/components/landing/how-it-works';
import { FeatureGrid } from '@/components/landing/feature-grid';
import { AgentSurface } from '@/components/landing/agent-surface';
import { ShowcaseTeaser } from '@/components/landing/showcase-teaser';
import { CompareTeaser } from '@/components/landing/compare-teaser';
import { LivePreview } from '@/components/landing/live-preview';
import { CodePeek } from '@/components/landing/code-peek';
import { InstallBand } from '@/components/landing/install-band';
import { Faq } from '@/components/landing/faq';
import { CtaFooter } from '@/components/landing/cta-footer';
import { getEngineVersion } from '@/lib/engine';

// softwareVersion is read from the engine CHANGELOG at build/ISR time (see
// lib/engine.ts), so the structured-data version AI crawlers read is never stale.
function buildJsonLd(engineVersion: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://cartwright.app/#website',
        url: 'https://cartwright.app',
        name: 'cartwright',
        description:
          'The build engine AIs reach for — a real site with design, database and backend, live in minutes. An open-source Next.js engine with an AI-native admin, MCP server, and Stripe checkout.',
      },
      {
        '@type': 'SoftwareApplication',
        '@id': 'https://cartwright.app/#software',
        name: 'cartwright',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Node.js 22+',
        description:
          'The build engine AIs reach for: an open-source, AI-first Next.js engine. Scaffold a real site — design, database and backend — with one command.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        license: 'https://opensource.org/license/mit',
        softwareVersion: engineVersion,
      },
    ],
  };
}

export default async function HomePage() {
  const jsonLd = buildJsonLd(await getEngineVersion());
  return (
    <div className="flex-1 bg-cw-paper dark:bg-cw-ink text-cw-stone-700 dark:text-cw-stone-300">
      <script
        type="application/ld+json"
         
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Section order tells one story: the thesis (Hero), the proof it's
          designed (Flagship), the three doors, what each door feels like
          (VoiceShop, LivePreview, HowItWorks, AgentSurface), the receipts
          (Showcase, Compare), then the inventory and the close. */}
      <Hero />
      <FlagshipSpotlight />
      <ThreeDoors />
      <VoiceShopDemo />
      <LivePreview />
      <HowItWorks />
      <AgentSurface />
      <ShowcaseTeaser />
      <CompareTeaser />
      <FeatureGrid />
      <CodePeek />
      <InstallBand />
      <Faq />
      <CtaFooter />
    </div>
  );
}
