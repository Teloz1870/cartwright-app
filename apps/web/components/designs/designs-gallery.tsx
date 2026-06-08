"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { DesignEntry } from "@/lib/designs-data";

type ModeFilter = "all" | "website" | "webshop";
type TierFilter = "all" | "pro" | "free";

function Swatches({ palette }: { palette: DesignEntry["palette"] }) {
  if (!palette) return null;
  const order = [palette.accent, palette.accentDeep, palette.ink, palette.sand, palette.cream, palette.muted];
  return (
    <div className="flex gap-1.5" aria-hidden>
      {order.map((hex, i) => (
        <span
          key={i}
          className="h-5 w-5 rounded-full border border-cw-stone-200 dark:border-cw-stone-700"
          style={{ backgroundColor: hex }}
          title={hex}
        />
      ))}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "border-cw-terracotta bg-cw-terracotta/10 text-cw-terracotta"
          : "border-cw-stone-200 text-cw-stone-600 hover:border-cw-stone-400 dark:border-cw-stone-700 dark:text-cw-stone-300"
      }`}
    >
      {children}
    </button>
  );
}

export function DesignsGallery({ designs }: { designs: DesignEntry[] }) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<ModeFilter>("all");
  const [tier, setTier] = useState<TierFilter>("all");
  const [only3D, setOnly3D] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return designs.filter((d) => {
      if (mode !== "all" && d.mode !== mode && d.mode !== "both") return false;
      if (tier === "pro" && !d.premium) return false;
      if (tier === "free" && d.premium) return false;
      if (only3D && !d.threeD) return false;
      if (q && !`${d.name} ${d.description} ${d.slug}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [designs, query, mode, tier, only3D]);

  return (
    <div className="flex flex-col gap-6">
      {/* Controls */}
      <div className="flex flex-col gap-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search designs…"
          className="w-full rounded-xl border border-cw-stone-200 bg-white px-4 py-2.5 text-sm text-cw-stone-900 outline-none focus-visible:border-cw-terracotta dark:border-cw-stone-700 dark:bg-cw-stone-900 dark:text-cw-stone-50"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Chip active={mode === "all"} onClick={() => setMode("all")}>All modes</Chip>
          <Chip active={mode === "website"} onClick={() => setMode("website")}>Website</Chip>
          <Chip active={mode === "webshop"} onClick={() => setMode("webshop")}>Webshop</Chip>
          <span className="mx-1 h-5 w-px bg-cw-stone-200 dark:bg-cw-stone-700" aria-hidden />
          <Chip active={tier === "all"} onClick={() => setTier("all")}>All</Chip>
          <Chip active={tier === "pro"} onClick={() => setTier("pro")}>Pro</Chip>
          <Chip active={tier === "free"} onClick={() => setTier("free")}>Free</Chip>
          <span className="mx-1 h-5 w-px bg-cw-stone-200 dark:bg-cw-stone-700" aria-hidden />
          <Chip active={only3D} onClick={() => setOnly3D((v) => !v)}>3D ✦</Chip>
        </div>
        <p className="text-sm text-cw-stone-500 dark:text-cw-stone-400">
          {filtered.length} {filtered.length === 1 ? "design" : "designs"}
        </p>
      </div>

      {/* Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((d) => (
          <Link
            key={d.slug}
            href={`/designs/${d.slug}`}
            className="group flex flex-col gap-4 rounded-2xl border border-cw-stone-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-cw-terracotta/50 hover:shadow-lg dark:border-cw-stone-700 dark:bg-cw-stone-900"
          >
            <Swatches palette={d.palette} />
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-cw-stone-900 group-hover:text-cw-terracotta dark:text-cw-stone-50">
                {d.name}
              </h3>
              {d.premium && <Badge tone="oker">Pro</Badge>}
              {d.threeD && <Badge tone="terracotta">3D</Badge>}
              <Badge>{d.mode}</Badge>
            </div>
            <p className="flex-1 text-sm leading-relaxed text-cw-stone-500 dark:text-cw-stone-400">
              {d.description}
            </p>
            <span className="text-sm font-medium text-cw-terracotta">
              View design →
            </span>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-12 text-center text-cw-stone-500 dark:text-cw-stone-400">
          No designs match those filters.
        </p>
      )}
    </div>
  );
}
