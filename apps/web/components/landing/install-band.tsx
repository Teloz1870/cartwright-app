import { Station } from '@/components/landing/station';
import { CopyCommand } from '@/components/landing/copy-command';
import { ButtonLink } from '@/components/ui/button';
import { INSTALL_COMMAND, INSTALL_COMMAND_SITE, SITE_COLD_RUN } from '@/lib/home-copy';

export function InstallBand() {
  return (
    <Station index="07" label="Start" id="s07" live title="One line. A shop in five minutes — a website in one.">
      {/* `min-w-0` on both columns: a grid item defaults to `min-width: auto`
          and refuses to shrink below its content's min-content width, so the
          mono install command — wider in Martian Mono than in the Geist Mono it
          replaced — set the column width and pushed the page 194px sideways at
          390px. The same trap as flexbox, one level up. */}
      <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_1fr] items-center">
        <div className="min-w-0">
          <p className="mt-4 text-base text-cw-muted max-w-md">
            Works on macOS, Linux, and Windows (via WSL). Node 22+ required.
            No GitHub token, no marketplace install — just npm.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ButtonLink
              href="/docs/getting-started/quick-start"
              variant="secondary"
              size="lg"
            >
              Quick start →
            </ButtonLink>
            <ButtonLink
              href="/docs/getting-started/cli-options"
              variant="ghost"
              size="lg"
              className="text-cw-stone-300 hover:text-cw-stone-50 hover:bg-cw-stone-800"
            >
              All CLI flags
            </ButtonLink>
          </div>
        </div>
        <div className="min-w-0 space-y-3">
          <CopyCommand command={INSTALL_COMMAND} />
          {/* The site command is inline, wrapping text — not a second CopyCommand:
              that component clamps to one line and would cut `--profile site`
              off at 390px (51 mono characters do not fit the phone column). */}
          <p className="text-xs text-cw-stone-400">
            <code className="font-mono text-cw-stone-200 break-all">{INSTALL_COMMAND_SITE}</code> — a plain website, no database, no login:{' '}
            {SITE_COLD_RUN.scaffold} to scaffold and install, {SITE_COLD_RUN.build} to build,{' '}
            {SITE_COLD_RUN.boot} to a rendered homepage (measured, provenance on the docs page).
          </p>
          {/* Stacked on a phone. Three columns of mono at 390px cannot fit —
              grid items default to `min-width: auto`, so they refuse to shrink
              below their content and widen the page instead of wrapping. */}
          <div className="grid grid-cols-1 gap-2 text-xs font-mono text-cw-stone-400 sm:grid-cols-3">
            <span className="min-w-0 truncate rounded-md border border-cw-stone-800 px-3 py-2 text-center">
              pnpm create cartwright
            </span>
            <span className="min-w-0 truncate rounded-md border border-cw-stone-800 px-3 py-2 text-center">
              npm create cartwright@latest
            </span>
            <span className="min-w-0 truncate rounded-md border border-cw-stone-800 px-3 py-2 text-center">
              bunx create-cartwright
            </span>
          </div>
        </div>
      </div>
    </Station>
  );
}
