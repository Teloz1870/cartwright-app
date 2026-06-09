import { Section, SectionHeader } from '@/components/landing/section';
import { ButtonLink } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const FABLE_PALETTE = [
  { name: 'accent', hex: '#4e4af2' },
  { name: 'accentDeep', hex: '#2f2bb8' },
  { name: 'cream', hex: '#faf7f0' },
  { name: 'sand', hex: '#f0ebdf' },
  { name: 'ink', hex: '#23201c' },
  { name: 'muted', hex: '#7d776c' },
];

export function FlagshipSpotlight() {
  return (
    <Section className="bg-cw-stone-50 dark:bg-cw-stone-900/30">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] items-center">
        <div>
          <Badge tone="terracotta" className="mb-4">
            <span className="size-1.5 rounded-full bg-cw-terracotta" />
            New flagship
          </Badge>
          <SectionHeader
            eyebrow="New flagship"
            title="FABLE — the metamorphosis flagship"
            description="The new website-mode flagship design: an instanced flock of 3D butterflies fluttering behind a serif display hero, a scroll-cinema metamorphosis timeline (caterpillar → chrysalis → imago) — and the whole thing is palette-adaptive, so the flock and every section re-tone to your brand."
          />

          <div className="mt-6 flex items-center gap-2">
            {FABLE_PALETTE.map((swatch) => (
              <span
                key={swatch.name}
                title={`${swatch.name} ${swatch.hex}`}
                className="size-6 rounded-full border border-cw-stone-300 dark:border-cw-stone-700"
                style={{ backgroundColor: swatch.hex }}
              />
            ))}
            <span className="ml-1 text-xs font-mono text-cw-stone-500 dark:text-cw-stone-400">
              morpho violet-blue · ivory
            </span>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink href="/designs/fable" size="lg">
              See the design
            </ButtonLink>
            <ButtonLink href="/looks" variant="outline" size="lg">
              View the look
            </ButtonLink>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-xl border border-cw-stone-200 dark:border-cw-stone-800 bg-cw-paper dark:bg-cw-stone-900 shadow-2xl shadow-cw-stone-900/10 overflow-hidden">
            <video
              src="/designs/fable.webm"
              poster="/designs/fable.jpg"
              autoPlay
              muted
              loop
              playsInline
              className="block w-full"
            >
              <source src="/designs/fable.mp4" type="video/mp4" />
            </video>
          </div>
          <div
            aria-hidden
            className="absolute -inset-6 -z-10 bg-gradient-to-tr from-[#4e4af2]/0 via-[#4e4af2]/10 to-cw-terracotta/10 blur-3xl"
          />
        </div>
      </div>
    </Section>
  );
}
