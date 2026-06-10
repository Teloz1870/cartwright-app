'use client';

// The /chrome gallery — every selectable header & footer part from the
// engine's chrome registry (marketplace-manifest v3 `chrome[]`).
//
// PREVIEWS (honest, zero new capture infra):
// - Design HEADERS show a real strip: the top 96px cropped from the design's
//   existing full-page screenshot in public/designs/ (→ public/chrome/).
// - Design FOOTERS get a palette-tinted structural mock — the committed design
//   screenshots are viewport captures (hero only), so there are no real footer
//   pixels to crop yet.
// - The 4 neutral engine parts (minimal/centered header, mega/slim footer)
//   get structural CSS mocks of their actual layout.
//
// TODO(chrome-capture): the upgrade path is a `--chrome` mode in the engine's
// committed capture pipeline (scripts/capture-gallery.mjs) that renders each
// chrome standalone (set designSlug + chromeJson, screenshot just the
// header/footer strip) — then every card gets a real pixel preview.

import { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import type { ChromeEntry, ChromeKind, Palette } from '@/lib/marketplace';

export type ChromeCardData = {
  entry: ChromeEntry;
  /** Display name of the design that ships this chrome (null = neutral part). */
  designName: string | null;
  /** The owning design's signature SVG motif slug, if any. */
  motifSlug: string | null;
  /** The owning design's default palette (tints the footer mocks). */
  palette: Palette | null;
  /** Real cropped strip under public/chrome/, headers of design packs only. */
  previewImage: string | null;
};

/* ── Preview strips ─────────────────────────────────────────────────── */

function DesignFooterMock({ palette }: { palette: Palette }) {
  return (
    <div
      aria-hidden
      className="flex flex-col justify-between rounded-lg px-4 py-3"
      style={{ backgroundColor: palette.ink, aspectRatio: '1280 / 240' }}
    >
      <div className="flex items-start justify-between gap-6">
        <span
          className="size-3 shrink-0 rounded-full"
          style={{ backgroundColor: palette.accent }}
        />
        <div className="flex flex-1 justify-end gap-6">
          {[0, 1, 2].map((col) => (
            <div key={col} className="flex w-16 flex-col gap-1.5">
              {[0, 1, 2].map((row) => (
                <span
                  key={row}
                  className="h-1 rounded-full"
                  style={{ backgroundColor: palette.cream, opacity: row === 0 ? 0.7 : 0.3 }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <span className="h-0.5 w-full rounded-full" style={{ backgroundColor: palette.accent }} />
    </div>
  );
}

/** Structural mocks of the 4 neutral engine chrome parts. */
function NeutralChromeMock({ chromeKey }: { chromeKey: string }) {
  const bar = 'rounded-lg border border-cw-stone-200 bg-white dark:border-cw-stone-700 dark:bg-cw-stone-800';
  const line = 'h-1.5 rounded-full bg-cw-stone-300 dark:bg-cw-stone-600';
  const mark = 'size-3.5 rounded bg-cw-terracotta';
  const cta = 'h-4 w-12 rounded-full bg-cw-terracotta/80';

  switch (chromeKey) {
    case 'minimal-header':
      return (
        <div aria-hidden className={cn(bar, 'flex items-center justify-between gap-4 px-4 py-3')}>
          <span className={mark} />
          <span className="flex flex-1 justify-center gap-3">
            <span className={cn(line, 'w-8')} />
            <span className={cn(line, 'w-8')} />
            <span className={cn(line, 'w-8')} />
          </span>
          <span className={cta} />
        </div>
      );
    case 'centered-header':
      return (
        <div aria-hidden className={cn(bar, 'flex flex-col items-center gap-2 px-4 py-2.5')}>
          <span className={mark} />
          <span className="flex gap-3">
            <span className={cn(line, 'w-8')} />
            <span className={cn(line, 'w-8')} />
            <span className={cn(line, 'w-8')} />
            <span className={cn(line, 'w-8')} />
          </span>
        </div>
      );
    case 'mega-footer':
      return (
        <div aria-hidden className={cn(bar, 'flex flex-col gap-3 px-4 py-3')}>
          <div className="flex justify-between gap-4">
            {[0, 1, 2, 3].map((col) => (
              <div key={col} className="flex flex-1 flex-col gap-1.5">
                <span className={cn(line, 'w-10 bg-cw-stone-400 dark:bg-cw-stone-500')} />
                <span className={cn(line, 'w-12')} />
                <span className={cn(line, 'w-8')} />
                <span className={cn(line, 'w-10')} />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-cw-stone-200 pt-2 dark:border-cw-stone-700">
            <span className={mark} />
            <span className={cn(line, 'w-16')} />
          </div>
        </div>
      );
    case 'slim-footer':
      return (
        <div aria-hidden className={cn(bar, 'flex items-center justify-between gap-4 px-4 py-2.5')}>
          <span className="flex items-center gap-2">
            <span className={mark} />
            <span className={cn(line, 'w-12')} />
          </span>
          <span className="flex gap-3">
            <span className={cn(line, 'w-8')} />
            <span className={cn(line, 'w-8')} />
          </span>
        </div>
      );
    default:
      return <div aria-hidden className={cn(bar, 'h-12')} />;
  }
}

/* ── Card ───────────────────────────────────────────────────────────── */

function ChromeCard({ card }: { card: ChromeCardData }) {
  const { entry } = card;
  // Deep-link: locked chromes only render on their own design, so the Mixer
  // opens with that skin pre-selected; neutral parts open on the default skin.
  const skinParam = entry.designSlug ? `skin=${entry.designSlug}&` : '';
  const mixerHref = `/mixer?${skinParam}${entry.kind}=${entry.key}`;

  return (
    <div className="group flex flex-col gap-3 rounded-2xl border border-cw-stone-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-cw-terracotta/50 hover:shadow-lg dark:border-cw-stone-700 dark:bg-cw-stone-900">
      {card.previewImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={card.previewImage}
          alt={`${entry.label} preview`}
          width={1280}
          height={96}
          loading="lazy"
          className="w-full rounded-lg border border-cw-stone-200 dark:border-cw-stone-700"
        />
      ) : entry.kind === 'footer' && card.palette ? (
        <DesignFooterMock palette={card.palette} />
      ) : (
        <NeutralChromeMock chromeKey={entry.key} />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-semibold text-cw-stone-900 group-hover:text-cw-terracotta dark:text-cw-stone-50">
          {entry.label}
        </h3>
        {entry.mixable ? (
          <Badge tone="terracotta">mixable</Badge>
        ) : (
          <Badge>locked to {card.designName ?? entry.designSlug}</Badge>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {card.designName ? (
          <Badge>
            design:{' '}
            <Link href={`/designs/${entry.designSlug}`} className="font-mono hover:text-cw-terracotta">
              {entry.designSlug}
            </Link>
          </Badge>
        ) : (
          <Badge>neutral · engine part</Badge>
        )}
        {card.motifSlug && (
          <Badge>
            motif: <code className="font-mono">{card.motifSlug}</code>
          </Badge>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-1">
        <code className="truncate font-mono text-xs text-cw-stone-400">{entry.key}</code>
        <Link
          href={mixerHref}
          className="shrink-0 text-sm font-medium text-cw-terracotta hover:underline"
        >
          Use in the Mixer →
        </Link>
      </div>
    </div>
  );
}

/* ── Gallery (tabs + mixability grouping) ───────────────────────────── */

export function ChromeGallery({ cards }: { cards: ChromeCardData[] }) {
  const [kind, setKind] = useState<ChromeKind>('header');

  const visible = cards.filter((c) => c.entry.kind === kind);
  const mixable = visible.filter((c) => c.entry.mixable);
  const locked = visible.filter((c) => !c.entry.mixable);

  return (
    <div className="flex flex-col gap-10">
      <div role="tablist" aria-label="Chrome kind" className="flex gap-2">
        {(['header', 'footer'] as const).map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={kind === k}
            onClick={() => setKind(k)}
            className={cn(
              'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
              kind === k
                ? 'border-cw-terracotta bg-cw-terracotta/10 text-cw-stone-900 dark:text-cw-stone-50'
                : 'border-cw-stone-200 text-cw-stone-700 hover:border-cw-terracotta/50 dark:border-cw-stone-700 dark:text-cw-stone-300',
            )}
          >
            {k === 'header' ? 'Headers' : 'Footers'} (
            {cards.filter((c) => c.entry.kind === k).length})
          </button>
        ))}
      </div>

      <div>
        <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-cw-terracotta">
          Mix anywhere
        </h3>
        <p className="mt-1 text-sm text-cw-stone-500 dark:text-cw-stone-400">
          Selectable on any design — atom-composed design chrome plus the neutral engine parts.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {mixable.map((c) => (
            <ChromeCard key={c.entry.key} card={c} />
          ))}
        </div>
      </div>

      {locked.length > 0 && (
        <div>
          <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-cw-terracotta">
            Design-locked
          </h3>
          <p className="mt-1 text-sm text-cw-stone-500 dark:text-cw-stone-400">
            Signature chrome that only renders on its own design — bespoke typography and motifs
            that don&rsquo;t translate. The Mixer offers these when you wear the matching Skin.
          </p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {locked.map((c) => (
              <ChromeCard key={c.entry.key} card={c} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
