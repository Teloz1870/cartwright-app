'use client';

import { useMotionAllowed } from '@/lib/use-motion-allowed';

/**
 * The screen the install command actually produces.
 *
 * The hero prints a command; this is what answers it, recorded from a real
 * scaffold made by that exact command rather than mocked up. It sits before the
 * Interlock on purpose: first the promise is kept, then the chapter explains
 * how the thing stays safe once an agent starts operating it.
 *
 * Deliberately quiet — no headline competing with the hero, one line of
 * caption, and the frame doing the talking.
 *
 * On motion: 321 KB and gated. This site already carries a 3.19 MB video that
 * autoplays in its second section with no reduced-motion check, which is the
 * mistake this is careful not to repeat. Readers who ask for less motion get
 * the poster and never fetch the video at all — the component returns a
 * different element rather than pausing one, so the bytes are genuinely saved.
 */
export function FirstRun() {
  const motion = useMotionAllowed();

  return (
    <section className="border-b border-cw-rule bg-cw-canvas">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
        <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-cw-muted">
            What the command answers with
          </p>
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-cw-muted">
            recorded from a real scaffold
          </p>
        </div>

        <figure className="mt-6">
          <div className="overflow-hidden border border-cw-rule bg-cw-surface">
            {motion ? (
              <video
                className="block w-full"
                poster="/first-run/welcome.jpg"
                autoPlay
                muted
                loop
                playsInline
                preload="none"
                aria-label="The first-run welcome screen of a freshly scaffolded Cartwright shop"
              >
                <source src="/first-run/welcome.webm" type="video/webm" />
                <source src="/first-run/welcome.mp4" type="video/mp4" />
              </video>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element -- a fixed
                 poster for one known asset; the image pipeline would add a
                 request without adding anything. */
              <img
                src="/first-run/welcome.jpg"
                alt="The first-run welcome screen of a freshly scaffolded Cartwright shop: “Your site was just born”, with three ways to begin — build it with AI, a guided setup wizard, or compose a look."
                className="block w-full"
                width={1280}
                height={800}
              />
            )}
          </div>
          <figcaption className="mt-4 max-w-[62ch] text-sm leading-relaxed text-cw-muted">
            One command, and the shop is already running with a database, auth,
            an admin and checkout behind it. Nothing here is a template preview —
            it is the site, waiting for you to say what it sells.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
