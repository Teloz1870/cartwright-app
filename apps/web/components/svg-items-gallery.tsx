// Gallery for the synced engine SVG item library (components/svg-items).
// Pure server component — every item is rendered INLINE so the palette
// tokens resolve against this site's theme, exactly as they would in a shop.

import type { ComponentType } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  SVG_ITEMS,
  type SvgItem,
  type SvgItemKind,
  OrbitMark,
  PrismMark,
  ConstellationMark,
  CometMark,
  SunburstMark,
  LatticeMark,
  WaveDivider,
  VineDivider,
  BloomIllustration,
  MountainIllustration,
  CrystalIllustration,
  MothIllustration,
} from '@/components/svg-items';

const COMPONENTS: Record<string, ComponentType<{ className?: string }>> = {
  'orbit-mark': OrbitMark,
  'prism-mark': PrismMark,
  'constellation-mark': ConstellationMark,
  'comet-mark': CometMark,
  'sunburst-mark': SunburstMark,
  'lattice-mark': LatticeMark,
  'wave-divider': WaveDivider,
  'vine-divider': VineDivider,
  'bloom-illustration': BloomIllustration,
  'mountain-illustration': MountainIllustration,
  'crystal-illustration': CrystalIllustration,
  'moth-illustration': MothIllustration,
};

const KIND_LABEL: Record<SvgItemKind, string> = {
  mark: 'mark',
  divider: 'divider',
  illustration: 'illustration',
};

function ItemMeta({ item }: { item: SvgItem }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-semibold text-cw-stone-900 group-hover:text-cw-terracotta dark:text-cw-stone-50">
          {item.name}
        </h3>
        <Badge tone={item.kind === 'mark' ? 'terracotta' : item.kind === 'divider' ? 'oker' : 'default'}>
          {KIND_LABEL[item.kind]}
        </Badge>
      </div>
      <p className="flex-1 text-sm leading-relaxed text-cw-stone-500 dark:text-cw-stone-400">
        {item.description}
      </p>
      <code className="font-mono text-xs text-cw-stone-400">svg-{item.slug}</code>
    </>
  );
}

function ItemCard({ item }: { item: SvgItem }) {
  const Svg = COMPONENTS[item.slug];
  if (!Svg) return null;

  if (item.kind === 'divider') {
    // Dividers are wide (400×24) — give them a full-width row of their own.
    return (
      <div className="group flex flex-col gap-4 rounded-2xl border border-cw-stone-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-cw-terracotta/50 hover:shadow-lg dark:border-cw-stone-700 dark:bg-cw-stone-900 sm:col-span-2 lg:col-span-3">
        <div className="flex items-center rounded-xl border border-cw-stone-200 bg-cw-stone-50 px-6 py-10 dark:border-cw-stone-700 dark:bg-cw-stone-800/50">
          <Svg className="h-auto w-full text-cw-stone-900 dark:text-cw-stone-100" />
        </div>
        <ItemMeta item={item} />
      </div>
    );
  }

  return (
    <div className="group flex flex-col gap-4 rounded-2xl border border-cw-stone-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-cw-terracotta/50 hover:shadow-lg dark:border-cw-stone-700 dark:bg-cw-stone-900">
      <div className="flex items-center justify-center rounded-xl border border-cw-stone-200 bg-cw-stone-50 py-10 dark:border-cw-stone-700 dark:bg-cw-stone-800/50">
        <Svg className="size-28 text-cw-stone-900 dark:text-cw-stone-100" />
      </div>
      <ItemMeta item={item} />
    </div>
  );
}

export function SvgItemsGallery() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {SVG_ITEMS.map((item) => (
        <ItemCard key={item.slug} item={item} />
      ))}
    </div>
  );
}
