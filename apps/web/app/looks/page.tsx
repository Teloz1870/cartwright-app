import type { Metadata } from 'next';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { SiteFooter } from '@/components/landing/cta-footer';
import { Section, SectionHeader } from '@/components/landing/section';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { baseOptions } from '@/lib/layout.shared';
import { LOOKS } from '@/lib/looks-data';
import { LooksGallery } from '@/components/looks/looks-gallery';

export const metadata: Metadata = {
  title: 'Looks — curated Skin × Voice combinations',
  description:
    'Hand-picked Cartwright Looks: a design (Skin) paired with a vertical Voice. The same engine, dressed for a kindergarten, a café, a carpenter, a salon — copy, palette, and 3D, all adopted from the Voice. Proof that content and design are orthogonal.',
  alternates: { canonical: '/looks' },
  openGraph: {
    title: 'Cartwright Looks — curated Skin × Voice combinations',
    description:
      'A Look = a design paired with a Voice. Same engine, very different businesses. See the Vibe at a glance.',
    url: 'https://cartwright.app/looks',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cartwright Looks — curated Skin × Voice combinations',
    description: 'A Look = a design paired with a Voice. Same engine, very different businesses.',
  },
};

export default function LooksPage() {
  return (
    <HomeLayout {...baseOptions()}>
      <Section className="relative overflow-hidden">
        <Badge tone="terracotta" className="mb-6">
          Looks · Skin × Voice
        </Badge>
        <SectionHeader
          title="The same engine, dressed for the job"
          description="A Look is a curated pairing of a design (Skin) and a vertical Voice. Because Cartwright keeps content and design orthogonal — and the Skins here are palette-adaptive — the page simply adopts the Voice's copy, palette, and 3D. So one engine becomes a warm kindergarten, a cozy café, an honest carpenter, or a polished salon, just by changing the Voice. Each card's hero is rendered in that Voice's real palette and copy."
        />
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/designs" variant="primary">
            Browse designs →
          </ButtonLink>
          <ButtonLink href="/verticals" variant="secondary">
            Browse voices
          </ButtonLink>
        </div>
      </Section>

      <Section className="bg-cw-stone-50 dark:bg-cw-stone-900/30">
        <SectionHeader
          eyebrow={`${LOOKS.length} looks`}
          title="One Voice, many Skins — one Skin, many Voices"
          description="Notice the café Voice on three different Skins, and Aurora carrying three different Voices. That's the whole point: the look and the tone move independently. Pick a Skin in /designs, a Voice in /verticals, and you've built a Look."
        />
        <div className="mt-10">
          <LooksGallery looks={LOOKS} />
        </div>
      </Section>

      <Section>
        <SectionHeader
          eyebrow="How to build one"
          title="Pick a Skin, apply a Voice"
          description="In your shop's admin: choose a design in /admin/designs, then apply a Voice in /admin/verticals — it writes the Voice's identity + copy into the genome, sets the palette, and picks a 3D scene. The whole page re-tones at once. Or let a build agent compose it for you from a one-line prompt."
        />
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/parts" variant="primary">
            Add Parts →
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
