import type { Metadata } from 'next';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { SiteFooter } from '@/components/landing/cta-footer';
import { Section, SectionHeader } from '@/components/landing/section';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { baseOptions } from '@/lib/layout.shared';
import { SCENES } from '@/lib/scenes-data';
import { ScenesGallery } from '@/components/scenes/scenes-gallery';

const OG = 'https://cartwright.app/scenes/aurora.jpg';

export const metadata: Metadata = {
  title: '3D scenes — Live Canvas',
  description:
    'A gallery of palette-reactive three.js scenes for Cartwright — aurora, waves, orb, synthwave grid and more. Every scene adopts your brand colours and is WebGL2 / reduced-motion / saveData-gated out of the box.',
  alternates: { canonical: '/scenes' },
  openGraph: {
    title: 'Cartwright 3D — Live Canvas scenes',
    description:
      'Palette-reactive three.js heroes for building the wildest premium pages. Every scene adopts your brand palette.',
    url: 'https://cartwright.app/scenes',
    images: [{ url: OG, width: 1280, height: 800, alt: 'Cartwright 3D scenes' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cartwright 3D — Live Canvas scenes',
    description: 'Palette-reactive three.js heroes. Every scene adopts your brand palette.',
    images: [OG],
  },
};

export default function ScenesPage() {
  return (
    <HomeLayout {...baseOptions()}>
      <Section className="relative overflow-hidden">
        <Badge tone="terracotta" className="mb-6">
          Live Canvas · 3D
        </Badge>
        <SectionHeader
          title="Palette-reactive 3D scenes"
          description="A gallery of three.js heroes for building the wildest premium pages — aurora, waves, a glowing orb, a synthwave grid and more. Every scene is PALETTE-REACTIVE: it reads your brand's colours at runtime, so the same scene renders in each shop's own palette. One shared renderer, WebGL2 / reduced-motion / saveData-gated, lazy-loaded — three.js never lands in a first-load bundle."
        />
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/designs" variant="primary">
            Browse designs →
          </ButtonLink>
          <ButtonLink href="/docs/designs/build-with-an-ide-agent" variant="secondary">
            Build with an AI agent
          </ButtonLink>
        </div>
      </Section>

      <Section className="bg-cw-stone-50 dark:bg-cw-stone-900/30">
        <SectionHeader
          eyebrow={`${SCENES.length} scenes`}
          title="Hover to play"
          description="Each preview is rendered in a different brand palette to show how the scene adopts your colours. Pick one in /admin/three-d, or drop it behind any design's hero."
        />
        <div className="mt-10">
          <ScenesGallery scenes={SCENES} />
        </div>
      </Section>

      <Section>
        <SectionHeader
          eyebrow="How it works"
          title="One contract, brand-reactive by construction"
          description="A scene is a small module (mount / update / render / dispose) that receives your 6-colour brand palette. The shared Live Canvas owns the single WebGL context + frame loop and gates on device + motion preferences. Add a scene = one module + one registry entry — and it instantly works in every shop's palette."
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
