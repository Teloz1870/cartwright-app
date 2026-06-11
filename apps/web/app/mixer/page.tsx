import type { Metadata } from 'next';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { SiteFooter } from '@/components/landing/cta-footer';
import { Section, SectionHeader } from '@/components/landing/section';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { baseOptions } from '@/lib/layout.shared';
import { pageOg } from '@/lib/og';
import { getChrome, getLooks, getMixerDesigns, getSvgItems, getVoices } from '@/lib/marketplace';
import { MixerStudio } from '@/components/mixer/mixer-studio';

// TODO(mixer-live-preview): the Mixer currently composes a STATIC mock from
// the vendored marketplace manifest (Voice copy + Skin palette + motif +
// chrome strips). The planned upgrade is a live engine preview: an iframe
// against a public mixer-preview deployment of the engine (the gated
// /<locale>/mixer-preview route — incl. &header=&footer= — the admin Page
// Mixer already uses). Standing that deploy up is a future owner decision —
// see components/mixer/mixer-studio.tsx.

const TITLE = 'Mixer — compose a Skin × Voice × Chrome';
const DESCRIPTION =
  'The Cartwright Mixer: pick any design Skin, pair it with a vertical Voice, frame it with any header & footer — then download the whole thing as a portable composition file, or take the recipe home as a CLI command or a one-line agent prompt.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/mixer' },
  ...pageOg(TITLE, DESCRIPTION),
};

export default function MixerPage() {
  const designs = getMixerDesigns();
  const voices = getVoices();
  const chrome = getChrome();
  const looks = getLooks();

  // Only ship the motif markups the designs actually reference (a ~10-item
  // subset of the svgItems library), keyed for the client studio.
  const motifSlugs = new Set(
    designs.map((d) => d.motifSlug).filter((s): s is string => s !== null),
  );
  const motifs = Object.fromEntries(
    getSvgItems()
      .filter((i) => motifSlugs.has(i.slug))
      .map((i) => [i.slug, i.markup]),
  );

  return (
    <HomeLayout {...baseOptions()}>
      <Section className="relative overflow-hidden">
        <Badge tone="terracotta" className="mb-6">
          Mixer · Skin × Voice
        </Badge>
        <SectionHeader
          title="Mix any Skin with any Voice — and any Chrome"
          description={`Cartwright keeps content and design orthogonal: a Skin (design pack) owns the layout, a vertical Voice owns the copy, palette, and 3D scene — and the chrome (header + footer) is a swappable part too. Compose any of the ${designs.length} Skins with any of the ${voices.length} Voices, frame it with any of the ${chrome.length} chrome parts, and download the whole composition as one portable file.`}
        />
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/designs" variant="secondary">
            Browse designs
          </ButtonLink>
          <ButtonLink href="/verticals" variant="outline">
            Browse voices
          </ButtonLink>
          <ButtonLink href="/chrome" variant="outline">
            Browse chrome
          </ButtonLink>
          <ButtonLink href="/looks" variant="outline">
            Curated Looks
          </ButtonLink>
        </div>
      </Section>

      <Section className="bg-cw-stone-50 dark:bg-cw-stone-900/30">
        <MixerStudio designs={designs} voices={voices} chrome={chrome} looks={looks} motifs={motifs} />
      </Section>

      <Section>
        <SectionHeader
          eyebrow="How it works in a real shop"
          title="The same composition, one audited step"
          description="In your store's admin, the Page Mixer drives a live engine preview of exactly this — and applying it for real is one step: pick the design in /admin/designs, apply the Voice in /admin/verticals, or let a build agent call magic.compose_look from a one-line prompt. The Voice's genome overrides are pre-written, so composing is instant and on-brand — no LLM in the render path."
        />
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/parts" variant="primary">
            Add Parts →
          </ButtonLink>
          <ButtonLink href="/docs/getting-started/quick-start" variant="secondary">
            Get started
          </ButtonLink>
        </div>
      </Section>

      <SiteFooter />
    </HomeLayout>
  );
}
