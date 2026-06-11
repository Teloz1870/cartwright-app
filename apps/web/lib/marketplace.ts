// Single source of truth for every gallery on this site.
//
// All catalogue data (designs, voices, scenes, SVG items, elements, looks,
// chrome parts) derives from the Cartwright engine's
// `marketplace-manifest.json` (v3), vendored at lib/marketplace-manifest.json.
// Refresh it with `pnpm sync:manifest` (fetches the manifest from the public
// template mirror).
//
// The old hand-maintained data files (designs-data.ts, verticals-data.ts,
// scenes-data.ts, elements-data.ts, looks-data.ts) are now thin re-exports
// from this module — same exported names and types, so consumers are
// untouched.
//
// Validation happens at module load: a malformed or stale manifest fails the
// production build instead of silently shipping a broken gallery.

import manifestJson from './marketplace-manifest.json';

/* ------------------------------------------------------------------ */
/* Types (kept byte-compatible with the old per-file exports)          */
/* ------------------------------------------------------------------ */

export type Palette = {
  accent: string;
  accentDeep: string;
  cream: string;
  sand: string;
  ink: string;
  muted: string;
};

export type DesignEntry = {
  slug: string;
  name: string;
  description: string;
  mode: 'website' | 'webshop' | 'both';
  premium: boolean;
  threeD: boolean;
  palette: Palette | null;
};

export type VoicePalette = Palette;

export type VoiceEntry = {
  slug: string;
  name: string;
  description: string;
  keywords: string[];
  /** identity anchors */
  tone: string;
  audience: string;
  formality: string;
  vibe: string;
  /** suggested palette-adaptive skin + Live Canvas scene */
  suggestedDesign: string;
  scene: string;
  palette: VoicePalette;
  /** a re-toned copy sample (from the preset's genome overrides) */
  sampleEyebrow: string;
  sampleHeadline: string;
};

export type SceneEntry = {
  slug: string;
  label: string;
  description: string;
  /** Short vibe tag for the gallery (app-only — not in the manifest). */
  vibe: string;
  /** True for the scenes added in the v0.x "wild premium" batch (app-only). */
  isNew?: boolean;
};

export type SvgItemKind = 'mark' | 'divider' | 'illustration';

export type SvgItem = {
  /** Stable kebab-case id; the registry serves each item as `svg-<slug>`. */
  slug: string;
  /** Display name (matches the exported component name in PascalCase). */
  name: string;
  kind: SvgItemKind;
  description: string;
  /**
   * The item's full rendered SVG markup, generated at build time by the
   * engine from its own server components (palette tokens + fallback chain
   * intact). Static, trusted, first-party content.
   */
  markup: string;
};

export type ElementEntry = {
  slug: string;
  name: string;
  description: string;
  /** Short vibe tag for the gallery. */
  vibe: string;
  /** Poster image path under public/. */
  previewImage: string;
  /** Optional hover-video path (webm; an .mp4 sibling is assumed). */
  previewVideo?: string;
};

/**
 * A downloadable/uploadable composition artifact — the engine's
 * `cartwright-composition-v1` (lib/compositions/spec.ts in the engine).
 * Every field maps onto governed runtime data (designSlug / themeJson /
 * genomeJson / chromeJson / threeDConfigJson), never code.
 */
export type CompositionRecipe = {
  schema: 'cartwright-composition-v1';
  name: string;
  description?: string;
  /** The Skin — a design slug. */
  skin: string;
  /** Brand palette → themeJson (omitted = keep / design default). */
  palette?: Palette;
  /** The Voice — identity anchors + pre-written genome copy. */
  voice?: {
    identity?: { tone?: string; audience?: string; formality?: string; vibe?: string };
    genomeOverrides?: Record<string, string>;
  };
  /** Selected chrome parts (chrome-registry keys). */
  chrome?: { headerKey?: string; footerKey?: string };
  /** Live Canvas 3D scene id. */
  scene?: string;
};

