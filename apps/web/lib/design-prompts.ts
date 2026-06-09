// Per-design "build prompts" + a categorized prompt library for the marketplace.
// Hand-authored (vs the generated designs-data.ts). Each DESIGN_PROMPTS entry is a
// paste-to-your-IDE-agent instruction that recreates that design as a Cartwright
// DesignPack (the agent reads the cartwright-premium-design skill). The
// PROMPT_LIBRARY is the browsable, copy-paste "Magic prompt" catalogue.

/** slug → the build prompt that recreates that design pack. */
export const DESIGN_PROMPTS: Record<string, string> = {
  engineered:
    "Build me a Cartwright design pack 'engineered': a dark-luxe AI-agency homepage — deep navy-black canvas, warm cream text, one mint-teal accent. A real three.js GLSL aurora hero behind the headline (use <DesignHero/>), editorial Bricolage Grotesque display + Hanken Grotesk body + JetBrains Mono labels, glassmorphism nav, a bento services grid with :has() hover, a numbered process, a pull-quote, and a gradient-mesh CTA. Locked dark theme (no dark: variants). English copy.",
  "editorial-ink":
    "Build me a Cartwright design pack 'editorial-ink': a light editorial / magazine site — warm paper canvas, deep ink text, one restrained oxblood accent. Characterful Fraunces serif display + Hanken Grotesk body + Space Mono eyebrows, hairline rules, a drop-cap lede, a big pull-quote, asymmetric columns. No 3D, tasteful CSS-only motion. Locked light theme. English copy.",
  brutalist:
    "Build me a Cartwright design pack 'brutalist': neo-brutalist — paper-white canvas, hard black ink + thick black borders, one acid-lime accent. Monospace labels (Space Mono) + bold Archivo/Space Grotesk headlines, hard no-blur drop-shadows, a visible grid, offset slabs, a marquee. Loud but usable. No 3D. Locked light theme. English copy.",
  nocturne:
    "Build me a Cartwright design pack 'nocturne': dark-organic luxe — midnight aubergine canvas, warm champagne-gold accent, soft cream text, rounded organic shapes and soft glows. A palette-driven three.js aurora hero (<DesignHero/>) with a CSS gradient fallback, italic Fraunces display + Manrope body, a bento layout. Locked dark theme. English copy — think a high-end fragrance/architecture house.",
  meridian:
    "Build me a Cartwright design pack 'meridian': a crisp modern light SaaS site — cool near-white + slate neutrals, one confident electric-blue accent. An animated CSS gradient-mesh hero + fine dot grid, glassmorphism sticky nav, sharp bordered cards with soft shadows, a precise grid, mono labels, ⌘K keyboard-hint chips, a deploy-terminal card. Sora display + Plus Jakarta Sans body. No 3D. Locked light theme. English copy.",
  "aurora-site":
    "Build me a Cartwright website design 'aurora-site' feel: the flagship light, airy, modern look that adopts the brand palette automatically — soft aurora gradient accents, generous spacing, clean section atoms (hero, value-props, feature-grid, CTA). Palette-adaptive, friendly, broadly appealing. English copy.",
  "aurora-shop":
    "Build me a Cartwright webshop design 'aurora-shop' feel: a clean modern storefront — looping hero, featured products, a trust row, a category grid — palette-adaptive so it renders in the shop's own brand colours. Conversion-focused, airy. English copy.",
  "saas-dark":
    "Build me a Cartwright design pack like 'saas-dark': a futurist/cyber dark site — near-black background, indigo accents, an animated grid + glow, a terminal code-snippet hero. Crisp, technical, for dev-SaaS / AI APIs. English copy.",
  studio:
    "Build me a Cartwright design pack like 'studio': premium warm-tech agency — terracotta + oker palette, paper cream, Geist typography, CSS-only animations. Confident, marketing-led, the cartwright.app aesthetic. English copy.",
  "corporate-baseline":
    "Build me a Cartwright design pack like 'corporate-baseline': a neutral, trustworthy corporate marketing site — cinematic hero + a 3-card service grid, restrained palette, clear hierarchy. Safe and professional. English copy.",
  "webshop-classic":
    "Build me a Cartwright webshop design like 'webshop-classic': a HeroVideo + featured-product grid + lifestyle pitch + a 5-column category grid. The dependable default e-commerce storefront. English copy.",
  "webshop-minimal":
    "Build me a Cartwright webshop design like 'webshop-minimal': Apple-like — a full-bleed hero image, oversized typography, a 2-column featured grid. Premium DTC: fewer, bigger products. English copy.",
  "webshop-editorial":
    "Build me a Cartwright webshop design like 'webshop-editorial': a split-screen story-driven hero, alternating editorial product cards, typographic billboard categories. For story-led shops. English copy.",
  "webshop-bold":
    "Build me a Cartwright webshop design like 'webshop-bold': high-contrast colour-blocks + thick black borders + zero shadows. DTC-modern, brutalism-tinged commerce. English copy.",
  "northern-coffee":
    "Build me a Cartwright webshop design like 'northern-coffee': warm Scandinavian minimalism for coffee/specialty-food shops — split-screen narrative hero, an oversized 'today's roast' feature, story-first. Optional subtle 3D. English copy.",
  atelier:
    "Build me a Cartwright webshop design like 'atelier': museum-minimal luxury for fashion/jewellery/leather — monochrome with a gold accent, ALL-CAPS sparse typography, full-bleed product photography. English copy.",
  stack:
    "Build me a Cartwright design pack like 'stack': a dark-mode-first developer-tools landing page — a terminal hero with a typed command + animated output, code-block feature cards, monospace everywhere. For dev SaaS / AI APIs. English copy.",
  hoptify:
    "Build me a Cartwright webshop design like 'hoptify': a clean, familiar big-box-webshop look — but with a fresh signature green and a wink. Friendly, conversion-first, broadly familiar. English copy.",
  apex:
    "Build me a Cartwright flagship super-pro webshop design 'apex': a single palette-adaptive homepage (cw-* atoms + applyPaletteAsTheme, default luxe violet) that composes everything — a 3D Live-Canvas aurora hero, a rotatable 3D product showroom with a spec rail, value props, a build-your-own configurator with a live preview + live price (:has(:checked), no JS), the real featured-product grid, a scroll-cinema story (animation-timeline: view()), and a closing CTA. Every section AND every Pro element re-skins to the brand palette. Webshop mode, premium, mixable. English copy.",
  aerospace:
    "Build me a Cartwright design pack 'aerospace': a cinematic aerospace / mission-control website — near-black space canvas, one ice-blue accent, a dry technical voice. A pure-CSS starfield hero, condensed uppercase headlines, monospace telemetry chips, a vehicle/systems 'fleet' grid, and a countdown mission-sequence timeline. Locked dark theme, no 3D. English copy.",
  halo:
    "Build me a Cartwright webshop design pack 'halo': ultra-minimal product luxury — a light-grey canvas, oversized tight-tracked headlines, a signature alternating full-bleed light / near-black panel rhythm, a pure-CSS hero 'device' with a metallic sheen, one restrained product-blue accent, and a tidy spec grid. Locked light theme, no 3D. English copy — think a flagship consumer-hardware store.",
  flux:
    "Build me a Cartwright design pack 'flux': a developer-first payments/infra SaaS site — white canvas, deep-navy text, one vivid indigo accent. A bold animated multi-hue gradient mesh with an angled clip, crisp white hairline cards, syntax-tinted monospace code cards, and a gradient stat band. Locked light theme, no 3D. English copy — Stripe-adjacent confidence.",
  drive:
    "Build me a Cartwright design pack 'drive': a full-bleed automotive / silent-luxury website — a vertical stack of full-viewport panels, each a beautiful atmospheric CSS backdrop with a centered top headline and bottom-anchored pill CTAs. Ultra-minimal, almost no body copy. Locked theme, no 3D. English copy.",
  jungle:
    "Build me a Cartwright website design 'jungle': friendly and organic, atom-composed and palette-adaptive, trimmed to the human sections (hero, value-props, features, CTA). A lush green palette + the palette-reactive 'waves' Live-Canvas scene make it read like a canopy. Warm and approachable — for kindergartens, cafés, wellness and consumer brands. English copy.",
};

