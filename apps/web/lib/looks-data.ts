// Cartwright Looks — curated Skin × Voice combinations.
//
// Content and design are orthogonal in Cartwright: a design (Skin) controls how
// the page looks, and a Voice re-tones the copy + palette for an industry. A
// "Look" is a hand-picked pairing of the two — proof that the same engine,
// dressed differently, fits very different businesses. Because the Skins here
// are palette-adaptive, the page wears the VOICE's palette, so each card's
// mini-hero is rendered in the Voice's colours with its real re-toned copy.
//
// Each Look references an existing design slug (see designs-data.ts) and an
// existing voice slug (see verticals-data.ts) — no new assets, just curation.

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
};

export const LOOKS: LookEntry[] = [
  {
    slug: 'canopy',
    name: 'Canopy',
    description:
      "The friendly flagship: jungle's organic, atom-composed layout wearing a kindergarten's warm green Voice.",
    designSlug: 'jungle',
    voiceSlug: 'kindergarten',
  },
  {
    slug: 'slow-mornings',
    name: 'Slow Mornings',
    description:
      "Aurora's airy website, re-toned cozy and artisanal for a neighbourhood café.",
    designSlug: 'aurora-site',
    voiceSlug: 'cafe',
  },
  {
    slug: 'the-workshop',
    name: 'The Workshop',
    description:
      "Studio's warm-tech confidence, dressed as an honest building trade you'd trust with your home.",
    designSlug: 'studio',
    voiceSlug: 'carpenter',
  },
  {
    slug: 'quiet-luxe',
    name: 'Quiet Luxe',
    description:
      'Calm, polished Aurora for a salon or spa — relaxed luxury that makes booking feel like a treat.',
    designSlug: 'aurora-site',
    voiceSlug: 'salon',
  },
  {
    slug: 'the-roastery',
    name: 'The Roastery',
    description:
      "A café that sells its beans: Aurora's clean storefront in a warm, freshly-roasted Voice.",
    designSlug: 'aurora-shop',
    voiceSlug: 'cafe',
  },
  {
    slug: 'atelier',
    name: 'Atelier',
    description:
      'The flagship super-pro storefront (Apex) carrying a champagne-gold spa Voice — a complete luxe shop.',
    designSlug: 'apex',
    voiceSlug: 'salon',
  },
  {
    slug: 'trusted-local',
    name: 'Trusted Local',
    description:
      'The same carpenter Voice on a different Skin — Aurora instead of Studio. One Voice, two looks.',
    designSlug: 'aurora-site',
    voiceSlug: 'carpenter',
  },
  {
    slug: 'garden-cafe',
    name: 'Garden Café',
    description:
      "Jungle's playful structure carrying the café Voice's warm palette — the same Skin as Canopy, a different Voice.",
    designSlug: 'jungle',
    voiceSlug: 'cafe',
  },
];