export type LookEntry = {
  slug: string;
  /** Evocative name for the combo. */
  name: string;
  /** Curator's note — why this pairing works. */
  description: string;
  /** References a DesignEntry.slug (the Skin). */
  designSlug: string;
  /** References a VoiceEntry.slug (the Voice). */
  voiceSlug: string;
  /**
   * The full composition artifact behind the Look (manifest v3) — what
   * "Download this look" / the Mixer's composition download serves.
   */
  composition?: CompositionRecipe;
};

export type ChromeKind = 'header' | 'footer';

/**
 * One entry from the engine's chrome registry (manifest v3 `chrome[]`):
 * a selectable header or footer part.
 *
 * - `designSlug` names the design that ships the chrome, or `null` for the
 *   neutral engine parts (minimal-header, centered-header, mega-footer,
 *   slim-footer).
 * - `mixable: true` means the part can be selected on ANY design; `false`
 *   means it is locked to its own design (only selectable there).
 */
export type ChromeEntry = {
  key: string;
  kind: ChromeKind;
  label: string;
  designSlug: string | null;
  mixable: boolean;
};

/**
 * A design entry including the manifest-only fields the public Mixer needs:
 * the design's signature SVG motif (if any) and whether it ships its own
 * header/footer chrome instead of adopting the engine default.
 */
export type MixerDesignEntry = DesignEntry & {
  /** References an SvgItem.slug, or null when the design has no motif. */
  motifSlug: string | null;
  hasOwnChrome: boolean;
};

/* ------------------------------------------------------------------ */
/* Manifest shape (engine marketplace-manifest v3)                     */
/* ------------------------------------------------------------------ */

const EXPECTED_SCHEMA = 'cartwright-marketplace-manifest-v3';

type ManifestDesign = DesignEntry & {
  motifSlug: string | null;
  hasOwnChrome: boolean;
};

type ManifestScene = { slug: string; label: string; description: string };

type MarketplaceManifest = {
  $schema: string;
  version: string;
  designs: ManifestDesign[];
  voices: VoiceEntry[];
  scenes: ManifestScene[];
  svgItems: SvgItem[];
  elements: ElementEntry[];
  looks: LookEntry[];
  chrome: ChromeEntry[];
};

/* ------------------------------------------------------------------ */
/* App-only scene metadata (merged over the manifest)                  */
/* ------------------------------------------------------------------ */

/**
 * Scene overrides keyed by manifest slug.
 *
 * - `vibe` / `isNew` are app-only gallery fields the manifest doesn't carry.
 * - `label` / `description` TEMPORARILY override the manifest copy: the
 *   engine's scene registry still ships Danish labels for the original four
 *   scenes, while this site is English-first. Drop the label/description
 *   overrides once the engine manifest ships English scene copy.
 *
 * Every key here MUST exist in the manifest — validated below, so a renamed
 * or removed engine scene fails the build instead of silently drifting.
 */
const SCENE_OVERRIDES: Record<
  string,
  { label?: string; description?: string; vibe: string; isNew?: boolean }
> = {
  butterflies: {
    label: 'Butterflies',
    description:
      'An instanced flock of palette-tinted butterflies — procedural wings, flap-and-glide flight, scattering from the pointer. The FABLE flagship hero.',
    vibe: 'organic · metamorphosis',
    isNew: true,
  },
  aurora: {
    label: 'Aurora',
    description:
      'Full-screen GLSL aurora — flowing, mouse-reactive ribbons of light. The flagship premium dark-luxe hero.',
    vibe: 'premium · dark-luxe',
  },
  waves: {
    label: 'Waves',
    description:
      'A full-bleed plane of flowing noise dunes, palette-graded trough→crest with a fresnel sheen. Calm and organic.',
    vibe: 'organic',
    isNew: true,
  },
  orb: {
    label: 'Orb',
    description:
      'A glowing, gently-pulsing core sphere wrapped in a halo of orbiting points. Reads as a product / AI core.',
    vibe: 'core · AI',
    isNew: true,
  },
  gridflow: {
    label: 'Grid-flow',
    description:
      'A glowing perspective grid floor + faint ceiling flowing to a horizon. Retro-future synthwave energy.',
    vibe: 'retro-future',
    isNew: true,
  },
  blob: {
    label: 'Morphing blob',
    description:
      'An organic gradient form that undulates with layered noise. Trendy, friendly modern-SaaS look.',
    vibe: 'organic · SaaS',
  },
  particles: {
    label: 'Particle field',
    description:
      'A field of floating dots that drift and react to the cursor. Technical, data / AI atmosphere.',
    vibe: 'tech · data',
  },
  wireframe: {
    label: 'Low-poly / wireframe',
    description:
      'A geometric wireframe in perspective. Structured, engineered, blueprint-like.',
    vibe: 'structured · tech',
  },
  'floating-geometry': {
    label: 'Floating geometry',
    description:
      'Glassy, slowly-rotating shapes. Elegant and brand-neutral — safe on any site.',
    vibe: 'elegant',
  },
};