export type PromptCategory =
  | "Dark & luxe"
  | "Editorial"
  | "Brutalist"
  | "Modern SaaS / dev"
  | "3D hero"
  | "E-commerce";

export type LibraryPrompt = {
  title: string;
  category: PromptCategory;
  prompt: string;
  /** Links to a design in the gallery, when this prompt builds one. */
  designSlug?: string;
};

/** The browsable, copy-paste prompt catalogue (à la a Figma-Community prompt gallery). */
export const PROMPT_LIBRARY: LibraryPrompt[] = [
  { title: "Dark-luxe agency (three.js hero)", category: "Dark & luxe", prompt: DESIGN_PROMPTS.engineered, designSlug: "engineered" },
  { title: "Dark organic luxe (fragrance house)", category: "Dark & luxe", prompt: DESIGN_PROMPTS.nocturne, designSlug: "nocturne" },
  { title: "Futurist cyber SaaS", category: "Dark & luxe", prompt: DESIGN_PROMPTS["saas-dark"], designSlug: "saas-dark" },
  { title: "Editorial / magazine", category: "Editorial", prompt: DESIGN_PROMPTS["editorial-ink"], designSlug: "editorial-ink" },
  { title: "Story-led editorial shop", category: "Editorial", prompt: DESIGN_PROMPTS["webshop-editorial"], designSlug: "webshop-editorial" },
  { title: "Neo-brutalist (acid-lime)", category: "Brutalist", prompt: DESIGN_PROMPTS.brutalist, designSlug: "brutalist" },
  { title: "Bold colour-block commerce", category: "Brutalist", prompt: DESIGN_PROMPTS["webshop-bold"], designSlug: "webshop-bold" },
  { title: "Crisp modern SaaS", category: "Modern SaaS / dev", prompt: DESIGN_PROMPTS.meridian, designSlug: "meridian" },
  { title: "Developer-tools terminal", category: "Modern SaaS / dev", prompt: DESIGN_PROMPTS.stack, designSlug: "stack" },
  { title: "Warm-tech agency", category: "Modern SaaS / dev", prompt: DESIGN_PROMPTS.studio, designSlug: "studio" },
  {
    title: "Add a 3D hero to any design",
    category: "3D hero",
    prompt:
      "Give my Cartwright homepage a premium 3D hero: render <DesignHero className=\"absolute inset-0 -z-10\" intensity={0.7} /> behind the hero content, with a CSS gradient fallback behind it, and keep prefers-reduced-motion working. Colours come from the brand palette automatically.",
  },
  {
    title: "Custom bespoke shader hero",
    category: "3D hero",
    prompt:
      "Build a bespoke three.js GLSL shader hero for my Cartwright design (mirror designs/engineered/HeroCanvas.tsx): raw three, full cleanup on unmount, reduced-motion = one static frame, mouse-reactive, palette-driven. Layer it over a CSS fallback.",
  },
  { title: "Apple-like minimal shop", category: "E-commerce", prompt: DESIGN_PROMPTS["webshop-minimal"], designSlug: "webshop-minimal" },
  { title: "Museum-minimal luxury shop", category: "E-commerce", prompt: DESIGN_PROMPTS.atelier, designSlug: "atelier" },
  { title: "Warm Scandinavian coffee shop", category: "E-commerce", prompt: DESIGN_PROMPTS["northern-coffee"], designSlug: "northern-coffee" },
  { title: "Classic default storefront", category: "E-commerce", prompt: DESIGN_PROMPTS["webshop-classic"], designSlug: "webshop-classic" },
];

export const PROMPT_CATEGORIES: PromptCategory[] = [
  "Dark & luxe",
  "Editorial",
  "Brutalist",
  "Modern SaaS / dev",
  "3D hero",
  "E-commerce",
];
