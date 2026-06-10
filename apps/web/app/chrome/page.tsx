import type { Metadata } from 'next';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { SiteFooter } from '@/components/landing/cta-footer';
import { Section, SectionHeader } from '@/components/landing/section';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { baseOptions } from '@/lib/layout.shared';
import { pageOg } from '@/lib/og';
import { getChrome, getMixerDesigns } from '@/lib/marketplace';
import { ChromeGallery, type ChromeCardData } from '@/components/chrome/chrome-gallery';

const TITLE = 'Chrome — headers & footers';
const DESCRIPTION =
  'Every selectable header and footer in the Cartwright engine — signature design chrome with motif marks, plus neutral engine parts you can mix onto any design. Pick them in the Mixer or set them in /admin/designs.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/chrome' },
  ...pageOg(TITLE, DESCRIPTION),
};

export default function ChromePage() {
  const chrome = getChrome();
  const designs = getMixerDesigns();
  const designBySlug = new Map(designs.map((d) => [d.slug, d]));

  // Header strips are real pixels (cropped from the committed design
  // screenshots — see components/chrome/chrome-gallery.tsx for the upgrade
  // path); footers + neutral parts render structural mocks.
  const cards: ChromeCardData[] = chrome.map((entry) => {
    const design = entry.designSlug ? designBySlug.get(entry.designSlug) : undefined;
    return {
      entry,
      designName: design?.name ?? null,
      motifSlug: design?.motifSlug ?? null,
      palette: design?.palette ?? null,
      previewImage:
        entry.kind === 'header' && entry.designSlug
          ? `/chrome/${entry.designSlug}-header.jpg`
          : null,
    };
  });

  const headers = chrome.filter((c) => c.kind === 'header').length;
  const footers = chrome.filter((c) => c.kind === 'footer').length;
  const mixable = chrome.filter((c) => c.mixable).length;

  return (
    <HomeLayout {...baseOptions()}>
      <Section className="relative overflow-hidden">
        <Badge tone="terracotta" className="mb-6">
          Chrome · headers &amp; footers
        </Badge>
        <SectionHeader
          title="Mix any chrome"
          description={`The frame around every page is a part too: ${headers} headers and ${footers} footers from the engine's chrome registry. ${mixable} of them are mixable — selectable on ANY design — while the signature premium chrome stays locked to the design it was drawn for. Compose them in the Mixer, set them in /admin/designs, or ship them in a composition file.`}
        />
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/mixer" variant="primary">
            Open the Mixer →
          </ButtonLink>
          <ButtonLink href="/designs" variant="secondary">
            Browse designs
          </ButtonLink>
          <ButtonLink href="/parts" variant="outline">
            Page Parts
          </ButtonLink>
        </div>
      </Section>

      <Section className="bg-cw-stone-50 dark:bg-cw-stone-900/30">
        <ChromeGallery cards={cards} />
      </Section>

      <Section>
        <SectionHeader
          eyebrow="How it works"
          title="Chrome is governed data, not a fork"
          description="Picking a header or footer writes one small setting (chromeJson) — the design, palette and copy stay untouched, and unset always means the design's own default. Agents set it with the audited chrome.set tool; compositions carry it as { chrome: { headerKey, footerKey } }."
        />
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/mixer" variant="primary">
            Compose a look →
          </ButtonLink>
          <ButtonLink href="/elements" variant="outline">
            Pro elements
          </ButtonLink>
        </div>
      </Section>

      <SiteFooter />
    </HomeLayout>
  );
}
