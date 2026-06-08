"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { DesignEntry } from "@/lib/designs-data";
import { hasVideo } from "@/lib/design-media";

type ModeFilter = "all" | "website" | "webshop";
type TierFilter = "all" | "pro" | "free";
type Sort = "featured" | "popular" | "az";

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

function Preview({ slug, palette }: { slug: string; palette: DesignEntry["palette"] }) {
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgClass =
    "aspect-[16/10] w-full rounded-xl border border-cw-stone-200 object-cover object-top dark:border-cw-stone-700";

  if (failed) {
    return (
      <div className="flex aspect-[16/10] w-full items-center justify-center rounded-xl border border-cw-stone-200 bg-cw-stone-50 dark:border-cw-stone-700 dark:bg-cw-stone-800/40">
        <Swatches palette={palette} />
      </div>
    );
  }

  // Animated (WebGL) designs: static screenshot as poster, play the loop on hover.
  if (hasVideo(slug)) {
    return (
      <div
        className="relative"
        onMouseEnter={() => videoRef.current?.play().catch(() => {})}
        onMouseLeave={() => {
          const v = videoRef.current;
          if (v) {
            v.pause();
            v.currentTime = 0;
          }
        }}
      >
        <video
          ref={videoRef}
          poster={`/designs/${slug}.jpg`}
          width={1280}
          height={800}
          muted
          loop
          playsInline
          preload="none"
          onError={() => setFailed(true)}
          className={imgClass}
        >
          <source src={`/designs/${slug}.webm`} type="video/webm" />
          <source src={`/designs/${slug}.mp4`} type="video/mp4" />
        </video>
        <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-cw-stone-900/70 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
          ▶ Live
        </span>
      </div>
    );
  }

  return (
    <img
      src={`/designs/${slug}.jpg`}
      width={1280}
      height={800}
      loading="lazy"
      decoding="async"
      alt=""
      onError={() => setFailed(true)}
      className={imgClass}
    />
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
  const [sort, setSort] = useState<Sort>("featured");
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [likesOn, setLikesOn] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/designs/likes")
      .then((r) => r.json())
      .then((d: { configured?: boolean; likes?: Record<string, number> }) => {
        if (!alive) return;
        setLikes(d.likes ?? {});
        setLikesOn(Boolean(d.configured));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = designs.filter((d) => {
      if (mode !== "all" && d.mode !== mode && d.mode !== "both") return false;
      if (tier === "pro" && !d.premium) return false;
      if (tier === "free" && d.premium) return false;
      if (only3D && !d.threeD) return false;
      if (q && !`${d.name} ${d.description} ${d.slug}`.toLowerCase().includes(q)) return false;
      return true;
    });
    if (sort === "az") out.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "popular") out.sort((a, b) => (likes[b.slug] ?? 0) - (likes[a.slug] ?? 0));
    return out;
  }, [designs, query, mode, tier, only3D, sort, likes]);

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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-cw-stone-500 dark:text-cw-stone-400">
            {results.length} {results.length === 1 ? "design" : "designs"}
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-cw-stone-400">Sort</span>
            <Chip active={sort === "featured"} onClick={() => setSort("featured")}>Featured</Chip>
            {likesOn && (
              <Chip active={sort === "popular"} onClick={() => setSort("popular")}>Popular</Chip>
            )}
            <Chip active={sort === "az"} onClick={() => setSort("az")}>A–Z</Chip>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((d) => (
          <Link
            key={d.slug}
            href={`/designs/${d.slug}`}
            className="group flex flex-col gap-4 rounded-2xl border border-cw-stone-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-cw-terracotta/50 hover:shadow-lg dark:border-cw-stone-700 dark:bg-cw-stone-900"
          >
            <Preview slug={d.slug} palette={d.palette} />
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
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-cw-terracotta">View design →</span>
              {likesOn && (likes[d.slug] ?? 0) > 0 && (
                <span className="text-sm text-cw-stone-400" aria-label={`${likes[d.slug]} likes`}>
                  ♥ {likes[d.slug]}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {results.length === 0 && (
        <p className="py-12 text-center text-cw-stone-500 dark:text-cw-stone-400">
          No designs match those filters.
        </p>
      )}
    </div>
  );
}
