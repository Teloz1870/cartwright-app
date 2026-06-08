import type { Metadata } from 'next';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { SiteFooter } from '@/components/landing/cta-footer';
import { Section, SectionHeader } from '@/components/landing/section';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { baseOptions } from '@/lib/layout.shared';
import { VOICES } from '@/lib/verticals-data';
import { VoicesGallery } from '@/components/verticals/voices-gallery';

export const metadata: Metadata = {
  title: 'Voices — re-tone any design for your industry',
  description:
    'A catalogue of Cartwright Voices (verticals) — kindergarten, carpenter, café, salon. A Voice re-tones a site for an industry: copy, palette, and a palette-reactive 3D scene, on top of any palette-adaptive design. Apply one and the whole page adopts the Vibe.',
  alternates: { canonical: '/verticals' },
  openGraph: {
    title: 'Cartwright Voices — re-tone any design for your industry',
    description:
      'Mix a vertical Voice (copy + palette + 3D) with any skin. The same engine, dressed for kindergartens, carpenters, cafés, salons.',
    url: 'https://cartwright.app/verticals',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cartwright Voices — re-tone any design for your industry',
    description: 'Mix a vertical Voice (copy + palette + 3D) with any skin.',
  },
};

export default function VerticalsPage() {
  return (
    <HomeLayout {...baseOptions()}>
      <Section className="relative overflow-hidden">
        <Badge tone="terracotta" className="mb-6">
          Voices · verticals
        </Badge>
        <SectionHeader
          title="Re-tone any design for your industry"
          description="Content and design are orthogonal in Cartwright — so a Voice re-tones a site for an industry without touching the design. A Voice = identity (tone, audience, formality) + genome copy overrides + a fitting palette + a palette-reactive 3D scene + a suggested skin. We call the combination the Vibe. Apply one and the whole page adopts it — copy, colours, and 3D. The second axis of the mixer: Skin × Voice × Parts."
        />
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/designs" variant="primary">
            Browse designs →
          </ButtonLink>
          <ButtonLink href="/parts" variant="secondary">
            Parts
          </ButtonLink>
        </div>
      </Section>

      <Section className="bg-cw-stone-50 dark:bg-cw-stone-900/30">
        <SectionHeader
          eyebrow={`${VOICES.length} voices`}
          title="The Vibe, made visible"
          description="Each card's hero is rendered in that Voice's actual palette with its real re-toned copy — the Vibe at a glance. Below: the identity anchors, the suggested skin, and the 3D scene that comes with it."
        />
        <div className="mt-10">
          <VoicesGallery voices={VOICES} />
        </div>
      </Section>

      <Section>
        <SectionHeader
          eyebrow="How it works"
          title="One apply, the whole page re-tones"
          description="A Voice writes its identity + copy into the shop's genome (resolvable text), sets the palette, and picks a palette-reactive 3D scene. Because the copy flows through the genome and the palette maps onto the shared tokens, applying a Voice re-tones the hero, the value-prop and feature cards, the chrome, and the 3D — all at once, on top of whichever palette-adaptive design you've chosen. Nothing about the design changes; only its Voice."
        />
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/scenes" variant="primary">
            See the 3D scenes →
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
