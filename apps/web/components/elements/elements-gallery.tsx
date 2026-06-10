"use client";

import { useRef } from "react";
import { Badge } from "@/components/ui/badge";
import type { ElementEntry } from "@/lib/elements-data";

function ElementCard({ element }: { element: ElementEntry }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mp4 = element.previewVideo?.replace(/\.webm$/, ".mp4");

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
        {element.previewVideo ? (
          <>
            <video
              ref={videoRef}
              poster={element.previewImage}
              width={1280}
              height={800}
              muted
              loop
              playsInline
              preload="none"
              className="aspect-[16/10] w-full rounded-xl border border-cw-stone-200 bg-cw-stone-900 object-cover dark:border-cw-stone-700"
            >
              <source src={element.previewVideo} type="video/webm" />
              {mp4 ? <source src={mp4} type="video/mp4" /> : null}
            </video>
            <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-cw-stone-900/70 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
              ▶ Hover
            </span>
          </>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={element.previewImage}
            alt={`${element.name} preview`}
            width={1280}
            height={800}
            loading="lazy"
            className="aspect-[16/10] w-full rounded-xl border border-cw-stone-200 bg-cw-stone-900 object-cover dark:border-cw-stone-700"
          />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-semibold text-cw-stone-900 group-hover:text-cw-terracotta dark:text-cw-stone-50">
          {element.name}
        </h3>
        <Badge>{element.vibe}</Badge>
      </div>
      <p className="flex-1 text-sm leading-relaxed text-cw-stone-500 dark:text-cw-stone-400">
        {element.description}
      </p>
      <code className="font-mono text-xs text-cw-stone-400">element: &quot;{element.slug}&quot;</code>
    </div>
  );
}

export function ElementsGallery({ elements }: { elements: ElementEntry[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {elements.map((e) => (
        <ElementCard key={e.slug} element={e} />
      ))}
    </div>
  );
}
