'use client';

// The public Mixer studio — a Skin × Voice × Chrome composer over the
// vendored marketplace manifest (static-mock preview).
//
// TODO(mixer-live-preview): the composed preview below is a manifest-rendered
// mock (voice copy + palette + motif + chrome strips), not the real engine
// page. The planned upgrade is a live iframe against an engine mixer-preview
// deployment — the engine already ships the gated /<locale>/mixer-preview
// route (with &header=&footer= params) and the admin Page Mixer drives
// exactly that. Standing up a public preview deploy is an owner decision
// (infra + cost), so the static mock ships first.
//
// dangerouslySetInnerHTML is safe here by construction: the motif `markup` is
// our own build-time-generated static SVG from the vendored manifest (see
// components/svg-items-gallery.tsx for the same pattern), never user input.

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { CopyCommand } from '@/components/landing/copy-command';
import { PromptBlock } from '@/components/designs/prompt-block';
import { cn } from '@/lib/cn';
import type {
  ChromeEntry,
  ChromeKind,
  CompositionRecipe,
  LookEntry,
  MixerDesignEntry,
  Palette,
  VoiceEntry,
} from '@/lib/marketplace';

const DEFAULT_SKIN = 'fable';
const DEFAULT_VOICE = 'fable';

const MODE_ORDER: MixerDesignEntry['mode'][] = ['website', 'webshop', 'both'];
const MODE_LABEL: Record<MixerDesignEntry['mode'], string> = {
  website: 'Website skins',
  webshop: 'Webshop skins',
  both: 'Site + shop skins',
};

/**
 * Tint a motif SVG to the selected palette: the engine renders motifs against
 * cw-* CSS custom properties (with terracotta/oker/paper fallbacks), so
 * overriding those vars inline re-colours the whole drawing — exactly what
 * `applyPaletteAsTheme` does in a real shop.
 */
function motifStyle(p: Palette): CSSProperties {
  return {
    color: p.ink,
    '--color-cw-accent': p.accent,
    '--color-cw-accent-deep': p.accentDeep,
    '--color-cw-cream': p.cream,
    '--color-cw-sand': p.sand,
    '--color-cw-ink': p.ink,
    '--color-cw-muted': p.muted,
    '--color-cw-paper': p.cream,
    '--color-cw-gold': p.accent,
    '--color-cw-gold-deep': p.accentDeep,
    '--color-cw-terracotta': p.accent,
    '--color-cw-terracotta-strong': p.accentDeep,
    '--color-cw-oker': p.accent,
    '--color-cw-oker-strong': p.accentDeep,
  } as CSSProperties;
}

/** kebab-case a composition name for the download filename. */
function slugifyName(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'composition'
  );
}

function SkinChip({
  design,
  selected,
  onSelect,
}: {
  design: MixerDesignEntry;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-colors',
        selected
          ? 'border-cw-terracotta bg-cw-terracotta/10 text-cw-stone-900 dark:text-cw-stone-50'
          : 'border-cw-stone-200 text-cw-stone-700 hover:border-cw-terracotta/50 hover:text-cw-stone-900 dark:border-cw-stone-700 dark:text-cw-stone-300 dark:hover:text-cw-stone-50',
      )}
    >
      {design.palette && (
        <span
          aria-hidden
          className="size-2.5 shrink-0 rounded-full border border-black/10"
          style={{ backgroundColor: design.palette.accent }}
        />
      )}
      {design.name}
      {design.premium && (
        <span className="rounded-full bg-cw-oker/15 px-1.5 text-[10px] font-semibold uppercase tracking-wide text-cw-oker-strong dark:text-cw-oker">
          Pro
        </span>
      )}
      {design.threeD && (
        <span className="rounded-full bg-cw-terracotta/10 px-1.5 text-[10px] font-semibold uppercase tracking-wide text-cw-terracotta">
          3D
        </span>
      )}
    </button>
  );
}