/** Gallery display order (app concern — flagship/new scenes lead). Unknown
 *  manifest scenes are appended after these, in manifest order. */
const SCENE_ORDER = [
  'butterflies',
  'aurora',
  'waves',
  'orb',
  'gridflow',
  'blob',
  'particles',
  'wireframe',
  'floating-geometry',
];

/* ------------------------------------------------------------------ */
/* Load + validate (throws at build time on a malformed manifest)      */
/* ------------------------------------------------------------------ */

function fail(message: string): never {
  throw new Error(
    `[marketplace] vendored marketplace-manifest.json is invalid: ${message} ` +
      '(refresh it with `pnpm sync:manifest`)',
  );
}

function loadManifest(): MarketplaceManifest {
  const m = manifestJson as unknown as MarketplaceManifest;

  // CI-staleness guard: the vendored copy must be the v2 schema this module
  // was written against.
  if (m.$schema !== EXPECTED_SCHEMA) {
    fail(`$schema is ${JSON.stringify(m.$schema)}, expected "${EXPECTED_SCHEMA}"`);
  }

  for (const key of [
    'designs',
    'voices',
    'scenes',
    'svgItems',
    'elements',
    'looks',
    'chrome',
  ] as const) {
    if (!Array.isArray(m[key]) || m[key].length === 0) {
      fail(`"${key}" is missing or empty`);
    }
  }

  // Referential integrity: every Look points at a real design + voice, and a
  // Look's composition (when present) is a v1 recipe whose skin matches.
  const designSlugs = new Set(m.designs.map((d) => d.slug));
  const voiceSlugs = new Set(m.voices.map((v) => v.slug));
  for (const look of m.looks) {
    if (!designSlugs.has(look.designSlug)) {
      fail(`look "${look.slug}" references unknown design "${look.designSlug}"`);
    }
    if (!voiceSlugs.has(look.voiceSlug)) {
      fail(`look "${look.slug}" references unknown voice "${look.voiceSlug}"`);
    }
    if (look.composition) {
      if (look.composition.schema !== 'cartwright-composition-v1') {
        fail(
          `look "${look.slug}" composition has schema ${JSON.stringify(look.composition.schema)}, expected "cartwright-composition-v1"`,
        );
      }
      if (look.composition.skin !== look.designSlug) {
        fail(
          `look "${look.slug}" composition skin "${look.composition.skin}" does not match its designSlug "${look.designSlug}"`,
        );
      }
    }
  }

  // Chrome entries: valid kind, unique keys, and a real design when locked
  // (designSlug null = neutral engine part, always mixable).
  const chromeKeys = new Set<string>();
  for (const entry of m.chrome) {
    if (!entry.key || (entry.kind !== 'header' && entry.kind !== 'footer')) {
      fail(`chrome entry ${JSON.stringify(entry.key)} has invalid kind ${JSON.stringify(entry.kind)}`);
    }
    if (chromeKeys.has(entry.key)) {
      fail(`duplicate chrome key "${entry.key}"`);
    }
    chromeKeys.add(entry.key);
    if (typeof entry.mixable !== 'boolean') {
      fail(`chrome entry "${entry.key}" has non-boolean "mixable"`);
    }
    if (entry.designSlug !== null && !designSlugs.has(entry.designSlug)) {
      fail(`chrome entry "${entry.key}" references unknown design "${entry.designSlug}"`);
    }
    if (entry.designSlug === null && !entry.mixable) {
      fail(`neutral chrome entry "${entry.key}" must be mixable`);
    }
  }

  // SVG items must carry rendered markup (the whole point of v2).
  for (const item of m.svgItems) {
    if (typeof item.markup !== 'string' || !item.markup.startsWith('<svg')) {
      fail(`svg item "${item.slug}" has no rendered <svg> markup`);
    }
  }

  // Referential integrity: every design motif points at a real SVG item
  // (the Mixer renders the motif via the svgItems markup lookup).
  const svgItemSlugs = new Set(m.svgItems.map((i) => i.slug));
  for (const design of m.designs) {
    if (design.motifSlug && !svgItemSlugs.has(design.motifSlug)) {
      fail(`design "${design.slug}" references unknown svg item "${design.motifSlug}"`);
    }
  }

  // Scene overrides may not drift from the engine registry.
  const sceneSlugs = new Set(m.scenes.map((s) => s.slug));
  for (const slug of Object.keys(SCENE_OVERRIDES)) {
    if (!sceneSlugs.has(slug)) {
      fail(`scene override "${slug}" no longer exists in the manifest`);
    }
  }

  return m;
}

