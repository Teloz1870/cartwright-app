// AUTO-GENERATED from the Cartwright engine design registry (designs/options.ts +
// each pack tokens). Regenerate when designs change. Do not hand-edit entries.

export type DesignEntry = {
  slug: string;
  name: string;
  description: string;
  mode: "website" | "webshop" | "both";
  premium: boolean;
  threeD: boolean;
  palette: { accent: string; accentDeep: string; cream: string; sand: string; ink: string; muted: string } | null;
};

export const DESIGNS: DesignEntry[] = [
  {
    "slug": "aurora-site",
    "name": "Aurora — Website (Cartwright default)",
    "description": "The flagship Cartwright website default. Light, airy, modern — built on the shared section atoms (same as the Magic Builder) and adopts your brand palette automatically.",
    "mode": "website",
    "premium": false,
    "palette": {
      "accent": "#5b54f0",
      "accentDeep": "#4138c7",
      "cream": "#fdfcfb",
      "sand": "#f3f1ee",
      "ink": "#18171f",
      "muted": "#6c6a78"
    },
    "threeD": true
  },
  {
    "slug": "aurora-shop",
    "name": "Aurora — Webshop (Cartwright default)",
    "description": "The flagship Cartwright webshop default. Clean modern storefront — looping hero, featured products, trust row, category grid — adopts your brand palette automatically.",
    "mode": "webshop",
    "premium": false,
    "palette": {
      "accent": "#5b54f0",
      "accentDeep": "#4138c7",
      "cream": "#fdfcfb",
      "sand": "#f3f1ee",
      "ink": "#18171f",
      "muted": "#6c6a78"
    },
    "threeD": false
  },
  {
    "slug": "saas-dark",
    "name": "SaaS Dark (futurist / cyber)",
    "description": "Dark bg with indigo accents, animated grid + glow, terminal code-snippet hero.",
    "mode": "website",
    "premium": false,
    "palette": {
      "accent": "#818cf8",
      "accentDeep": "#4f46e5",
      "cream": "#000000",
      "sand": "#0a0a0a",
      "ink": "#ffffff",
      "muted": "rgba(255,255,255,0.6)"
    },
    "threeD": true
  },
  {
    "slug": "studio",
    "name": "Studio (tech / agency)",
    "description": "Premium warm-tech design — terracotta + oker palette, Geist typography, CSS-only animations.",
    "mode": "website",
    "premium": true,
    "palette": {
      "accent": "#d97757",
      "accentDeep": "#c4623e",
      "cream": "#fafaf9",
      "sand": "#f5f5f4",
      "ink": "#0a0a0b",
      "muted": "#737373"
    },
    "threeD": false
  },
  {
    "slug": "corporate-baseline",
    "name": "Corporate Baseline (generic website)",
    "description": "Neutral cinematic-hero + 3-card service-grid for marketing sites.",
    "mode": "website",
    "premium": false,
    "palette": {
      "accent": "#1e3f5a",
      "accentDeep": "#0f2438",
      "cream": "#f4efe6",
      "sand": "#e8e1d3",
      "ink": "#1a1a1a",
      "muted": "#726d62"
    },
    "threeD": false
  },
  {
    "slug": "webshop-classic",
    "name": "Webshop Classic (default e-commerce)",
    "description": "HeroVideo + featured-product grid + lifestyle pitch + 5-col category grid.",
    "mode": "webshop",
    "premium": false,
    "palette": {
      "accent": "#1e3f5a",
      "accentDeep": "#0f2438",
      "cream": "#f4efe6",
      "sand": "#e8e1d3",
      "ink": "#1a1a1a",
      "muted": "#726d62"
    },
    "threeD": false
  },
  {
    "slug": "webshop-minimal",
    "name": "Webshop Minimal (Apple-like)",
    "description": "Full-bleed hero image + oversized typography + 2-col featured grid. Premium DTC-look — fewer, bigger products.",
    "mode": "webshop",
    "premium": false,
    "palette": {
      "accent": "#1e3f5a",
      "accentDeep": "#0f2438",
      "cream": "#ffffff",
      "sand": "#f5f5f4",
      "ink": "#0a0a0b",
      "muted": "#737373"
    },
    "threeD": false
  },
  {
    "slug": "webshop-editorial",
    "name": "Webshop Editorial (magazine)",
    "description": "Split-screen story-driven hero, alternating editorial product cards, typographic billboard categories. For story-led shops.",
    "mode": "webshop",
    "premium": true,
    "palette": {
      "accent": "#1e3f5a",
      "accentDeep": "#0f2438",
      "cream": "#f4efe6",
      "sand": "#e8e1d3",
      "ink": "#1a1a1a",
      "muted": "#726d62"
    },
    "threeD": false
  },
  {
    "slug": "webshop-bold",
    "name": "Webshop Bold (neo-brutalism)",
    "description": "High-contrast color-blocks + thick black borders + zero shadows. Inspired by DTC-modern and the brutalism web trend.",
    "mode": "webshop",
    "premium": true,
    "palette": {
      "accent": "#d97757",
      "accentDeep": "#c4623e",
      "cream": "#fef3c7",
      "sand": "#ffffff",
      "ink": "#0a0a0b",
      "muted": "#525252"
    },
    "threeD": false
  },
  {
    "slug": "northern-coffee",
    "name": "Northern Coffee (Cartwright Studio)",
    "description": "Story-first webshop for coffee roasters and specialty food shops. Warm Scandinavian minimalism with split-screen narrative hero, oversized today's-roast feature.",
    "mode": "webshop",
    "premium": true,
    "palette": {
      "accent": "#c2410c",
      "accentDeep": "#9a3412",
      "cream": "#fdfaf4",
      "sand": "#ede5d3",
      "ink": "#2c1810",
      "muted": "#8a7560"
    },
    "threeD": true
  },
  {
    "slug": "atelier",
    "name": "Atelier (Cartwright Studio)",
    "description": "Museum-minimal luxury layout for fashion, jewelry, and leather goods. Monochrome with gold accent, ALL-CAPS sparse typography, full-bleed product photography.",
    "mode": "webshop",
    "premium": true,
    "palette": {
      "accent": "#9b7837",
      "accentDeep": "#7a5a2d",
      "cream": "#f6f3ee",
      "sand": "#ebe6dd",
      "ink": "#0a0a0a",
      "muted": "#6b6b6b"
    },
    "threeD": false
  },
  {
    "slug": "stack",
    "name": "Stack (Cartwright Studio)",
    "description": "Dark-mode-first developer-tools landing page. Terminal hero with typed command + animated output, code-block feature cards, monospace everywhere. For dev SaaS, AI APIs.",
    "mode": "website",
    "premium": true,
    "palette": {
      "accent": "#00d97e",
      "accentDeep": "#00b368",
      "cream": "#050505",
      "sand": "#0e0e10",
      "ink": "#fafafa",
      "muted": "#888888"
    },
    "threeD": false
  },
  {
    "slug": "hoptify",
    "name": "Hoptify (Shopify-pendant, parodi)",
    "description": "Et velkendt, rent webshop-look à la de store — men på Cartwright-motoren, med en frisk Hoptify-grøn og et glimt i øjet (“Hop off Shopify”). Inkl. parodi-import-onboarding i /admin/hoptify.",
    "mode": "webshop",
    "premium": false,
    "palette": {
      "accent": "#2f9e54",
      "accentDeep": "#1f7a40",
      "cream": "#f6faf6",
      "sand": "#e7f1e8",
      "ink": "#16241b",
      "muted": "#5c6b60"
    },
    "threeD": false
  },
  {
    "slug": "engineered",
    "name": "Engineered (dark-luxe agency)",
    "description": "Premium dark-luxe agency design — navy + cream + mint-teal accent, three.js GLSL aurora hero, editorial type, glassmorphism, bento. Locked theme (no OS dark-mode flip). Built in real code.",
    "mode": "website",
    "premium": true,
    "palette": {
      "accent": "#5fe6c4",
      "accentDeep": "#1e3f5a",
      "cream": "#f4efe6",
      "sand": "#0d141a",
      "ink": "#090d11",
      "muted": "#737d86"
    },
    "threeD": true
  },
  {
    "slug": "editorial-ink",
    "name": "Editorial Ink (magazine / publication)",
    "description": "Premium light editorial design — warm paper, deep ink, one restrained oxblood accent. Fraunces serif + Hanken Grotesk, drop-cap lede, big pull-quote, hairline rules. Locked light theme, no 3D.",
    "mode": "website",
    "premium": true,
    "palette": {
      "accent": "#7c2230",
      "accentDeep": "#511620",
      "cream": "#f6f1e7",
      "sand": "#c9bca2",
      "ink": "#1c1916",
      "muted": "#6b6356"
    },
    "threeD": false
  },
  {
    "slug": "brutalist",
    "name": "Brutalist (raw / mono)",
    "description": "Premium neo-brutalist design — paper-white, hard black ink + thick borders, one acid-lime accent. Mono labels + bold grotesque, hard shadows, visible grid, marquee. Locked light theme, CSS-only.",
    "mode": "website",
    "premium": true,
    "palette": {
      "accent": "#c8ff00",
      "accentDeep": "#9bcb00",
      "cream": "#f5f3ec",
      "sand": "#fffdf6",
      "ink": "#0a0a0a",
      "muted": "#5a5a52"
    },
    "threeD": false
  },
  {
    "slug": "nocturne",
    "name": "Nocturne (dark organic, 3D)",
    "description": "Premium dark-organic luxe design — midnight aubergine + champagne gold + cream. Palette-driven 3D aurora hero, italic Fraunces display, organic shapes, soft glows, bento. Locked dark theme.",
    "mode": "website",
    "premium": true,
    "palette": {
      "accent": "#e9c789",
      "accentDeep": "#c79a52",
      "cream": "#f3ebe1",
      "sand": "#1e1525",
      "ink": "#160f1c",
      "muted": "#9a8aa0"
    },
    "threeD": true
  },
  {
    "slug": "meridian",
    "name": "Meridian (crisp modern SaaS)",
    "description": "Premium crisp-modern light SaaS design — cool neutrals + one electric-blue accent, CSS gradient-mesh hero, sharp bordered cards, mono labels, kbd-hint chips. Locked light theme, no 3D.",
    "mode": "website",
    "premium": true,
    "palette": {
      "accent": "#2563ff",
      "accentDeep": "#143a9c",
      "cream": "#f7f9fc",
      "sand": "#e6ebf3",
      "ink": "#0c1322",
      "muted": "#5b6577"
    },
    "threeD": true
  }
];