function VoiceChip({
  voice,
  selected,
  onSelect,
}: {
  voice: VoiceEntry;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
        selected
          ? 'border-cw-terracotta bg-cw-terracotta/10'
          : 'border-cw-stone-200 hover:border-cw-terracotta/50 dark:border-cw-stone-700',
      )}
    >
      <span
        aria-hidden
        className="size-4 shrink-0 rounded-full border border-black/10"
        style={{ backgroundColor: voice.palette.accent }}
      />
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-cw-stone-900 dark:text-cw-stone-50">
          {voice.name}
        </span>
        <span className="block truncate text-xs text-cw-stone-500 dark:text-cw-stone-400">
          {voice.vibe}
        </span>
      </span>
    </button>
  );
}

function ChromeChip({
  label,
  sublabel,
  selected,
  onSelect,
}: {
  label: string;
  sublabel?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-colors',
        selected
          ? 'border-cw-terracotta bg-cw-terracotta/10 text-cw-stone-900 dark:text-cw-stone-50'
          : 'border-cw-stone-200 text-cw-stone-700 hover:border-cw-terracotta/50 hover:text-cw-stone-900 dark:border-cw-stone-700 dark:text-cw-stone-300 dark:hover:text-cw-stone-50',
      )}
    >
      {label}
      {sublabel && (
        <span className="rounded-full bg-cw-stone-100 px-1.5 text-[10px] font-semibold uppercase tracking-wide text-cw-stone-500 dark:bg-cw-stone-800 dark:text-cw-stone-400">
          {sublabel}
        </span>
      )}
    </button>
  );
}

