// Cartwright Voices — vertical preset catalogue (mirrors the engine verticals/
// registry). A "Voice" re-tones a site for an industry: identity (tone /
// audience / formality / vibe) + genome copy overrides + a fitting palette + a
// palette-reactive 3D scene + a suggested skin. Apply a Voice and the whole
// page adopts it — copy, colours, and 3D — without touching the design.
//
// Keep slugs 1:1 with the engine verticals/<slug>/preset.ts.

export type VoicePalette = {
  accent: string;
  accentDeep: string;
  cream: string;
  sand: string;
  ink: string;
  muted: string;
};

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

export const VOICES: VoiceEntry[] = [
  {
    slug: 'kindergarten',
    name: 'Kindergarten / Børnehave',
    description:
      'Warm, playful, reassuring voice for a kindergarten or daycare — built to make parents feel their child will be safe, happy, and growing.',
    keywords: ['kindergarten', 'børnehave', 'daycare', 'childcare', 'preschool', 'kids'],
    tone: 'warm',
    audience: 'consumer',
    formality: 'casual',
    vibe: 'playful, safe, nurturing',
    suggestedDesign: 'jungle',
    scene: 'waves',
    palette: {
      accent: '#16a34a',
      accentDeep: '#15803d',
      cream: '#f6fef0',
      sand: '#dcfce7',
      ink: '#13251a',
      muted: '#6f8e7c',
    },
    sampleEyebrow: 'Now enrolling',
    sampleHeadline: 'A warm place to play, learn, and grow',
  },
  {
    slug: 'carpenter',
    name: 'Carpenter / Tømrer',
    description:
      "Solid, honest, no-nonsense voice for a carpenter or building trade — built to earn a homeowner's trust and win the quote.",
    keywords: ['carpenter', 'tømrer', 'builder', 'joinery', 'trades', 'construction'],
    tone: 'professional',
    audience: 'consumer',
    formality: 'balanced',
    vibe: 'solid, honest, handcrafted',
    suggestedDesign: 'aurora-site',
    scene: 'wireframe',
    palette: {
      accent: '#b45309',
      accentDeep: '#78350f',
      cream: '#fdf6ec',
      sand: '#efe1cf',
      ink: '#241810',
      muted: '#8a6f57',
    },
    sampleEyebrow: 'Local & trusted',
    sampleHeadline: 'Craftsmanship you can stand on',
  },
  {
    slug: 'cafe',
    name: 'Café / Coffee shop',
    description:
      'Cozy, slow, artisanal voice for a neighbourhood café or coffee shop — warm and inviting, all about staying a while.',
    keywords: ['cafe', 'café', 'coffee', 'espresso', 'bakery', 'brunch'],
    tone: 'warm',
    audience: 'consumer',
    formality: 'casual',
    vibe: 'cozy, slow, artisanal',
    suggestedDesign: 'aurora-site',
    scene: 'aurora',
    palette: {
      accent: '#c2410c',
      accentDeep: '#7c2d12',
      cream: '#fdf6ee',
      sand: '#ece0d0',
      ink: '#2a1c14',
      muted: '#8a7561',
    },
    sampleEyebrow: 'Freshly roasted',
    sampleHeadline: 'Your neighbourhood for slow mornings',
  },
  {
    slug: 'salon',
    name: 'Salon / Spa',
    description:
      'Calm, polished, indulgent voice for a hair salon, beauty, or spa business — relaxed luxury that makes booking feel like a treat.',
    keywords: ['salon', 'spa', 'hair', 'beauty', 'wellness', 'barber'],
    tone: 'luxurious',
    audience: 'consumer',
    formality: 'balanced',
    vibe: 'calm, polished, indulgent',
    suggestedDesign: 'aurora-site',
    scene: 'orb',
    palette: {
      accent: '#c9a36a',
      accentDeep: '#9a7b46',
      cream: '#faf7f2',
      sand: '#ece5db',
      ink: '#1b1a1c',
      muted: '#8a8079',
    },
    sampleEyebrow: 'By appointment',
    sampleHeadline: 'Look good, feel even better',
  },
  {
    slug: 'fable',
    name: 'Fable (model launch)',
    description:
      'The Fable 5 launch story as a voice — metamorphic, luminous, precise.',
    keywords: ['ai', 'launch', 'model', 'metamorphosis', 'butterfly', 'announcement'],
    tone: 'technical',
    audience: 'general',
    formality: 'balanced',
    vibe: 'metamorphic, luminous, precise',
    suggestedDesign: 'fable',
    scene: 'butterflies',
    palette: {
      accent: '#4e4af2',
      accentDeep: '#2f2bb8',
      cream: '#faf7f0',
      sand: '#f0ebdf',
      ink: '#23201c',
      muted: '#7d776c',
    },
    sampleEyebrow: 'Introducing',
    sampleHeadline: 'Meet Fable 5',
  },
];
