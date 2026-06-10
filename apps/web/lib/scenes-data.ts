// Cartwright Live Canvas — 3D scene catalogue (mirrors the engine
// lib/three/scenes/registry.ts). Every scene is PALETTE-REACTIVE: it reads the
// active brand's colours at runtime, so the same scene renders in each shop's
// own palette. Preview assets: public/scenes/<slug>.{webm,mp4,jpg}.

export type SceneEntry = {
  slug: string;
  label: string;
  description: string;
  /** Short vibe tag for the gallery. */
  vibe: string;
  /** True for the 3 scenes added in the v0.x "wild premium" batch. */
  isNew?: boolean;
};

export const SCENES: SceneEntry[] = [
  {
    slug: "butterflies",
    label: "Butterflies",
    description:
      "An instanced flock of palette-tinted butterflies — procedural wings, flap-and-glide flight, scattering from the pointer. The FABLE flagship hero.",
    vibe: "organic · metamorphosis",
    isNew: true,
  },
  {
    slug: "aurora",
    label: "Aurora",
    description:
      "Full-screen GLSL aurora — flowing, mouse-reactive ribbons of light. The flagship premium dark-luxe hero.",
    vibe: "premium · dark-luxe",
  },
  {
    slug: "waves",
    label: "Waves",
    description:
      "A full-bleed plane of flowing noise dunes, palette-graded trough→crest with a fresnel sheen. Calm and organic.",
    vibe: "organic",
    isNew: true,
  },
  {
    slug: "orb",
    label: "Orb",
    description:
      "A glowing, gently-pulsing core sphere wrapped in a halo of orbiting points. Reads as a product / AI core.",
    vibe: "core · AI",
    isNew: true,
  },
  {
    slug: "gridflow",
    label: "Grid-flow",
    description:
      "A glowing perspective grid floor + faint ceiling flowing to a horizon. Retro-future synthwave energy.",
    vibe: "retro-future",
    isNew: true,
  },
  {
    slug: "blob",
    label: "Morphing blob",
    description:
      "An organic gradient form that undulates with layered noise. Trendy, friendly modern-SaaS look.",
    vibe: "organic · SaaS",
  },
  {
    slug: "particles",
    label: "Particle field",
    description:
      "A field of floating dots that drift and react to the cursor. Technical, data / AI atmosphere.",
    vibe: "tech · data",
  },
  {
    slug: "wireframe",
    label: "Low-poly / wireframe",
    description:
      "A geometric wireframe in perspective. Structured, engineered, blueprint-like.",
    vibe: "structured · tech",
  },
  {
    slug: "floating-geometry",
    label: "Floating geometry",
    description:
      "Glassy, slowly-rotating shapes. Elegant and brand-neutral — safe on any site.",
    vibe: "elegant",
  },
];