export function MixerStudio({
  designs,
  voices,
  chrome,
  looks,
  motifs,
}: {
  designs: MixerDesignEntry[];
  voices: VoiceEntry[];
  /** The engine chrome registry (manifest v3) — header/footer parts. */
  chrome: ChromeEntry[];
  /** Curated Looks incl. their full composition recipes (for the download). */
  looks: LookEntry[];
  /** motifSlug → pre-rendered SVG markup (subset of the manifest svgItems). */
  motifs: Record<string, string>;
}) {
  const [skinSlug, setSkinSlug] = useState(DEFAULT_SKIN);
  const [voiceSlug, setVoiceSlug] = useState(DEFAULT_VOICE);
  // null = the design's own default chrome (unset chromeJson in a real shop).
  const [headerKey, setHeaderKey] = useState<string | null>(null);
  const [footerKey, setFooterKey] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [hydratedFromUrl, setHydratedFromUrl] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  // Deep-linking: /mixer?skin=&voice=&header=&footer= (e.g. "Use in the
  // Mixer" from a Look or /chrome card). Read once on mount — window-based so
  // the page itself stays fully static.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const skin = params.get('skin');
    const voice = params.get('voice');
    const header = params.get('header');
    const footer = params.get('footer');
    if (skin && designs.some((d) => d.slug === skin)) setSkinSlug(skin);
    if (voice && voices.some((v) => v.slug === voice)) setVoiceSlug(voice);
    if (header && chrome.some((c) => c.key === header && c.kind === 'header')) {
      setHeaderKey(header);
    }
    if (footer && chrome.some((c) => c.key === footer && c.kind === 'footer')) {
      setFooterKey(footer);
    }
    setHydratedFromUrl(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the URL shareable: reflect the current composition into the query
  // string (replaceState — no history spam, no navigation).
  useEffect(() => {
    if (!hydratedFromUrl) return;
    const params = new URLSearchParams({ skin: skinSlug, voice: voiceSlug });
    if (headerKey) params.set('header', headerKey);
    if (footerKey) params.set('footer', footerKey);
    window.history.replaceState(null, '', `/mixer?${params.toString()}`);
  }, [hydratedFromUrl, skinSlug, voiceSlug, headerKey, footerKey]);

  const design = designs.find((d) => d.slug === skinSlug) ?? designs[0];
  const voice = voices.find((v) => v.slug === voiceSlug) ?? voices[0];

  // Two-sided mixability (same rule as the engine's chrome.set): a chrome is
  // selectable on this skin when it's mixable OR it's the skin's own chrome.
  const selectableChrome = useMemo(
    () => chrome.filter((c) => c.mixable || c.designSlug === design.slug),
    [chrome, design.slug],
  );
  const headerOptions = selectableChrome.filter((c) => c.kind === 'header');
  const footerOptions = selectableChrome.filter((c) => c.kind === 'footer');

  // Changing skin can orphan a design-locked pick — fall back to the default.
  useEffect(() => {
    if (headerKey && !headerOptions.some((c) => c.key === headerKey)) setHeaderKey(null);
    if (footerKey && !footerOptions.some((c) => c.key === footerKey)) setFooterKey(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design.slug]);

  const header = headerKey ? (chrome.find((c) => c.key === headerKey) ?? null) : null;
  const footer = footerKey ? (chrome.find((c) => c.key === footerKey) ?? null) : null;
  const defaultChromeLabel = (kind: ChromeKind) =>
    design.hasOwnChrome ? `${design.name} ${kind} (default)` : `Engine default ${kind}`;

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = q
      ? designs.filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            d.slug.includes(q) ||
            d.description.toLowerCase().includes(q),
        )
      : designs;
    return MODE_ORDER.map((mode) => ({
      mode,
      designs: matches.filter((d) => d.mode === mode),
    })).filter((g) => g.designs.length > 0);
  }, [designs, query]);

  // The preview wears the Skin's default palette (each pack ships one); the
  // Voice contributes the copy. In a real shop a palette-adaptive Skin
  // re-colours to the brand / Voice palette on apply — noted under the card.
  const palette = design.palette ?? voice.palette;
  const motifMarkup = design.motifSlug ? motifs[design.motifSlug] : undefined;
  const cta = design.mode === 'webshop' ? 'Shop now →' : 'Get started →';

  // ── Composition (cartwright-composition-v1), built fully client-side ──
  const matchingLook = looks.find(
    (l) => l.designSlug === design.slug && l.voiceSlug === voice.slug && l.composition,
  );

  const composition: CompositionRecipe = useMemo(() => {
    // A curated Look ships the full recipe (palette + pre-written genome
    // copy + scene); ad-hoc combos get the Voice's identity anchors + scene.
    const base: CompositionRecipe = matchingLook?.composition
      ? { ...matchingLook.composition }
      : {
          schema: 'cartwright-composition-v1',
          name: `${design.name} × ${voice.name}`,
          description: `Composed in the public Mixer: the ${design.name} Skin wearing the ${voice.name} Voice.`,
          skin: design.slug,
          voice: {
            identity: {
              tone: voice.tone,
              audience: voice.audience,
              formality: voice.formality,
              vibe: voice.vibe,
            },
          },
          scene: voice.scene,
        };
    if (headerKey || footerKey) {
      base.chrome = {
        ...(headerKey ? { headerKey } : {}),
        ...(footerKey ? { footerKey } : {}),
      };
    }
    return base;
  }, [matchingLook, design, voice, headerKey, footerKey]);

  const compositionFile = `${slugifyName(composition.name)}.composition.json`;

  const downloadComposition = () => {
    const blob = new Blob([JSON.stringify(composition, null, 2) + '\n'], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = compositionFile;
    a.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 1600);
  };

  const agentPrompt =
    `Apply the "${voice.name}" Voice and the "${design.name}" design to my Cartwright store. Use the magic.compose_look tool with { vertical: "${voice.slug}", design: "${design.slug}" } — one audited step that re-tones the copy, sets the palette + 3D scene, and switches the active design.` +
    (headerKey || footerKey
      ? ` Then set the chrome with chrome.set { ${[
          headerKey ? `headerKey: "${headerKey}"` : null,
          footerKey ? `footerKey: "${footerKey}"` : null,
        ]
          .filter(Boolean)
          .join(', ')} }.`
      : '');

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* ── Pickers ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-8">
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-cw-terracotta">
              1 · Pick a Skin
            </h3>
            <span className="text-xs text-cw-stone-500 dark:text-cw-stone-400">
              {designs.length} designs
            </span>
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search skins…"
            aria-label="Search skins"
            className="mt-3 w-full rounded-lg border border-cw-stone-200 bg-white px-3 py-2 text-sm text-cw-stone-900 placeholder:text-cw-stone-400 focus:border-cw-terracotta focus:outline-none focus:ring-2 focus:ring-cw-terracotta/25 dark:border-cw-stone-700 dark:bg-cw-stone-900 dark:text-cw-stone-50"
          />
          <div className="mt-4 flex flex-col gap-4">
            {grouped.map((group) => (
              <div key={group.mode}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cw-stone-500 dark:text-cw-stone-400">
                  {MODE_LABEL[group.mode]}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.designs.map((d) => (
                    <SkinChip
                      key={d.slug}
                      design={d}
                      selected={d.slug === design.slug}
                      onSelect={() => setSkinSlug(d.slug)}
                    />
                  ))}
                </div>
              </div>
            ))}
            {grouped.length === 0 && (
              <p className="text-sm text-cw-stone-500 dark:text-cw-stone-400">
                No skin matches “{query}”.
              </p>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-cw-terracotta">
            2 · Pick a Voice
          </h3>
          <div className="mt-3 flex flex-col gap-2">
            {voices.map((v) => (
              <VoiceChip
                key={v.slug}
                voice={v}
                selected={v.slug === voice.slug}
                onSelect={() => setVoiceSlug(v.slug)}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-cw-terracotta">
              3 · Pick a Header
            </h3>
            <Link
              href="/chrome"
              className="text-xs text-cw-stone-500 hover:text-cw-terracotta dark:text-cw-stone-400"
            >
              Browse all chrome →
            </Link>
          </div>
          <p className="mt-1 text-xs text-cw-stone-500 dark:text-cw-stone-400">
            Mixable chrome from any design + this Skin&rsquo;s own. Design-locked chrome appears
            when you wear its Skin.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ChromeChip
              label={defaultChromeLabel('header')}
              selected={headerKey === null}
              onSelect={() => setHeaderKey(null)}
            />
            {headerOptions.map((c) => (
              <ChromeChip
                key={c.key}
                label={c.label}
                sublabel={c.designSlug === design.slug && !c.mixable ? 'locked' : undefined}
                selected={headerKey === c.key}
                onSelect={() => setHeaderKey(c.key)}
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-cw-terracotta">
            4 · Pick a Footer
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <ChromeChip
              label={defaultChromeLabel('footer')}
              selected={footerKey === null}
              onSelect={() => setFooterKey(null)}
            />
            {footerOptions.map((c) => (
              <ChromeChip
                key={c.key}
                label={c.label}
                sublabel={c.designSlug === design.slug && !c.mixable ? 'locked' : undefined}
                selected={footerKey === c.key}
                onSelect={() => setFooterKey(c.key)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Composed preview + output ──────────────────────────────── */}
      <div className="flex flex-col gap-8">
        <div className="overflow-hidden rounded-2xl border border-cw-stone-200 bg-white shadow-sm dark:border-cw-stone-700 dark:bg-cw-stone-900">
          {/* Header strip mock — reflects the chrome pick. */}
          <div
            className="flex items-center justify-between gap-4 border-b px-5 py-2.5 sm:px-7"
            style={{
              backgroundColor: palette.cream,
              borderColor: `${palette.ink}1a`,
            }}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: palette.accent }}
              />
              <span
                className="truncate font-mono text-[11px] uppercase tracking-wide"
                style={{ color: palette.muted }}
              >
                {header ? header.label : defaultChromeLabel('header')}
              </span>
            </span>
            <span aria-hidden className="hidden items-center gap-2.5 sm:flex">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1 w-6 rounded-full"
                  style={{ backgroundColor: palette.muted, opacity: 0.5 }}
                />
              ))}
              <span
                className="h-3.5 w-10 rounded-full"
                style={{ backgroundColor: palette.accent }}
              />
            </span>
          </div>

          {/* The mini-hero, scaled up: Voice copy in the Skin's palette. */}
          <div
            className="relative flex aspect-[16/9] flex-col justify-center gap-3 px-7 sm:px-12"
            style={{ backgroundColor: palette.cream }}
          >
            {motifMarkup && (
              <div
                aria-hidden
                className="pointer-events-none absolute right-5 top-5 size-16 opacity-90 sm:size-24 [&>svg]:size-full"
                style={motifStyle(palette)}
                // Safe: build-time-generated static markup from our own engine (see header comment).
                dangerouslySetInnerHTML={{ __html: motifMarkup }}
              />
            )}
            <span
              className="font-mono text-xs font-medium uppercase tracking-[0.18em] sm:text-sm"
              style={{ color: palette.accent }}
            >
              {voice.sampleEyebrow}
            </span>
            <span
              className="max-w-xl text-2xl font-semibold leading-tight tracking-tight sm:text-4xl"
              style={{ color: palette.ink }}
            >
              {voice.sampleHeadline}
            </span>
            <span
              className="mt-2 w-fit rounded-md px-4 py-1.5 text-sm font-medium"
              style={{ backgroundColor: palette.accent, color: palette.cream }}
            >
              {cta}
            </span>
          </div>

          {/* Footer strip mock — reflects the chrome pick. */}
          <div
            className="flex items-center justify-between gap-4 px-5 py-2.5 sm:px-7"
            style={{ backgroundColor: palette.ink }}
          >
            <span
              className="truncate font-mono text-[11px] uppercase tracking-wide"
              style={{ color: palette.cream, opacity: 0.75 }}
            >
              {footer ? footer.label : defaultChromeLabel('footer')}
            </span>
            <span
              aria-hidden
              className="h-1 w-16 shrink-0 rounded-full"
              style={{ backgroundColor: palette.accent }}
            />
          </div>

          {/* Palette swatch row */}
          <div className="flex h-3">
            {[palette.accent, palette.accentDeep, palette.sand, palette.muted, palette.ink].map(
              (c, i) => (
                <div key={i} className="flex-1" style={{ backgroundColor: c }} />
              ),
            )}
          </div>

          <div className="flex flex-col gap-3 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-cw-stone-900 dark:text-cw-stone-50">
                {design.name} × {voice.name}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{design.mode}</Badge>
              {design.premium && <Badge tone="oker">Pro</Badge>}
              {design.threeD && <Badge tone="terracotta">3D</Badge>}
              {design.hasOwnChrome && <Badge>own chrome</Badge>}
              {header && (
                <Badge>
                  header: <code className="font-mono">{header.key}</code>
                </Badge>
              )}
              {footer && (
                <Badge>
                  footer: <code className="font-mono">{footer.key}</code>
                </Badge>
              )}
              {design.motifSlug && (
                <Badge>
                  motif: <code className="font-mono">{design.motifSlug}</code>
                </Badge>
              )}
            </div>
            <p className="text-xs leading-relaxed text-cw-stone-500 dark:text-cw-stone-400">
              Static composition preview, rendered from the marketplace manifest — the Voice&rsquo;s
              real sample copy in the Skin&rsquo;s default palette, framed by your chrome picks.
              Palette-adaptive Skins re-colour to your brand / Voice palette when applied; a live
              full-page preview is the planned upgrade.
            </p>
          </div>
        </div>

        {/* ── Take the recipe home ───────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          <div>
            <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-cw-terracotta">
              5 · Download the composition
            </h3>
            <p className="mt-2 text-sm text-cw-stone-500 dark:text-cw-stone-400">
              One portable <code className="font-mono">cartwright-composition-v1</code> file with
              everything you composed — Skin, Voice{matchingLook ? ', palette, pre-written copy' : ''}
              , chrome and scene. Install it on any Cartwright shop.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={downloadComposition}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-cw-terracotta px-4 text-sm font-medium text-cw-ink transition-colors hover:bg-cw-terracotta-strong hover:text-white"
              >
                {downloaded ? 'Downloaded ✓' : 'Download composition'}
              </button>
              <code className="font-mono text-xs text-cw-stone-400">{compositionFile}</code>
            </div>
            <div className="mt-3">
              <CopyCommand size="md" command={`npx cartwright composition install ${compositionFile}`} />
            </div>
            <p className="mt-2 text-xs text-cw-stone-500 dark:text-cw-stone-400">
              CLI install is coming; today, import the file in your shop&rsquo;s admin
              (Designs → Import composition — dry-run preview, then one audited apply).
            </p>
          </div>

          <div>
            <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-cw-terracotta">
              Or scaffold from scratch
            </h3>
            <p className="mt-2 text-sm text-cw-stone-500 dark:text-cw-stone-400">
              Scaffold a store, then pull the Skin in (no scaffold-time design flag yet —
              install is its own command):
            </p>
            <div className="mt-3 flex flex-col gap-2.5">
              <CopyCommand
                size="md"
                command={`npx create-cartwright@latest my-store${design.mode === 'website' ? ' --template website-corporate' : ''}`}
              />
              <CopyCommand size="md" command={`npx create-cartwright design install ${design.slug}`} />
            </div>
            <p className="mt-3 text-sm text-cw-stone-500 dark:text-cw-stone-400">
              Then apply the Voice in <code className="font-mono">/admin/verticals</code> — it
              writes the Voice&rsquo;s identity + copy into the genome, sets the palette, and picks
              a 3D scene. (Older project missing the preset?{' '}
              <code className="font-mono">npx create-cartwright vertical install {voice.slug}</code>
              .)
            </p>
          </div>

          <div>
            <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-cw-terracotta">
              Or hand it to your agent
            </h3>
            <p className="mt-2 text-sm text-cw-stone-500 dark:text-cw-stone-400">
              Paste this into your store&rsquo;s admin AI chat (or any MCP client with build
              scopes) — the <code className="font-mono">magic.compose_look</code> tool composes the
              whole look in one step:
            </p>
            <div className="mt-3">
              <PromptBlock prompt={agentPrompt} />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <ButtonLink href={`/designs/${design.slug}`} variant="primary">
              View {design.name} →
            </ButtonLink>
            <ButtonLink href="/chrome" variant="secondary">
              Browse chrome
            </ButtonLink>
            <ButtonLink href="/verticals" variant="outline">
              About the Voices
            </ButtonLink>
            <ButtonLink href="/looks" variant="outline">
              Curated Looks
            </ButtonLink>
          </div>

          <p className="text-xs text-cw-stone-500 dark:text-cw-stone-400">
            Recipe:{' '}
            <Link href={`/designs/${design.slug}`} className="font-mono hover:text-cw-terracotta">
              skin:{design.slug}
            </Link>{' '}
            ×{' '}
            <Link href="/verticals" className="font-mono hover:text-cw-terracotta">
              voice:{voice.slug}
            </Link>
            {header && (
              <>
                {' '}
                ×{' '}
                <Link href="/chrome" className="font-mono hover:text-cw-terracotta">
                  header:{header.key}
                </Link>
              </>
            )}
            {footer && (
              <>
                {' '}
                ×{' '}
                <Link href="/chrome" className="font-mono hover:text-cw-terracotta">
                  footer:{footer.key}
                </Link>
              </>
            )}{' '}
            — this page&rsquo;s URL is shareable.
          </p>
        </div>
      </div>
    </div>
  );
}
