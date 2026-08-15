import { Hero } from '@/components/landing/hero';
import { Interlock } from '@/components/interlock/interlock';
import { ThreeDoors } from '@/components/landing/three-doors';
import { ProofLedger } from '@/components/landing/proof-ledger';
import { ExitFreedom } from '@/components/landing/exit-freedom';
import { ShowcaseTeaser } from '@/components/landing/showcase-teaser';
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
      {/* Seven arguments, each changing the state of one operation — not
          fourteen independent bands sharing a padding value.

          1 the claim · 2 one action becoming trustworthy · 3 who may operate
          it · 4 the receipts · 5 what you keep · 6 it is running in production
          · 7 start.

          What left the homepage, and why: the FABLE spotlight and the design
          marketplace moved to /designs, because putting the flagship directly
          after the hero changed the argument from trusted operation to visual
          variety before trust was established. Voice folds into Three Doors as
          one input modality rather than a standalone promo. LivePreview,
          HowItWorks, CodePeek and CompareTeaser moved to the pages that own
          them. AgentSurface's eleven cards and FeatureGrid's nine became one
          ledger. */}
      <Hero />
      <Interlock />
      <ThreeDoors />
      <ProofLedger />
      <ExitFreedom />
      <ShowcaseTeaser />
      <InstallBand />
      <Faq />
      <CtaFooter />
    </div>
  );
}
