'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { PartSchematic } from '@/components/parts/part-schematic';
import { PART_CATEGORIES, type PartEntry, type PartCategory } from '@/lib/parts-data';

type Filter = 'All' | PartCategory;

function PartCard({ part }: { part: PartEntry }) {
  return (
    <div className="group flex flex-col gap-4 rounded-2xl border border-cw-stone-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-cw-terracotta/50 hover:shadow-lg dark:border-cw-stone-700 dark:bg-cw-stone-900">
      <PartSchematic shape={part.shape} />
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-semibold text-cw-stone-900 group-hover:text-cw-terracotta dark:text-cw-stone-50">
          {part.label}
        </h3>
        {part.isNew ? <Badge tone="terracotta">New</Badge> : null}
        {part.is3d ? <Badge tone="oker">3D</Badge> : null}
        <Badge>{part.category}</Badge>
      </div>
      <p className="flex-1 text-sm leading-relaxed text-cw-stone-500 dark:text-cw-stone-400">
        {part.description}
      </p>
      <code className="font-mono text-xs text-cw-stone-400">{part.key}</code>
    </div>
  );
}

export function PartsGallery({ parts }: { parts: PartEntry[] }) {
  const [filter, setFilter] = useState<Filter>('All');

  const filters: Filter[] = useMemo(() => ['All', ...PART_CATEGORIES], []);
  const shown = useMemo(
    () => (filter === 'All' ? parts : parts.filter((p) => p.category === filter)),
    [parts, filter],
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => {
          const active = f === filter;
          const count = f === 'All' ? parts.length : parts.filter((p) => p.category === f).length;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={active}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? 'border-cw-terracotta bg-cw-terracotta text-white'
                  : 'border-cw-stone-200 bg-white text-cw-stone-600 hover:border-cw-terracotta/50 dark:border-cw-stone-700 dark:bg-cw-stone-900 dark:text-cw-stone-300'
              }`}
            >
              {f} <span className="opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((p) => (
          <PartCard key={p.key} part={p} />
        ))}
      </div>
    </div>
  );
}
