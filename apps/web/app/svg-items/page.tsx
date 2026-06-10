import type { Metadata } from 'next';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { SiteFooter } from '@/components/landing/cta-footer';
import { CopyCommand } from '@/components/landing/copy-command';
import { Section, SectionHeader } from '@/components/landing/section';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { baseOptions } from '@/lib/layout.shared';
import { SVG_ITEMS } from '@/components/svg-items';
import { SvgItemsGallery } from '@/components/svg-items-gallery';

export const metadata: Metadata = {
  title: 'SVG items — palette-adaptive marks & illustrations',
  description:
    'A library of hand-crafted, palette-adaptive inline SVG components for Cartwright — brand marks, section dividers and hero illustrations. Pure server components, zero client JS, installable via the shadcn registry.',
  alternates: { canonical: '/svg-items' },
  openGraph: {
    title: 'Cartwright SVG items — marks, dividers & illustrations',
    description:
      'Hand-crafted palette-adaptive SVG components — every item reads your brand tokens at runtime, so the same mark renders in each shop’s own palette.',
    url: 'https://cartwright.app/svg-items',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cartwright SVG items — marks, dividers & illustrations',
    description:
      'Hand-crafted palette-adaptive SVG components that adopt your brand palette at runtime.',
  },
};

export default function SvgItemsPage() {
  return (
    <HomeLayout {...baseOptions()}>
      <Section className="relative overflow-hidden">
        <Badge tone="terracotta" className="mb-6">
          SVG items
        </Badge>
        <SectionHeader
          title="Hand-crafted, palette-adaptive marks & illustrations"
          description="Premium inline SVG components — brand marks, section dividers and hero illustrations. Every item is a pure server component (zero client JS) that reads your brand's palette tokens at runtime, so the same mark renders in each shop's own colours. The previews below are live: they're rendered in this site's palette right now."
        />
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/elements" variant="primary">
            See the Elements →
          </ButtonLink>
          <ButtonLink href="/designs" variant="secondary">
            Browse designs
          </ButtonLink>
        </div>
      </Section>

      <Section className="bg-cw-stone-50 dark:bg-cw-stone-900/30">
        <SectionHeader
          eyebrow={`${SVG_ITEMS.length} items`}
          title="Rendered live, in this palette"
          description="Each item installs as a single self-contained file via the shadcn registry every Cartwright shop ships. Swap the item name in the command below — e.g. svg-orbit-mark, svg-wave-divider, svg-moth-illustration."
        />
        <div className="mt-8 max-w-2xl">
          <CopyCommand command="npx shadcn@latest add https://cartwright.app/api/registry/svg-orbit-mark" />
        </div>
        <div className="mt-10">
          <SvgItemsGallery />
        </div>
      </Section>

      <Section>
        <SectionHeader
          eyebrow="How it works"
          title="No hex values, anywhere"
          description="Every paint in every item reads the cw-* palette tokens with the engine fallback chain (ending in currentColor), so an item dropped into any Cartwright shop — or any page on this site — adapts to the active palette by construction. Marks are 120×120, dividers are 400×24, illustrations are 120×120 hero-grade scenes."
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
