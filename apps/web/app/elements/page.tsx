import type { Metadata } from 'next';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { SiteFooter } from '@/components/landing/cta-footer';
import { Section, SectionHeader } from '@/components/landing/section';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { baseOptions } from '@/lib/layout.shared';
import { ELEMENTS } from '@/lib/elements-data';
import { ElementsGallery } from '@/components/elements/elements-gallery';

const OG = 'https://cartwright.app/scenes/aurora.jpg';

export const metadata: Metadata = {
  title: 'Elements — Pro 3D & cinematic building blocks',
  description:
    'Pro 3D & cinematic building blocks for Cartwright — Live-Canvas heroes, the FABLE butterfly flock, a rotatable 3D showroom, a CSS-only configurator, scroll-driven cinema and editorial stat bands. Drop them into any design.',
  alternates: { canonical: '/elements' },
  openGraph: {
    title: 'Cartwright Elements — Pro 3D & cinematic building blocks',
    description:
      'Live-Canvas heroes, 3D showrooms, scroll cinema and more — premium building blocks that adopt your brand palette.',
    url: 'https://cartwright.app/elements',
    images: [{ url: OG, width: 1280, height: 800, alt: 'Cartwright Elements' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cartwright Elements — Pro 3D & cinematic building blocks',
    description:
      'Live-Canvas heroes, 3D showrooms, scroll cinema and more — premium building blocks that adopt your brand palette.',
    images: [OG],
  },
};

export default function ElementsPage() {
  return (
    <HomeLayout {...baseOptions()}>
      <Section className="relative overflow-hidden">
        <Badge tone="terracotta" className="mb-6">
          Elements · Pro
        </Badge>
        <SectionHeader
          title="Pro 3D & cinematic building blocks"
          description="The premium pieces a Cartwright design is assembled from — palette-reactive 3D heroes, a rotatable product showroom, a CSS-only configurator, scroll-driven storytelling and editorial stat bands. Every element reads your brand's colours at runtime and degrades gracefully (WebGL2 / reduced-motion / saveData-gated)."
        />
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/designs" variant="primary">
            Browse designs →
          </ButtonLink>
          <ButtonLink href="/scenes" variant="secondary">
            See the 3D scenes
          </ButtonLink>
        </div>
      </Section>

      <Section className="bg-cw-stone-50 dark:bg-cw-stone-900/30">
        <SectionHeader
          eyebrow={`${ELEMENTS.length} elements`}
          title="Hover to play"
          description="Each preview shows the element inside a shipped design. The 3D elements share one Live-Canvas renderer — three.js never lands in a first-load bundle."
        />
        <div className="mt-10">
          <ElementsGallery elements={ELEMENTS} />
        </div>
      </Section>

      <Section>
        <SectionHeader
          eyebrow="How it works"
          title="Premium by composition"
          description="Elements are the building blocks the premium DesignPacks are made of. Pick a design that ships them, or ask your AI agent to compose them into a bespoke page — every element adopts your palette by construction."
        />
        <div className="mt-8">
          <ButtonLink href="/designs" variant="primary">
            ← Back to the marketplace
          </ButtonLink>
        </div>
      </Section>

      <SiteFooter />
    </HomeLayout>
  );
}
