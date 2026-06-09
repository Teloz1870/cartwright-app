import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { DESIGNS, type DesignEntry } from '@/lib/designs-data';
import { VOICES, type VoiceEntry } from '@/lib/verticals-data';
import type { LookEntry } from '@/lib/looks-data';

/**
 * A Look card = a Skin × Voice pairing. Because the Skins are palette-adaptive,
 * the page wears the Voice's palette — so the mini-hero is rendered in the
 * Voice's colours with its real re-toned copy (the Vibe at a glance), and the
 * footer names which design + voice produced it, with deep-links to both.
 */
function LookCard({
  look,
  voice,
  design,
}: {
  look: LookEntry;
  voice: VoiceEntry;
  design: DesignEntry;
}) {
  const p = voice.palette;
  const cta = design.mode === 'webshop' ? 'Shop now →' : 'Get started →';
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-cw-stone-200 bg-white transition-all hover:-translate-y-0.5 hover:border-cw-terracotta/50 hover:shadow-lg dark:border-cw-stone-700 dark:bg-cw-stone-900">
      {/* Mini-hero in the Voice's palette (what the Skin adopts) */}
      <div
        className="flex aspect-[16/10] flex-col justify-center gap-2 px-6"
        style={{ backgroundColor: p.cream }}
      >
        <span
          className="font-mono text-[11px] font-medium uppercase tracking-[0.16em]"
          style={{ color: p.accent }}
        >
          {voice.sampleEyebrow}
        </span>
        <span className="text-xl font-semibold leading-tight tracking-tight" style={{ color: p.ink }}>
          {voice.sampleHeadline}
        </span>
        <span
          className="mt-1 w-fit rounded-md px-3 py-1 text-xs font-medium"
          style={{ backgroundColor: p.accent, color: p.cream }}
        >
          {cta}
        </span>
      </div>

      {/* Palette swatches */}
      <div className="flex h-2.5">
        {[p.accent, p.accentDeep, p.sand, p.muted, p.ink].map((c, i) => (
          <div key={i} className="flex-1" style={{ backgroundColor: c }} />
        ))}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-cw-stone-900 group-hover:text-cw-terracotta dark:text-cw-stone-50">
            {look.name}
          </h3>
          <Badge>{design.mode}</Badge>
        </div>

        <p className="flex-1 text-sm leading-relaxed text-cw-stone-500 dark:text-cw-stone-400">
          {look.description}
        </p>

        {/* The recipe: Skin + Voice, each a deep-link */}
        <div className="flex flex-wrap gap-2 text-xs text-cw-stone-500 dark:text-cw-stone-400">
          <Link
            href={`/designs/${design.slug}`}
            className="rounded-md bg-cw-stone-100 px-2 py-1 transition-colors hover:text-cw-terracotta dark:bg-cw-stone-800"
          >
            Skin:{' '}
            <code className="font-mono text-cw-stone-700 dark:text-cw-stone-300">{design.slug}</code>
          </Link>
          <Link
            href="/verticals"
            className="rounded-md bg-cw-stone-100 px-2 py-1 transition-colors hover:text-cw-terracotta dark:bg-cw-stone-800"
          >
            Voice:{' '}
            <code className="font-mono text-cw-stone-700 dark:text-cw-stone-300">{voice.slug}</code>
          </Link>
        </div>

        <Link
          href={`/designs/${design.slug}`}
          className="mt-1 text-sm font-medium text-cw-terracotta hover:underline"
        >
          View the design →
        </Link>
      </div>
    </div>
  );
}

export function LooksGallery({ looks }: { looks: LookEntry[] }) {
  const cards = looks
    .map((look) => {
      const voice = VOICES.find((v) => v.slug === look.voiceSlug);
      const design = DESIGNS.find((d) => d.slug === look.designSlug);
      if (!voice || !design) return null;
      return { look, voice, design };
    })
    .filter((x): x is { look: LookEntry; voice: VoiceEntry; design: DesignEntry } => x !== null);

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map(({ look, voice, design }) => (
        <LookCard key={look.slug} look={look} voice={voice} design={design} />
      ))}
    </div>
  );
}
