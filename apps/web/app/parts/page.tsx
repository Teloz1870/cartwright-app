import type { Metadata } from 'next';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { SiteFooter } from '@/components/landing/cta-footer';
import { Section, SectionHeader } from '@/components/landing/section';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { baseOptions } from '@/lib/layout.shared';
import { PARTS, NEW_PARTS_COUNT } from '@/lib/parts-data';
import { PartsGallery } from '@/components/parts/parts-gallery';

export const metadata: Metadata = {
  title: 'Parts — the section catalogue',
  description:
    'A catalogue of swappable, prop-driven page sections (Parts) for Cartwright — heroes, a 3D Live Canvas hero, bento, marquee, feature grids, stats, pricing, FAQ and more. Every Part adopts your brand / Voice palette and is composed in the Visual Builder.',
  alternates: { canonical: '/parts' },
  openGraph: {
    title: 'Cartwright Parts — the section catalogue',
    description:
      'Swappable, palette-adaptive page sections you compose in the Visual Builder. Mix the same Parts across any palette-adaptive skin.',
    url: 'https://cartwright.app/parts',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cartwright Parts — the section catalogue',
    description: 'Swappable, palette-adaptive page sections you compose in the Visual Builder.',
  },
};

export default function PartsPage() {
  return (
    <HomeLayout {...baseOptions()}>
      <Section className="relative overflow-hidden">
        <Badge tone="terracotta" className="mb-6">
          Parts · the section catalogue
        </Badge>
        <SectionHeader
          title="Compose pages from swappable Parts"
          description="A Part is a prop-driven page section — a hero, a bento grid, a marquee, a pricing table. You compose them in the Visual Builder, in any order. Every Part is a cw-* atom, so it adopts the active design / Voice palette: drop the same Part onto any palette-adaptive skin and it wears that skin's colours. The third piece of the mixer — Skin × Voice × Parts."
        />
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/designs" variant="primary">
            Browse designs →
          </ButtonLink>
          <ButtonLink href="/scenes" variant="secondary">
            3D scenes
          </ButtonLink>
        </div>
      </Section>

      <Section className="bg-cw-stone-50 dark:bg-cw-stone-900/30">
        <SectionHeader
          eyebrow={`${PARTS.length} parts · ${NEW_PARTS_COUNT} new`}
          title="The catalogue"
          description="Filter by category. Each preview is a schematic — the accent block is your palette's colour, the way the real Part renders. Add any Part in the Visual Builder (Rediger side → add section)."
        />
        <div className="mt-10">
          <PartsGallery parts={PARTS} />
        </div>
      </Section>

      <Section>
        <SectionHeader
          eyebrow="How it works"
          title="One registry, palette-adaptive by construction"
          description="Each Part is a small typed component with a Zod prop-schema and defaults, registered once in the engine's section registry. The Visual Builder renders Parts from a page's layout through that single registry, so the storefront and the live preview can never diverge. Because Parts use the shared cw-* tokens, the same Part renders in every shop's palette — and re-tones with your Voice (genome) copy where it reads it."
        />
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/docs/designs/build-with-an-ide-agent" variant="primary">
            Build with an AI agent
          </ButtonLink>
          <ButtonLink href="/designs" variant="secondary">
            ← Back to the marketplace
          </ButtonLink>
        </div>
      </Section>

      <SiteFooter />
    </HomeLayout>
  );
}
