import { Hero } from '@/components/landing/hero';
import { Spine } from '@/components/landing/station';
import { FourGates } from '@/components/landing/four-gates';
import { ThreeDoors } from '@/components/landing/three-doors';
import { ProofLedger } from '@/components/landing/proof-ledger';
import { ExitFreedom } from '@/components/landing/exit-freedom';
import { ShowcaseTeaser } from '@/components/landing/showcase-teaser';
import { InstallBand } from '@/components/landing/install-band';
import { Faq } from '@/components/landing/faq';
import { CtaFooter } from '@/components/landing/cta-footer';
import { getEngineVersion } from '@/lib/engine';

/**
 * The root layout supplies this page's title, description, Open Graph and
 * Twitter metadata. The one signal it cannot supply is the canonical URL:
 * `alternates.canonical` on a LAYOUT stamps the same URL onto every page that
 * inherits from it, which is worse than having none at all. So it belongs here,
 * on the page that actually is `/`.
 */
export const metadata = {
  alternates: {
    canonical: '/',
    // The Markdown twin, advertised where an HTML client will see it. The URL
    // must genuinely serve Markdown — an alternate pointing at HTML is worse
    // than none, because the caller follows it and stops trusting the rest.
    types: { 'text/markdown': '/index.md' },
  },
};

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
      {/* Eight stations on one spine, in the order the argument is made:
          the claim · one write end to end · who may operate it · the receipts ·
          what you keep · it is running in production · the honest answers ·
          start.

          Two components left the page rather than moving. FirstRun duplicated
          the install band four screens above it. The Interlock was a 240vh
          scroll-driven chapter whose whole argument — the pause before a write —
          is now Station 01's second gate, legible at once and with no
          `animation-timeline` fallback to maintain. Both still exist; neither is
          mounted here. */}
      <Spine>
        <Hero />
        <FourGates />
        <ThreeDoors />
        <ProofLedger />
        <ExitFreedom />
        <ShowcaseTeaser />
        <Faq />
        <InstallBand />
      </Spine>
      <CtaFooter />
    </div>
  );
}
