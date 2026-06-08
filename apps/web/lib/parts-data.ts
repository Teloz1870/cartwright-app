// Cartwright Parts — the section catalogue (mirrors the engine
// lib/builder/section-registry.tsx). A "Part" is a swappable, prop-driven page
// section you compose in the Visual Builder. Every Part is a cw-* atom, so it
// adopts the active design / Voice palette — drop the same Part onto any
// palette-adaptive skin and it wears that skin's colours.
//
// Keep keys 1:1 with the engine registry. `vibe` (the raw-HTML / AI bridge
// section) is intentionally omitted — it isn't a hand-designed premium Part.

export type PartCategory = 'Heroes' | 'Content' | 'Social proof' | 'Conversion';

export type PartShape =
  | 'hero'
  | 'hero3d'
  | 'split'
  | 'media'
  | 'grid'
  | 'bento'
  | 'marquee'
  | 'band'
  | 'steps'
  | 'quote'
  | 'list'
  | 'logos'
  | 'gallery'
  | 'cta'
  | 'text'
  | 'configurator'
  | 'cinema'
  | 'showroom';

export type PartEntry = {
  /** section-registry key (engine). */
  key: string;
  label: string;
  description: string;
  category: PartCategory;
  /** drives the CSS schematic preview in the gallery. */
  shape: PartShape;
  /** true for the premium parts added in the "wild premium" batch. */
  isNew?: boolean;
  /** true when the part embeds a palette-reactive 3D scene (Live Canvas). */
  is3d?: boolean;
  /** Cartwright Pro Part — a premium breakthrough element (configurator, scroll-cinema, 3D showroom). */
  pro?: boolean;
};

export const PART_CATEGORIES: PartCategory[] = [
  'Heroes',
  'Content',
  'Social proof',
  'Conversion',
];

