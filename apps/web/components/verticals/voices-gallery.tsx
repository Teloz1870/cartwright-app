import { Badge } from '@/components/ui/badge';
import type { VoiceEntry } from '@/lib/verticals-data';

/**
 * A Voice card. The top is a mini-hero rendered in the Voice's ACTUAL palette
 * with its re-toned eyebrow + headline — so you see the "Vibe" (copy + colour)
 * directly. Palette colours are per-Voice arbitrary hex, so they're applied as
 * inline styles; the card chrome uses the shared cw-* tokens.
 */
function VoiceCard({ voice }: { voice: VoiceEntry }) {
  const p = voice.palette;
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-cw-stone-200 bg-white transition-all hover:-translate-y-0.5 hover:border-cw-terracotta/50 hover:shadow-lg dark:border-cw-stone-700 dark:bg-cw-stone-900">
      {/* Mini-hero in the Voice's palette */}
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
          Book a visit →
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
            {voice.name}
          </h3>
          <Badge tone="terracotta">{voice.vibe}</Badge>
        </div>

        <p className="flex-1 text-sm leading-relaxed text-cw-stone-500 dark:text-cw-stone-400">
          {voice.description}
        </p>

        {/* Identity anchors */}
        <div className="flex flex-wrap gap-1.5">
          <Badge>{voice.tone}</Badge>
          <Badge>{voice.audience}</Badge>
          <Badge>{voice.formality}</Badge>
        </div>

        {/* The Vibe: suggested skin + 3D scene */}
        <div className="flex flex-wrap gap-2 text-xs text-cw-stone-500 dark:text-cw-stone-400">
          <span className="rounded-md bg-cw-stone-100 px-2 py-1 dark:bg-cw-stone-800">
            Skin: <code className="font-mono text-cw-stone-700 dark:text-cw-stone-300">{voice.suggestedDesign}</code>
          </span>
          <span className="rounded-md bg-cw-stone-100 px-2 py-1 dark:bg-cw-stone-800">
            3D: <code className="font-mono text-cw-stone-700 dark:text-cw-stone-300">{voice.scene}</code>
          </span>
        </div>

        <code className="font-mono text-xs text-cw-stone-400">{voice.slug}</code>
      </div>
    </div>
  );
}

export function VoicesGallery({ voices }: { voices: VoiceEntry[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {voices.map((v) => (
        <VoiceCard key={v.slug} voice={v} />
      ))}
    </div>
  );
}
