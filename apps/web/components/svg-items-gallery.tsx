// Gallery for the engine SVG item library — rendered from the vendored
// marketplace-manifest v2 (lib/marketplace.ts), which ships each item's full
// pre-rendered SVG markup. Pure server component — every item is injected
// INLINE so the cw-* palette tokens resolve against this site's theme,
// exactly as they would in a shop.
//
// dangerouslySetInnerHTML is safe here by construction: `markup` is our own
// build-time-generated static SVG (the engine renders its first-party server
// components into the manifest at build time) — vendored in this repo, never
// user input.

import { Badge } from '@/components/ui/badge';
import { getSvgItems, type SvgItem, type SvgItemKind } from '@/lib/marketplace';

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
  if (item.kind === 'divider') {
    // Dividers are wide (400×24) — give them a full-width row of their own.
    return (
      <div className="group flex flex-col gap-4 rounded-2xl border border-cw-stone-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-cw-terracotta/50 hover:shadow-lg dark:border-cw-stone-700 dark:bg-cw-stone-900 sm:col-span-2 lg:col-span-3">
        <div className="flex items-center rounded-xl border border-cw-stone-200 bg-cw-stone-50 px-6 py-10 dark:border-cw-stone-700 dark:bg-cw-stone-800/50">
          <div
            className="w-full text-cw-stone-900 dark:text-cw-stone-100 [&>svg]:h-auto [&>svg]:w-full"
            // Safe: build-time-generated static markup from our own engine (see header comment).
            dangerouslySetInnerHTML={{ __html: item.markup }}
          />
        </div>
        <ItemMeta item={item} />
      </div>
    );
  }

  return (
    <div className="group flex flex-col gap-4 rounded-2xl border border-cw-stone-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-cw-terracotta/50 hover:shadow-lg dark:border-cw-stone-700 dark:bg-cw-stone-900">
      <div className="flex items-center justify-center rounded-xl border border-cw-stone-200 bg-cw-stone-50 py-10 dark:border-cw-stone-700 dark:bg-cw-stone-800/50">
        <div
          className="size-28 text-cw-stone-900 dark:text-cw-stone-100 [&>svg]:size-full"
          // Safe: build-time-generated static markup from our own engine (see header comment).
          dangerouslySetInnerHTML={{ __html: item.markup }}
        />
      </div>
      <ItemMeta item={item} />
    </div>
  );
}

export function SvgItemsGallery() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {getSvgItems().map((item) => (
        <ItemCard key={item.slug} item={item} />
      ))}
    </div>
  );
}