const manifest = loadManifest();

/* ------------------------------------------------------------------ */
/* Derived catalogues                                                  */
/* ------------------------------------------------------------------ */

const DERIVED_DESIGNS: DesignEntry[] = manifest.designs.map(
  ({ slug, name, description, mode, premium, threeD, palette }) => ({
    slug,
    name,
    description,
    mode,
    premium,
    threeD,
    palette,
  }),
);

const DERIVED_MIXER_DESIGNS: MixerDesignEntry[] = manifest.designs.map(
  ({ slug, name, description, mode, premium, threeD, palette, motifSlug, hasOwnChrome }) => ({
    slug,
    name,
    description,
    mode,
    premium,
    threeD,
    palette,
    motifSlug,
    hasOwnChrome,
  }),
);

const DERIVED_VOICES: VoiceEntry[] = manifest.voices.map((v) => ({ ...v }));

const DERIVED_SCENES: SceneEntry[] = manifest.scenes
  .map((scene) => {
    const o = SCENE_OVERRIDES[scene.slug];
    return {
      slug: scene.slug,
      label: o?.label ?? scene.label,
      description: o?.description ?? scene.description,
      vibe: o?.vibe ?? '3D · palette-reactive',
      ...(o?.isNew ? { isNew: true as const } : {}),
    };
  })
  .sort((a, b) => {
    const ai = SCENE_ORDER.indexOf(a.slug);
    const bi = SCENE_ORDER.indexOf(b.slug);
    return (ai === -1 ? SCENE_ORDER.length : ai) - (bi === -1 ? SCENE_ORDER.length : bi);
  });

const DERIVED_SVG_ITEMS: SvgItem[] = manifest.svgItems.map((i) => ({ ...i }));

const DERIVED_ELEMENTS: ElementEntry[] = manifest.elements.map((e) => ({ ...e }));

const DERIVED_LOOKS: LookEntry[] = manifest.looks.map((l) => ({ ...l }));

const DERIVED_CHROME: ChromeEntry[] = manifest.chrome.map((c) => ({ ...c }));

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/** Engine version the vendored manifest was generated from. */
export const MANIFEST_VERSION: string = manifest.version;

export function getDesigns(): DesignEntry[] {
  return DERIVED_DESIGNS;
}

/** Designs incl. motifSlug + hasOwnChrome — what the /mixer studio consumes. */
export function getMixerDesigns(): MixerDesignEntry[] {
  return DERIVED_MIXER_DESIGNS;
}

export function getVoices(): VoiceEntry[] {
  return DERIVED_VOICES;
}

export function getScenes(): SceneEntry[] {
  return DERIVED_SCENES;
}

export function getSvgItems(): SvgItem[] {
  return DERIVED_SVG_ITEMS;
}

export function getElements(): ElementEntry[] {
  return DERIVED_ELEMENTS;
}

export function getLooks(): LookEntry[] {
  return DERIVED_LOOKS;
}

/**
 * The engine's chrome registry (manifest v3): every selectable header/footer
 * part — what /chrome and the Mixer's Header/Footer pickers consume.
 */
export function getChrome(): ChromeEntry[] {
  return DERIVED_CHROME;
}
