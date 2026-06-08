"use client";

import { useRef } from "react";
import { Badge } from "@/components/ui/badge";
import type { SceneEntry } from "@/lib/scenes-data";

function SceneCard({ scene }: { scene: SceneEntry }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div className="group flex flex-col gap-4 rounded-2xl border border-cw-stone-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-cw-terracotta/50 hover:shadow-lg dark:border-cw-stone-700 dark:bg-cw-stone-900">
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
          poster={`/scenes/${scene.slug}.jpg`}
          width={1280}
          height={800}
          muted
          loop
          playsInline
          preload="none"
          className="aspect-[16/10] w-full rounded-xl border border-cw-stone-200 bg-cw-stone-900 object-cover dark:border-cw-stone-700"
        >
          <source src={`/scenes/${scene.slug}.webm`} type="video/webm" />
          <source src={`/scenes/${scene.slug}.mp4`} type="video/mp4" />
        </video>
        <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-cw-stone-900/70 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
          ▶ Hover
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-semibold text-cw-stone-900 group-hover:text-cw-terracotta dark:text-cw-stone-50">
          {scene.label}
        </h3>
        {scene.isNew ? <Badge tone="terracotta">New</Badge> : null}
        <Badge>{scene.vibe}</Badge>
      </div>
      <p className="flex-1 text-sm leading-relaxed text-cw-stone-500 dark:text-cw-stone-400">
        {scene.description}
      </p>
      <code className="font-mono text-xs text-cw-stone-400">scene: &quot;{scene.slug}&quot;</code>
    </div>
  );
}

export function ScenesGallery({ scenes }: { scenes: SceneEntry[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {scenes.map((s) => (
        <SceneCard key={s.slug} scene={s} />
      ))}
    </div>
  );
}