export const PARTS: PartEntry[] = [
  // ───── Heroes
  {
    key: 'hero',
    label: 'Hero',
    description:
      'The classic centred hero — eyebrow, headline with an accent span, tagline, and primary + secondary CTAs.',
    category: 'Heroes',
    shape: 'hero',
  },
  {
    key: 'heroAurora',
    label: '3D hero (Live Canvas)',
    description:
      'A hero with a palette-reactive three.js scene flowing behind it. Pick any of the Live Canvas scenes; it adopts your brand colours and is WebGL2 / reduced-motion / saveData-gated out of the box.',
    category: 'Heroes',
    shape: 'hero3d',
    isNew: true,
    is3d: true,
  },
  {
    key: 'splitHero',
    label: 'Split hero',
    description: 'Two-column hero — copy and CTA on one side, an image on the other. Reversible.',
    category: 'Heroes',
    shape: 'split',
  },
  {
    key: 'mediaHero',
    label: 'Media hero',
    description: 'Full-bleed background image with overlaid headline, tagline and CTA. Cinematic.',
    category: 'Heroes',
    shape: 'media',
  },

  // ───── Content
  {
    key: 'bento',
    label: 'Bento grid',
    description:
      'A premium asymmetric tile grid — a featured 2×2 tile anchors the layout, supporting tiles fall into place. The accent follows your palette.',
    category: 'Content',
    shape: 'bento',
    isNew: true,
  },
  {
    key: 'featureGrid',
    label: 'Feature grid',
    description: 'A responsive 3-column grid of features with an etched hairline-grid look. Scales to 6–30.',
    category: 'Content',
    shape: 'grid',
  },
  {
    key: 'featureSplit',
    label: 'Feature split',
    description: 'Text + checklist on one side, an image on the other. For explaining one capability in depth.',
    category: 'Content',
    shape: 'split',
  },
  {
    key: 'valueProps',
    label: 'Value props',
    description: 'Icon-led value cards — the "why us" grid. Re-tones with your Voice (genome) copy.',
    category: 'Content',
    shape: 'grid',
  },
  {
    key: 'howItWorks',
    label: 'How it works',
    description: 'Numbered steps that walk a visitor from intent to outcome. 2–5 steps.',
    category: 'Content',
    shape: 'steps',
  },
  {
    key: 'statBand',
    label: 'Stat band',
    description: 'A band of 1–4 big numbers over small labels. Proof at a glance.',
    category: 'Content',
    shape: 'band',
  },
  {
    key: 'stackGrid',
    label: 'Stack grid',
    description: 'A tidy grid of short labels — materials, tooling, what you work with.',
    category: 'Content',
    shape: 'list',
  },
  {
    key: 'galleryGrid',
    label: 'Gallery grid',
    description: 'An image grid with optional captions. For lookbooks, work, and product shots.',
    category: 'Content',
    shape: 'gallery',
  },
  {
    key: 'richText',
    label: 'Rich text',
    description: 'A clean prose block for long-form copy, policies, or an about section.',
    category: 'Content',
    shape: 'text',
  },

  // ───── Social proof
  {
    key: 'marquee',
    label: 'Marquee',
    description:
      'A CSS-only infinite scroller for short phrases or "logos as text". Reduced-motion-aware and pauses on hover.',
    category: 'Social proof',
    shape: 'marquee',
    isNew: true,
  },
  {
    key: 'testimonials',
    label: 'Testimonials',
    description: 'Customer quotes with author + role. Pairs with Review JSON-LD on the storefront.',
    category: 'Social proof',
    shape: 'grid',
  },
  {
    key: 'quote',
    label: 'Pull quote',
    description: 'A single oversized quote with attribution. A moment of focus between sections.',
    category: 'Social proof',
    shape: 'quote',
  },
  {
    key: 'logoCloud',
    label: 'Logo cloud',
    description: 'A row of partner / press / customer logos. Quiet, credible social proof.',
    category: 'Social proof',
    shape: 'logos',
  },

  // ───── Conversion
  {
    key: 'pricingTable',
    label: 'Pricing table',
    description: 'Side-by-side plans with features and a highlighted recommended tier.',
    category: 'Conversion',
    shape: 'grid',
  },
  {
    key: 'faq',
    label: 'FAQ',
    description: 'An accordion of questions and answers. Ships FAQPage JSON-LD on the storefront.',
    category: 'Conversion',
    shape: 'list',
  },
  {
    key: 'bannerCta',
    label: 'Banner CTA',
    description: 'A bold full-width call-to-action band on your accent colour.',
    category: 'Conversion',
    shape: 'cta',
  },
  {
    key: 'newsletterBlock',
    label: 'Newsletter',
    description: 'An email-capture block with a single field and a clear promise.',
    category: 'Conversion',
    shape: 'cta',
  },
  {
    key: 'ctaFooter',
    label: 'CTA footer',
    description: 'The closing call-to-action that ends a page — headline, line, and a primary button.',
    category: 'Conversion',
    shape: 'cta',
  },

  // ───── Pro — breakthrough interactive elements (cartwrightPlus / $5 each)
  {
    key: 'configurator',
    label: 'Configurator (build-your-own)',
    description:
      'An interactive "build your own" product configurator: pick a finish / size / extras and the preview recolours + the price updates live. The killer commerce primitive — a $100k-feeling configurator on any page.',
    category: 'Conversion',
    shape: 'configurator',
    isNew: true,
    pro: true,
  },
  {
    key: 'scrollStory',
    label: 'Scroll-cinema',
    description:
      'Scroll-driven cinematic storytelling: full-viewport "beats" whose copy fades and glides in as you scroll, Apple-product-page style — native CSS scroll-driven animation, no JavaScript, with a content-visible fallback.',
    category: 'Content',
    shape: 'cinema',
    isNew: true,
    pro: true,
  },
  {
    key: 'showroom3d',
    label: '3D product showroom',
    description:
      'A premium product showroom on the Live Canvas: a palette-reactive 3D centrepiece framed with the product name, spec rail and CTA — the "see it in 3D" moment. WebGL2 / reduced-motion gated, three.js lazy-loaded.',
    category: 'Content',
    shape: 'showroom',
    isNew: true,
    is3d: true,
    pro: true,
  },
];

export const NEW_PARTS_COUNT = PARTS.filter((p) => p.isNew).length;
export const PRO_PARTS_COUNT = PARTS.filter((p) => p.pro).length;
