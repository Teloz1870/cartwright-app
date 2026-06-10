// Synced copy of engine components/svg-items — keep in sync.
/**
 * SVG item library — premium, hand-authored, palette-adaptive inline SVG
 * components (marks, dividers, illustrations).
 *
 * Every component is a pure server component (no client JS), fully
 * self-contained (zero imports), reads all colour from the cw-* palette
 * tokens with the engine fallback chain, and accepts a single optional
 * `className`. `SVG_ITEMS` is the client-safe manifest of what ships —
 * the registry export and any gallery UI read it.
 */

export { OrbitMark } from "./OrbitMark";
export { PrismMark } from "./PrismMark";
export { ConstellationMark } from "./ConstellationMark";
export { CometMark } from "./CometMark";
export { SunburstMark } from "./SunburstMark";
export { LatticeMark } from "./LatticeMark";
export { WaveDivider } from "./WaveDivider";
export { VineDivider } from "./VineDivider";
export { BloomIllustration } from "./BloomIllustration";
export { MountainIllustration } from "./MountainIllustration";
export { CrystalIllustration } from "./CrystalIllustration";
export { MothIllustration } from "./MothIllustration";

export type SvgItemKind = "mark" | "divider" | "illustration";

export type SvgItem = {
  /** Stable kebab-case id; the registry serves each item as `svg-<slug>`. */
  slug: string;
  /** Display name (matches the exported component name in PascalCase). */
  name: string;
  kind: SvgItemKind;
  description: string;
};

/** Client-safe manifest of the library (data only — no component refs). */
export const SVG_ITEMS: SvgItem[] = [
  {
    slug: "orbit-mark",
    name: "Orbit Mark",
    kind: "mark",
    description:
      "A ringed planet held by two elliptical orbits with moons riding the near arcs.",
  },
  {
    slug: "prism-mark",
    name: "Prism Mark",
    kind: "mark",
    description:
      "A glass prism refracting one beam into a tonal spectrum fan that fades to the right.",
  },
  {
    slug: "constellation-mark",
    name: "Constellation Mark",
    kind: "mark",
    description:
      "A star-chart asterism of connected stars at varied magnitudes inside a graduated ring.",
  },
  {
    slug: "comet-mark",
    name: "Comet Mark",
    kind: "mark",
    description:
      "A comet head with a layered, particle-strewn tail arcing toward the corner.",
  },
  {
    slug: "sunburst-mark",
    name: "Sunburst Mark",
    kind: "mark",
    description:
      "A radiant sun with sixteen alternating long and short rays around a gradient disc.",
  },
  {
    slug: "lattice-mark",
    name: "Lattice Mark",
    kind: "mark",
    description:
      "Two squares and a circle interlaced in a true over-under weave around a fine inner lattice.",
  },
  {
    slug: "wave-divider",
    name: "Wave Divider",
    kind: "divider",
    description:
      "A horizontal rule of four layered wave strands that fade out at both ends, with foam beads on the crests.",
  },
  {
    slug: "vine-divider",
    name: "Vine Divider",
    kind: "divider",
    description:
      "A branching vine rule with alternating leaves, buds, curling tendrils and a small open bloom at the centre.",
  },
  {
    slug: "bloom-illustration",
    name: "Bloom Illustration",
    kind: "illustration",
    description:
      "An opening flower with three layered petal rings, a stamen crown, stem and leaves, and one petal mid-fall.",
  },
  {
    slug: "mountain-illustration",
    name: "Mountain Illustration",
    kind: "illustration",
    description:
      "Receding ridgelines with real atmospheric depth under a warm sun, mist in the valley, pines on the foothill.",
  },
  {
    slug: "crystal-illustration",
    name: "Crystal Illustration",
    kind: "illustration",
    description:
      "A faceted crystal cluster growing from rock, lit facets against shaded ones around an inner glow.",
  },
  {
    slug: "moth-illustration",
    name: "Moth Illustration",
    kind: "illustration",
    description:
      "A night-moth with banded dusty wings, eyespots and feathered antennae, resting under a crescent moon.",
  },
];
