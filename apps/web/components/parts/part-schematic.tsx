import type { PartShape } from '@/lib/parts-data';

/**
 * A tiny CSS "wireframe" preview of a Part — no screenshots needed. Muted blocks
 * = structure; the cw-terracotta blocks = the accent element (button / featured
 * tile / number), so the schematic reads as palette-adaptive just like the real
 * Part. Purely presentational.
 */

const MUTED = 'rounded bg-cw-stone-300 dark:bg-cw-stone-600';
const FAINT = 'rounded bg-cw-stone-200 dark:bg-cw-stone-700';
const ACCENT = 'rounded bg-cw-terracotta';

function Frame({
  children,
  glow,
}: {
  children: React.ReactNode;
  glow?: boolean;
}) {
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-cw-stone-200 bg-cw-stone-50 p-4 dark:border-cw-stone-700 dark:bg-cw-stone-900">
      {glow ? (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,var(--tw-gradient-stops))] from-cw-terracotta/35 via-cw-terracotta/5 to-transparent" />
      ) : null}
      <div className="relative flex h-full w-full">{children}</div>
    </div>
  );
}

export function PartSchematic({ shape }: { shape: PartShape }) {
  switch (shape) {
    case 'hero':
    case 'hero3d':
      return (
        <Frame glow={shape === 'hero3d'}>
          <div className="m-auto flex w-full flex-col items-center gap-2">
            <div className={`h-2 w-14 ${FAINT}`} />
            <div className={`h-3 w-3/5 ${MUTED}`} />
            <div className={`h-2 w-2/5 ${FAINT}`} />
            <div className={`mt-1 h-4 w-20 ${ACCENT}`} />
          </div>
        </Frame>
      );
    case 'split':
      return (
        <Frame>
          <div className="flex w-full items-center gap-3">
            <div className="flex flex-1 flex-col gap-2">
              <div className={`h-3 w-4/5 ${MUTED}`} />
              <div className={`h-2 w-full ${FAINT}`} />
              <div className={`h-2 w-3/4 ${FAINT}`} />
              <div className={`mt-1 h-4 w-16 ${ACCENT}`} />
            </div>
            <div className={`h-full flex-1 ${MUTED}`} />
          </div>
        </Frame>
      );
    case 'media':
      return (
        <Frame>
          <div className={`relative h-full w-full ${MUTED}`}>
            <div className="absolute inset-0 m-auto flex h-fit w-fit flex-col items-center gap-2">
              <div className="h-3 w-24 rounded bg-cw-stone-100/90" />
              <div className="h-4 w-16 rounded bg-cw-terracotta" />
            </div>
          </div>
        </Frame>
      );
    case 'grid':
      return (
        <Frame>
          <div className="grid w-full grid-cols-3 grid-rows-2 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`${FAINT}`} />
            ))}
          </div>
        </Frame>
      );
    case 'bento':
      return (
        <Frame>
          <div className="grid w-full grid-cols-3 grid-rows-2 gap-2">
            <div className={`col-span-2 row-span-2 ${ACCENT}`} />
            <div className={FAINT} />
            <div className={FAINT} />
          </div>
        </Frame>
      );
    case 'marquee':
      return (
        <Frame>
          <div className="m-auto flex w-full items-center gap-3 [mask-image:linear-gradient(90deg,transparent,#000_15%,#000_85%,transparent)]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`h-4 w-16 shrink-0 ${i % 2 ? FAINT : MUTED}`} />
            ))}
          </div>
        </Frame>
      );
    case 'band':
      return (
        <Frame>
          <div className="m-auto grid w-full grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className={`h-5 w-12 ${MUTED}`} />
                <div className={`h-2 w-8 ${FAINT}`} />
              </div>
            ))}
          </div>
        </Frame>
      );
    case 'steps':
      return (
        <Frame>
          <div className="m-auto grid w-full grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className={`size-5 rounded-full ${ACCENT}`} />
                <div className={`h-2 w-12 ${MUTED}`} />
                <div className={`h-2 w-8 ${FAINT}`} />
              </div>
            ))}
          </div>
        </Frame>
      );
    case 'quote':
      return (
        <Frame>
          <div className="m-auto flex w-full flex-col items-center gap-2">
            <div className={`h-3 w-4/5 ${MUTED}`} />
            <div className={`h-3 w-3/5 ${MUTED}`} />
            <div className={`mt-1 h-2 w-20 ${FAINT}`} />
          </div>
        </Frame>
      );
    case 'list':
      return (
        <Frame>
          <div className="m-auto flex w-full flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`h-3 w-full ${i % 2 ? FAINT : MUTED}`} />
            ))}
          </div>
        </Frame>
      );
    case 'logos':
      return (
        <Frame>
          <div className="m-auto flex w-full items-center justify-between gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`h-5 flex-1 rounded-md ${FAINT}`} />
            ))}
          </div>
        </Frame>
      );
    case 'gallery':
      return (
        <Frame>
          <div className="grid w-full grid-cols-3 gap-2">
            <div className={`row-span-2 ${MUTED}`} />
            <div className={MUTED} />
            <div className={FAINT} />
            <div className={FAINT} />
            <div className={MUTED} />
          </div>
        </Frame>
      );
    case 'cta':
      return (
        <Frame>
          <div className="m-auto flex w-full flex-col items-center gap-2 rounded-lg bg-cw-terracotta/10 px-4 py-5">
            <div className={`h-3 w-2/3 ${MUTED}`} />
            <div className={`h-2 w-1/2 ${FAINT}`} />
            <div className={`mt-1 h-4 w-20 ${ACCENT}`} />
          </div>
        </Frame>
      );
    case 'text':
      return (
        <Frame>
          <div className="m-auto flex w-full flex-col gap-2">
            <div className={`h-3 w-1/3 ${MUTED}`} />
            <div className={`h-2 w-full ${FAINT}`} />
            <div className={`h-2 w-full ${FAINT}`} />
            <div className={`h-2 w-5/6 ${FAINT}`} />
            <div className={`h-2 w-2/3 ${FAINT}`} />
          </div>
        </Frame>
      );
    default:
      return <Frame>{null}</Frame>;
  }
}
