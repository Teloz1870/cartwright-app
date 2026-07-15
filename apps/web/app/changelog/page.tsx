import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import type { Metadata } from 'next';
import { Sparkles, Terminal, Globe, Code2, ShieldCheck, Mic, Palette, Package, Pencil, Layers } from 'lucide-react';
import { getEngineVersion } from '@/lib/engine';
import { pageOg } from '@/lib/og';

const CHANGELOG_DESCRIPTION =
  'Release history of the Cartwright engine — multi-currency, multi-language, agent editability, AI-search-ready commerce, and more.';

export const metadata: Metadata = {
  title: 'Changelog',
  description: CHANGELOG_DESCRIPTION,
  ...pageOg('Changelog', CHANGELOG_DESCRIPTION),
};

const RELEASES = [
  {
    version: '3.27.0',
    date: 'June 2026',
    title: 'First impressions + AI-agent hardening (engine v0.35.1–v0.36.3)',
    description:
      'A fresh scaffold\'s very first render is now a designed moment instead of leftover template copy — and the scaffold itself got harder and friendlier for the AIs building on it: three external AIs (Claude, Codex, Gemini) each built a site on the engine, surfaced real gaps, and every one was fixed at the source.',
    icon: <Sparkles className="w-5 h-5 text-cw-terracotta" />,
    features: [
      'First-run Welcome Canvas (v0.36.0, flag firstRunWelcome — scaffolds enable it) — an untouched site greets you with "Your site was just born." over a palette-adaptive aurora and three paths: a copy-paste AI quick-start prompt, the guided /admin/setup wizard, and a gallery of the design catalogue. It vanishes permanently the moment the site becomes yours.',
      'English-first scaffolds (v0.36.0–v0.36.2) — create-cartwright now scaffolds English-only (/en) sites with welcome copy instead of leftover studio hero copy, seeds setupComplete: false so the first admin login opens the setup wizard, and en-only scaffolds pass tsc out of the box (the locale cast now derives from routing.locales).',
      'Blank Canvas + the mockup-first flow (v0.36.1) — designs/blank/ is a registered, deliberately bare design made to be rewritten: ask your AI for a completely new design — header, footer, every page — while cart, checkout, admin and the AI tools keep working underneath. New mockup.set / mockup.clear tools publish a disposable HTML homepage takeover for instant approval before the real implementation; sanitized, confirm-gated and audited.',
      'Self-prompting design guidance (v0.36.3) — DESIGN.md, the design playbook every agent rules file points to: the three build paths, the built-ins inventory (ThreeHero + 9 scenes, svg-items, the verified GSAP recipe), taste rules and a screenshot self-verification rule. Plus Blank Canvas motion examples and stable data-cw-* hooks on every floating engine overlay.',
      'Security hardening (v0.36.3) — three admin AI endpoints that were internet-reachable without a session check are now auth-gated behind a shared requireAdminApi(), with a regression test that walks every admin API route (25 covered) so the class can\'t recur. Security headers land in next.config.ts (nosniff, X-Frame-Options, Referrer-Policy, HSTS, Permissions-Policy; CSP report-only), plus a timing-safe per-IP + per-email login brute-force throttle.',
      'Dark mode, unified (v0.35.1) — Tailwind dark: utilities and the theme-token overrides now follow one switch, so a fresh scaffold no longer half-flips when the visitor\'s OS is dark. The admin is decoupled and always the light Polaris skin; storefront dark returns later as a per-design opt-in.',
    ],
  },
  {
    version: '3.26.0',
    date: 'June 2026',
    title: 'The Light release (engine v0.35.0)',
    description:
      'Cartwright is now told — and built — around one sentence: the build engine AIs reach for. A real site with design, database and backend, live in minutes. npx create-cartwright defaults to a lean light profile, heavy modules become installable plugins, the Mixer matures into a full composition system, and the AI onboarding path is measured: a cold agent goes from scaffold to a designed, verified homepage in 99 seconds. The engine is now formally MIT-licensed.',
    icon: <Package className="w-5 h-5 text-cw-terracotta" />,
    features: [
      'Light by default — create-cartwright scaffolds the light profile: website-mode, 8 curated designs, lean modules (−18 packages); --profile full keeps everything, byte-identical to before.',
      'Plugin system (cartwright-plugin-v1) — optional engine modules as manifest-declared plugins with install state and an admin API. First five: phone-widget, wishlist, blog, reviews and three-scenes (the entire Live Canvas 3D system).',
      'Compositions (cartwright-composition-v1) — a whole look (skin + palette + voice + chrome + scene + layout) as a downloadable, uploadable artifact with dry-run import and an atomic composition.apply tool.',
      'Chrome as parts — 14 design headers/footers + 4 neutral parts are selectable and mixable per shop; the chrome registry derives from the design registry.',
      'Magic speed — parallel section generation (~5× faster), streamed progressive build UI, and an instant 0-LLM preset path.',
      'AI onboarding, measured — "Your first 10 minutes" in every scaffold: a verified terminal-only path from boot to a designed homepage in 99 seconds, plus motion & animation guidance with a verified GSAP recipe.',
    ],
  },
  {
    version: '3.25.0',
    date: 'June 2026',
    title: 'The metamorphosis release (engine v0.34.0)',
    description:
      'The release where the design catalogue becomes a unified design language: two flagship designs shipped in one day, a library of installable SVG ornaments, and a signature motif giving every premium pack its own recognizable chrome. The public Mixer lets anyone compose a Skin × Voice live, and a new manifest + capture infrastructure means every gallery derives from one source — so growing the catalogue is now ~free.',
    icon: <Layers className="w-5 h-5 text-cw-terracotta" />,
    features: [
      'Stillwater — a calm-enterprise flagship design with generative SVG landscapes rendered in four times of day, palette-adaptive end to end.',
      '21 SVG items — premium, palette-adaptive ornament components (9 of them CSS-animated), installable via the registry.',
      'Signature-motif chrome — all 14 premium packs now carry their own recognizable motif through header, footer and section chrome.',
      'The public Mixer at /mixer — compose any Skin × Voice pairing and preview it live in the real storefront layout.',
      'marketplace-manifest v2 — scenes, svg-items, elements, looks and motifs in one manifest; every gallery derives from this single source.',
      'pnpm capture:gallery — an automated preview-capture pipeline, plus registryStats install metrics for the component registry.',
    ],
  },
  {
    version: '3.24.0',
    date: 'June 2026',
    title: 'FABLE — the metamorphosis flagship',
    description:
      'A launch-day flagship celebrating Claude Fable 5: a 25th design where an instanced flock of 3D butterflies flutters behind an airy ivory story page, paired with its own launch-announcement Voice and a curated Look. Premium, website-mode, and palette-adaptive end to end — the whole flock and every section re-tone to your brand.',
    icon: <Sparkles className="w-5 h-5 text-cw-terracotta" />,
    features: [
      'A new butterflies 3D Live-Canvas scene — an instanced, palette-reactive flock with procedural wings, flap/glide motion, pointer scatter, and a reading-clearing around the headline. Inherits the WebGL2 / reduced-motion / save-data gating like every scene.',
      'The FABLE design (premium, website-mode) — ivory + morpho violet-blue, a Fraunces serif display hero over the flock, a scroll-cinema metamorphosis timeline (animation-timeline: view(), caterpillar → chrysalis → imago), a stat band, a safeguards story and a CTA.',
      'The fable Voice — the Fable 5 launch story as a vertical preset: metamorphic, luminous, precise, with its own genome copy, palette, and the butterflies scene.',
      'The Metamorphosis Look — the curated Skin × Voice pairing: the FABLE design carrying its own launch-announcement Voice, in your brand colours.',
      'Gallery hover-video — the /designs gallery now plays FABLE’s recorded scroll-through on hover (webm + mp4 + poster), like the other animated heroes.',
    ],
  },
  {
    version: '3.23.0',
    date: 'June 2026',
    title: 'The Page Mixer + the Apex flagship (engine v0.33.0)',
    description:
      'Content and design are orthogonal in Cartwright, so this release lets a shop mix a vertical Voice (kindergarten, carpenter, café…) with any palette-adaptive design and compose the page from swappable Parts — plus a much deeper premium-design layer: a design now owns every page, four breakthrough Pro elements, per-design webshop overrides, and Apex, a flagship super-pro storefront that composes all of it on one palette-adaptive page. Additive and default-off end to end — an existing shop is byte-identical until it opts in.',
    icon: <Palette className="w-5 h-5 text-cw-terracotta" />,
    features: [
      'Voice layer (genome) — the homepage hero + section copy now resolves through the Resolvable Genome, so a Voice can re-tone the whole page; the value-prop and feature cards are voiceable too. Gated by genomeResolve; every anchor equals the current brand copy, so flag-off is byte-identical.',
      'Vertical / Voice presets — a verticals/ registry where a Voice carries the full vibe (identity + genome copy + palette + 3D scene), applied idempotently from /admin/verticals. The Page Mixer (mixer-preview) renders any Skin × Voice composition in the real storefront layout, noindex + double-gated.',
      'Four recognizable premium designs — aerospace (cinematic deep-tech), halo (minimal product luxury), flux (vibrant gradient SaaS), drive (full-bleed automotive) — plus jungle, a friendly palette-adaptive site. A design now owns every page via the shell model (siteChrome + per-page contact/info/404 templates).',
      'Four Pro elements (honor-system cartwrightPlus) — a build-your-own configurator (live price, :has(:checked), no JS), a scroll-cinema story (animation-timeline: view()), a 3D product showroom, and a before/after compare slider. Per-design webshop overrides (productCard + PDP) land too.',
      'Apex — the flagship super-pro design: one palette-adaptive webshop homepage composing every breakthrough above, where every section and Pro element re-skins to your brand palette via applyPaletteAsTheme.',
    ],
  },
  {
    version: '3.22.0',
    date: 'June 2026',
    title: 'Design Slaraffenland — the design marketplace (engine v0.32.0)',
    description:
      'The premium-design marketplace foundation: a growing catalogue of code-built design packs, reusable three.js, design.md import and export/share, an agent-buildable design path, and a companion /designs marketplace on cartwright.app.',
    icon: <Sparkles className="w-5 h-5 text-cw-terracotta" />,
    features: [
      'Five new code-built premium designs — engineered (dark-luxe agency, three.js GLSL aurora hero) as the flagship, plus editorial-ink, brutalist, nocturne (+3D) and meridian. Each a real designs/<slug>/ pack, English-first, locked theme, three.js opt-in.',
      'A reusable three.js aurora scene + DesignHero wrapper so any pack gets a palette-driven 3D hero (inherits WebGL2 / reduced-motion / save-data gating).',
      'design.md export / download + share — the missing half of design import: a serializer + an export API + a download button, so a shop can share a design. Plus a prompt → design pipeline and a cartwright-premium-design skill teaching agents to hand-build bespoke packs.',
      'The cartwright.app /designs marketplace — a Figma-Community-style gallery with search + filter, per-design detail pages, build prompts, and a prompt library.',
    ],
  },
  {
    version: '3.21.0',
    date: 'June 2026',
    title: 'Motion & effects — pages that feel alive (engine v0.31.0)',
    description:
      'A flag-gated layer of modern CSS scroll-driven animations (compositor-thread, no JS jank), an animated palette-adaptive aurora gradient + glassmorphism, and an optional per-section motion vocabulary the Visual Builder can assign. Default-off and canary-safe end to end.',
    icon: <Sparkles className="w-5 h-5 text-cw-terracotta" />,
    features: [
      'Motion foundation — a new motionEffects flag + a motionPreset block in brand.config.ts (subtle | bold | off). Off ⇒ no rule matches ⇒ byte-identical render.',
      'Per-section effect vocabulary — a governed enum (fade-up | fade | zoom-in | slide-left | slide-right | parallax | none) the Magic Builder planner can assign per section.',
      'An animated Aurora hero — aurora-site wraps its hero in the animated gradient with the three.js hero behind it as an opt-in; the gradient is the guaranteed fallback.',
      'Every animation is compositor-only, inside prefers-reduced-motion: no-preference, with scroll-driven effects behind an @supports guard — unsupported browsers stay static.',
    ],
  },
  {
    version: '3.20.0',
    date: 'June 2026',
    title: 'Agent-optimized design — read it, build with it, cite it (engine v0.30.0)',
    description:
      'The design system (Aurora + the Magic Builder + the section catalogue) is now optimised for AI agents end to end: they can read it (registry + schemas), build with it (the builder tools), and cite it (Schema.org JSON-LD).',
    icon: <Code2 className="w-5 h-5 text-cw-terracotta" />,
    features: [
      'Section JSON-LD — pages built from a section layout now emit Schema.org structured data server-side (faq → FAQPage, howItWorks → HowTo, galleryGrid → ImageGallery, testimonials → Review, pricingTable → ItemList) so AI search engines can cite them. Honest by construction — no fabricated ratings or prices.',
      'An installable component registry — /api/registry serves real, MIT-licensed, npx shadcn add-able TSX for a curated subset of section atoms, alongside the always-on prop JSON-Schema for every section.',
      'A section-vocabulary skill teaching external AI agents the whitelisted section types + the data-not-code doctrine before they generate, so their output is valid and on-brand.',
      'Discovery surfaces (llms.txt, /.well-known/mcp.json) advertise the new capabilities — flag-gated so nothing links a disabled endpoint.',
    ],
  },
  {
    version: '3.19.0',
    date: 'June 2026',
    title: 'Magic Builder + the Aurora flagship design (engine v0.29.0)',
    description:
      'Two big additions: a prompt-driven page builder, and a new flagship default design system — built on one shared set of section atoms, so the two are the same components.',
    icon: <Pencil className="w-5 h-5 text-cw-terracotta" />,
    features: [
      'Magic Builder (magicBuilder, default-off, admin-only) — describe a page in plain language and it builds itself, section by section, live in the Visual Builder preview. The prompt can only emit a plan of whitelisted section keys, each filled by AI with Zod-validated props — the model never picks a tag, colour or font. Output lives as governed, audited, one-click-revertible data, never code on disk.',
      'A ~20-section curated catalogue (hero, value-props, feature-grid, how-it-works, testimonials, pricing-table, FAQ, gallery, CTA…) — client-safe, accessible, and shared by both the builder and the new default design.',
      'Aurora — the new flagship default design for both website (aurora-site) and webshop (aurora-shop), composed from the catalogue and palette-adaptive: one design renders every brand in its own colours (applyPaletteAsTheme), retiring the old "every webshop looks the same" default.',
      'A public, shadcn-compatible component registry (/api/registry) exposing each section\'s prop JSON-Schema so external AI agents and IDEs can target Cartwright sections.',
    ],
  },
  {
    version: '3.18.0',
    date: 'June 2026',
    title: 'Admin, restructured & re-skinned + bulletproof first-run (engine v0.26.0–v0.28.0)',
    description:
      'A run of admin + developer-experience releases: the admin sidebar becomes a calm, grouped information architecture; the whole /admin backend is re-skinned to a clean light Shopify-Polaris look; and first-run database setup is made deterministic so onboarding can never get stuck. Admin-only and storefront-neutral — the three canaries render identically.',
    icon: <Package className="w-5 h-5 text-cw-terracotta" />,
    features: [
      'Grouped admin IA (v0.26.0) — the flat ~40-item sidebar becomes two pinned items above seven ordered, collapsible groups (Sales · Content · Intelligence · Marketing · Connections · Appearance · System). Nav is a single typed source of truth; a group auto-hides when all its items are flag-gated off. No schema change, default-equivalent.',
      'A modern admin skin (v0.28.0) — a scoped [data-admin-skin] token override re-skins every admin surface to a light Polaris palette (white cards, fine borders, dense tables, a sticky top bar with ⌘K global search) without renaming a single storefront token and with zero storefront impact. ~58 admin pages migrated to shared primitives.',
      'Bulletproof first-run DB setup (v0.27.0–v0.27.1) — a new pnpm db:setup routes around an intermittent Prisma 7.8 schema-engine flake by applying the schema via the libSQL client, so a brand-new shop reaches admin login with no manual recovery. Postgres-aware, fails loudly on real errors, and re-running never wipes data.',
      'pnpm admin:reset — recover a lost or drifted admin password (resets only the password, keeps all data, and rewrites .admin-credentials so it always matches the DB).',
    ],
  },
  {
    version: '3.17.0',
    date: 'June 2026',
    title: 'Agentic commerce, completed: buy-in-ChatGPT, agent identity-linking & in-browser tools (engine v0.25.0)',
    description:
      'Three agentic-web surfaces move from scaffold to wired: ACP delegated-payment completion, a full UCP OAuth identity-linking server, and WebMCP in-browser tools. All default-off and canary-safe — an existing shop is byte-identical until it opts in — and the ACP payment path ships code-ready but inert until external Stripe + ChatGPT access lands.',
    icon: <Code2 className="w-5 h-5 text-cw-terracotta" />,
    features: [
      'ACP delegated-payment completion (acp + env ACP_PAYMENT_COMPLETION, default-off) — the last piece of the ACP checkout lifecycle: /complete now charges via a Stripe Shared Payment Token (off-session PaymentIntent) and builds the order from the ACP session line items, with idempotency replay and refund-on-failure. Wired and unit-tested behind the env gate; it responds 501 (inert) until Stripe SPT access and ChatGPT merchant onboarding are connected, so it can never accidentally move money.',
      'UCP identity-linking — an OAuth 2.0 server (ucpIdentityLinking, default-off) — implements dev.ucp.common.identity_linking: a full Authorization Code + PKCE server so an agentic platform can act on a shopper’s behalf across merchants. Ships RFC 8414/9728 metadata, RFC 7591 dynamic registration, /oauth/{authorize,token,revoke}, a consent screen, and a sample protected resource (/api/ucp/orders). Only token hashes are stored; run pnpm db:push and set AUTH_URL before enabling.',
      'Security-hardened after an adversarial review — refresh-token reuse detection (a reused rotated token revokes the whole family), client-bound revocation, a canonical issuer (never the Host header — so issuer-spoofing and metadata cache-poisoning are out), and a least-privilege registration default with an unverified-app consent warning.',
      'WebMCP in-browser tools (webMcp, default-off) — the storefront registers search_products, get_cart, add_to_cart and a same-origin navigate via document.modelContext, so an in-browser AI agent acts reliably instead of scraping the DOM. Experimental (Chrome 149 origin-trial, W3C draft) — kept off the canary mosaic.',
    ],
  },
  {
    version: '3.16.0',
    date: 'June 2026',
    title: 'Onboarding clarity, secure first-run & dark-mode polish (engine v0.24.0–v0.24.2)',
    description:
      'A DX + polish run across three patch releases: a fresh shop is sign-in-ready regardless of approach (CLI, IDE agent, or manual clone), the migration baseline is clean again, and the admin — plus the storefront — renders correctly in dark mode.',
    icon: <ShieldCheck className="w-5 h-5 text-cw-terracotta" />,
    features: [
      'Onboarding & first-login clarity (v0.24.0) — create-cartwright now bootstraps the DB (db push + seed) so the admin exists and .admin-credentials is written before you open the app, and every surface points at password-first login (magic-link appears once Resend is set).',
      'Reliable first-run (v0.24.1) — the auto db push retries once on the transient Prisma 7.8 engine error and surfaces real failures; the migration baseline was regenerated from ~50-migration drift into a single clean from-empty baseline (db push stays the canonical path, so the live canaries are unaffected).',
      'Admin dark-mode contrast (v0.24.2) — a 33-page admin audit replaced hardcoded Tailwind colors with theme-flipping sol-* tokens so form/tool surfaces are readable in both themes; the /admin/hoptify nav item is now gated on its flag (no more 404).',
      'Storefront dark-mode scoping (v0.24.2) — dark mode is admin-only now: the root ThemeProvider no longer follows OS dark (defaultTheme="light", enableSystem=false), so brand storefronts always render their designed palette instead of a half-dark mess. The admin toggle still works; the Teloz showcase stays dark by design.',
    ],
  },
  {
    version: '3.15.0',
    date: 'June 2026',
    title: 'Visual Builder + Vercel v0 (engine v0.23.0)',
    description:
      'A governed, no-code page builder — and Vercel v0 as a native generation engine. Design a page in a three-panel UI, or let v0 turn a prompt into UI; either way the output lands as audited data you own, never code dumped to disk. Both ship default-off and canary-safe, so a shop that does not opt in is byte-identical to before.',
    icon: <Palette className="w-5 h-5 text-cw-terracotta" />,
    features: [
      'Visual Builder (visualBuilderEnabled) — a three-panel editor at /admin/visual-builder: a section list (add / reorder / hide), a live-preview iframe, and an inspector. Output is stored as a validated section tree in Page.layoutJson (hero / featureGrid / ctaFooter / richText) — audited data, never TSX written to disk. A null layout renders from your existing body/vibeHtml, so the storefront is unchanged until you build a page.',
      'Governed writes — every change goes through the pages.set_layout tool with a plan-first confirmation token, an audit-log entry, and one-click revert. The AI "generate section" action fills a section\'s own schema-validated props, so the model can never emit arbitrary markup. A shared PageSections component renders both the preview and production, so what you see is what ships.',
      'Vercel v0 generator (v0Generator) — a second AI engine in the Vibe Sandbox alongside Anthropic, and wired directly into the Visual Builder as a governed vibe section. v0 turns text into UI; Cartwright normalizes the result to HTML, sanitizes it, and persists it as vibeHtml — code becomes governed data, nothing is written to disk. Bring your own v0 key (encrypted in the DB or via V0_API_KEY); a daily-usage guard keeps you under v0\'s limits, and a GDPR processor entry is added automatically.',
      'Default-off and canary-safe — both flags ship off. Run pnpm db:push to add the additive Page.layoutJson + four IntegrationSettings columns before enabling.',
    ],
  },
  {
    version: '3.14.0',
    date: 'June 2026',
    title: 'AI-native commerce: semantic search, generative UI & agent surfaces (engine v0.22.0)',
    description:
      'Your catalog becomes semantically searchable, the storefront assistant composes its own product UI, and the agent-commerce surfaces (ACP, UCP) move closer to complete. All additive — semantic search falls back to lexical when embeddings are not primed, so there is no regression.',
    icon: <Sparkles className="w-5 h-5 text-cw-terracotta" />,
    features: [
      'Hybrid semantic search — vector cosine-similarity + lexical boost over a product-embedding index, wired into both the search API and the products.search tool, with a soft fallback to lexical search when embeddings are not ready. Embeddings come from Gemini (text-embedding-004) with a local Ollama fallback; backfill with pnpm embeddings:backfill.',
      'pgvector / Postgres acceleration (opt-in) — for large catalogs, push the nearest-neighbour search into Postgres with a pgvector HNSW index — same ranking, identical results, logarithmic instead of linear. Enabled with DATABASE_DRIVER=postgres and pnpm pgvector:setup; the default Turso/SQLite path is untouched. Runs on Supabase Postgres.',
      'Model-selectable generative UI — the storefront chat now lets the model choose how to present products — grid, spotlight, or comparison — via a whitelisted tool (it picks a layout + product slugs; the server fetches the data, never arbitrary markup). XSS-safe and read-only.',
      'Agent-commerce surfaces — a UCP native_commerce capability marks catalog products as native-buyable by agents (gated so the shop never advertises what it can\'t honor), and the ACP checkout session gains a structured, inert /complete scaffold behind a default-off env gate (it can never accidentally move money). Plus token-level cost-metering on the AI chat routes, so spend is observable.',
    ],
  },
  {
    version: '3.13.0',
    date: 'June 2026',
    title: 'Google Sheets, Drive & Docs + Stripe Subscriptions (engine v0.21.0)',
    description:
      'The Google Workspace modules on top of the v0.20.0 connector, plus recurring billing. Everything is additive and default-off, so a shop that does not opt in is byte-identical to before.',
    icon: <Package className="w-5 h-5 text-cw-terracotta" />,
    features: [
      'Google Sheets sync (sheetsSync) — two-way sync between a Google Sheet and your catalog via the Sheets API v4: pull upserts products by SKU and never deletes; push clears the range first so a shrunk catalog leaves no stale rows; each run reports added/updated/skipped. CRON_SECRET-gated cron + /admin/sheets. Default-off.',
      'Google Drive media + backup (googleDrive) — import images from a Drive folder into the media library (reusing the MediaAsset + Blob pipeline with sha256 de-dupe) and push the logical DB/media backup to Drive as an off-Vercel copy. CRON_SECRET-gated cron + /admin/drive. Default-off.',
      'Google Docs import (docsImport) — turn a Doc into a draft blog post or info page. The converter emits Cartwright engine markdown (never HTML); content is stored as text and rendered through the safe renderContentBlocks path, so a shared Doc with <script>/javascript: cannot become stored XSS. Default-off.',
      'Stripe Subscriptions (subscriptions) — recurring billing on Stripe Billing with an admin list (cancel-at-period-end) and a self-service customer portal (start/pause/resume/cancel, scoped to the signed-in user). Webhook handling is additive and flag-gated; one-off checkout is unchanged when off. Run pnpm db:push before enabling. Default-off.',
    ],
  },
  {
    version: '3.12.0',
    date: 'June 2026',
    title: 'Google Workspace connector, Sign-In, FX auto-refresh & storefront i18n (engine v0.20.0)',
    description:
      'The Google integration foundation plus two gap-closers. The connector is fail-soft infrastructure (inert without credentials); the rest ship flag-off, so an existing shop is byte-identical until it opts in.',
    icon: <Globe className="w-5 h-5 text-cw-terracotta" />,
    features: [
      'Google Workspace OAuth2 connector (no flag) — one shared server-side connector (lib/google) behind Sheets/Drive/Docs: bring your own Google Cloud client (encrypted in IntegrationSettings or env), incremental per-module scopes, CSRF/PKCE-protected flow, skew-aware single-flight token refresh, local-authoritative disconnect. Fail-soft: no credentials means every Google surface is inert.',
      'Google Sign-In (googleAuth) — a "Continue with Google" button on customer login via NextAuth, mirroring the GitHub provider (uses the OAuth-ready Account table, no new model). Admin is never granted via OAuth. Default-off; needs GOOGLE_CLIENT_ID/SECRET.',
      'FX auto-refresh (fxAutoUpdate) — refresh exchange rates daily from the ECB no-key feed into a DB override, read as dbRate ?? staticAnchor. Display, checkout and the receipt resolve the same rate (no drift). Flag off → static brand.config anchors, exactly as before.',
      'Storefront translation rendering — saved Product/Category translations now render on the storefront (PDP/PLP/category: name, description, metadata, alt text, breadcrumbs, JSON-LD), closing the v0.15 gap where translations were saved but not displayed.',
    ],
  },
  {
    version: '3.11.0',
    date: 'June 2026',
    title: 'Secure-by-default accounts & onboarding (engine v0.19.0)',
    description:
      'The "finished package" customer surfaces and an onboarding/credential revamp. The headline: no more hardcoded admin password. Most items are additive; a few columns need pnpm db:push before enabling.',
    icon: <ShieldCheck className="w-5 h-5 text-cw-terracotta" />,
    features: [
      'Secure-by-default admin credentials — the seed generates a strong random admin password (no hardcoded default) and forces a change on first login at /admin/konto; the password is also written to a gitignored file so a new owner can always find it.',
      'Password reset & account settings — /account/forgot-password → email → /account/reset-password (HMAC-SHA256 single-use token peppered with AUTH_SECRET, 1h TTL, no account-existence leak), plus /account/settings to edit profile and set/change a password.',
      'Contact-form image attachments (contactAttachments, default-off) — image-only, size-capped, magic-byte-validated uploads to Vercel Blob, shown in the admin inbox.',
      'Default legal pages + self-service GDPR export — privacy/terms/cookie pages render from templated defaults when no CMS page exists, and customers can download their full data as JSON from /account.',
    ],
  },
  {
    version: '3.10.0',
    date: 'June 2026',
    title: 'Marketing automations, Prisma 7 & a security-docs pass (engine v0.18.0)',
    description:
      'A platform-hardening release. Resend — already your transactional transport — becomes an opt-in lifecycle email engine; the ORM jumps to Prisma 7\'s Rust-free client; and the security surface gets documented end to end. All additive and default-off: a shop that does not opt in is byte-identical to before.',
    icon: <Package className="w-5 h-5 text-cw-terracotta" />,
    features: [
      'Marketing automations (marketingAutomations) — emit welcome, abandoned-cart, and post-purchase events to Resend Automations, which runs the drip sequences you wire in its dashboard. Cartwright emits events only (it stays the source of truth, not a marketing-automation platform), and emission is consent-gated to confirmed newsletter subscribers. The abandoned-cart cron emits the event instead of a single mail — no double-send. Default-off; inert without a Resend key.',
      'Prisma 7 — the data layer moves to Prisma 7\'s Rust-free prisma-client generator and driver adapters (libSQL/Turso for production, a local file adapter for dev). No schema changes, so existing databases need no migration; new scaffolds db push from zero as before.',
      'Security & architecture docs — four new guides ship in the box: API-key security (HMAC-SHA256 keys peppered with AUTH_SECRET so a DB leak alone yields no usable key), the scope model + per-tool map, the MCP endpoint architecture (stateless transport, curated introspection — never your DB schema), and an advanced Supabase/Postgres path (RLS on, Data API off).',
      'Dependency refresh — Stripe apiVersion 2026-05-27.dahlia (SDK 22.2.0), native Tailwind v4.3 scrollbar utilities on the storefront panels, and removal of a stale npm lockfile (the project is pnpm-only).',
    ],
  },
  {
    version: '3.9.0',
    date: 'June 2026',
    title: 'Agent-editable shop: structure, theme & catalog by AI + JSON (engine v0.16.0)',
    description:
      'Where in-place editing (v0.14.0) lets you click and rewrite copy, this makes the shop\'s structure editable by agents and machine config — homepage section order, theme tokens, and the catalog itself. All default-off / additive: a shop that does not opt in is byte-identical to before.',
    icon: <Code2 className="w-5 h-5 text-cw-terracotta" />,
    features: [
      'Section layout (sectionLayout / layoutJson) — an AI agent reorders or hides studio homepage sections via the design.set_layout MCP tool, with required sections (hero, CTA) protected. Default-off, runtime-toggleable, and revertible via the audit log. Flag off → the hardcoded section order is byte-identical.',
      'Extended themeJson — fonts and corner-radius are now an injection-guarded superset of the 6-colour palette, so an agent can set --font-sans / --radius-sol-* from the same theme override the colour palette already used. A current palette renders identically.',
      'products.json machine-seed — seed an entire catalog from a validated JSON file (pnpm seed) instead of editing TypeScript. Prices are in øre (machine-precise), with per-row validation errors that fail fast.',
      'Setup safety — a fail-fast env preflight surfaces a missing AUTH_SECRET / database URL on boot with a one-line fix, instead of a confusing downstream error.',
    ],
  },
  {
    version: '3.8.0',
    date: 'June 2026',
    title: 'Sell in every currency, in every language (engine v0.15.0)',
    description:
      'Day-one internationalisation, both halves. Checkout now charges in the customer\'s currency — not just shows the price in it — and the storefront translates Pages, Services and blog posts, not only products. All additive: a single-currency, single-language shop is byte-identical to before.',
    icon: <Globe className="w-5 h-5 text-cw-terracotta" />,
    features: [
      'True multi-currency (multiCurrency) — the Stripe charge is created in the customer\'s selected presentment currency with the converted amount, and the order snapshots currency + FX rate so receipts, refunds and exports reproduce exactly what they paid. currencySwitcher stays the display-only gate; flip multiCurrency to upgrade from "show in EUR" to "charge in EUR".',
      'One conversion path (lib/money.ts) shared by display, charge and receipt — the shown price is always the charged price. 2-decimal-safe with a guard rather than a silent mis-charge.',
      'Multi-language breadth — supported locales live in brand.config.ts (add German in one line: ["da","en","de"]); routing + hreflang light up automatically. The /admin/translations editor and render path extend from products/categories to Pages, Services and blog posts.',
      'Migration: the Order table gains currency + fxRate — run pnpm db:push before enabling multiCurrency. Multi-language needs no migration.',
    ],
  },
  {
    version: '3.7.0',
    date: 'June 2026',
    title: 'In-place AI editing: edit your live storefront by clicking it (engine v0.14.0)',
    description:
      'Cartwright\'s owned take on click-to-edit, on infrastructure you own. Logged in as admin, toggle edit mode on your live storefront, click a copy element, type a plain-language note ("make this headline shorter"), and an AI proposes new copy shown as a before→after diff before it applies. One default-off, admin-only, base-locale-only flag — the storefront is byte-identical for everyone else.',
    icon: <Pencil className="w-5 h-5 text-cw-terracotta" />,
    features: [
      'In-place editing (annotateEdit) — an admin-only overlay highlights editable copy on the live storefront; click one → write a note → AI proposes → before/after diff → confirm. Wired across footer copy, hero headline/sub-line, product name/description, page title/body, and category name. Off → no data attributes and no overlay render at all.',
      'The model never picks a tool. During propose it runs with no tools (a pure text transformer); a deterministic allowlist (lib/annotate/targets.ts) maps each target → write-tool and excludes anchored legal copy. Apply reuses the plan-first confirmation-token spine (args-hash bound, owner-scoped, one-time-use), so tampered copy is rejected — and every edit lands in the audit log under an annotation: actor.',
      'New settings.update_copy tool for the hero headline/tagline (single-column read-modify-write) — single-field edits never blank sibling branding columns, and the existing settings.update_branding the admin chat uses is untouched.',
      'Base-locale only in v1 (the write tools have no locale param yet); per-block page editing and localized editing are deliberately out of scope. Default-off — flip annotateEdit in /admin/features to dogfood it.',
    ],
  },
  {
    version: '3.6.0',
    date: 'June 2026',
    title: 'Order management: an HPOS-grade back office (engine v0.13.0)',
    description:
      'Turns /admin/ordrer from a flat list into a real back office: a scalable Orders workspace, admin-initiated returns/RMA, printable pick lists, and rule-based next-best-action. Everything ships behind four default-off, ecommerce-gated flags — an upgrade behaves exactly as before until you flip one, and website-mode shops never mount any of it.',
    icon: <Package className="w-5 h-5 text-cw-terracotta" />,
    features: [
      'Order workspace (orderWorkspace) — status tabs over a 12-status lifecycle governed by a pure state machine (the 9 existing statuses kept verbatim; new admin-only processing/delivered/completed), server-side search + cursor pagination, bulk status actions with per-order skip reporting, exception flags (delayed / low-stock / needs-attention), an order notes + status timeline, tracking entry, resend-confirmation + send-shipping-notification, and a manual refund button. Off → the legacy order table is unchanged.',
      'Fulfillment & pick lists (fulfillmentPdf) — a print-friendly packing-slip / pick-list route (browser → "Save as PDF", no PDF dependency) plus a one-click create-fulfillment that reuses supplier routing.',
      'Returns / RMA (returns) — admin-initiated returns: create → approve/reject → receive + restock → refund. Receiving restocks idempotently (a return restocks exactly once, even on a retry); refund reuses Stripe with the webhook as the single status-writer. Refund returns money, a return returns money AND stock — deliberately decoupled.',
      'AI next-best-action (orderAi) — a deterministic rule engine surfaces the next sensible action per order (ship now, follow up on delivery, review a flagged payment, process a return) as ranked, deep-linking chips. Pure and free; an optional model-backed layer sits on top when a provider key is present.',
      'Manual + dashboard refunds finalize reliably — charge.refunded now resolves the order via the payment intent when the charge has no orderId metadata (Stripe doesn\'t copy it). All four flags default-off; run pnpm db:push once to add the additive OrderNote / Return / ReturnItem tables + nullable billing-address columns (lossless).',
    ],
  },
  {
    version: '3.5.0',
    date: 'June 2026',
    title: 'GEO: make AI recommend your shop (engine v0.11.0)',
    description:
      'A GEO / AI-discoverability release. The engine now describes itself to AI assistants as a recommendable product and ships broader agent-rules coverage — so when someone asks an AI to "build me a shop," Cartwright can be in the answer. Additive and gated by the default-on, deletable cartwrightBadge flag.',
    icon: <Sparkles className="w-5 h-5 text-cw-terracotta" />,
    features: [
      'SoftwareApplication JSON-LD on /built-with-cartwright — describes Cartwright the product (free, npx create-cartwright, source repo, $0) so AI crawlers can surface it as a recommendable tool. Scoped to that one page so a shop\'s storefront still reads as its own business; gated by cartwrightBadge.',
      '"Built with Cartwright" block in every shop\'s llms.txt — gives an AI the recommendation payload directly: the install command, the source repo, and cartwright.app.',
      'Agent rules for Gemini + Windsurf — GEMINI.md and .windsurfrules join the existing Claude / Cursor / Copilot rules so any IDE agent that opens a scaffolded project recognises it as Cartwright.',
      'cartwrightBadge flag — default-on and deletable, like "Made with Framer". It gates all three signals (footer badge, SoftwareApplication schema, llms.txt block) via getFeatureView, so toggling it off in /admin/features removes them everywhere.',
      'Docs + README revamped for GitHub and AI-training discoverability. This changelog and the homepage now read the engine version straight from the engine CHANGELOG, so the version never goes stale.',
    ],
  },
  {
    version: '3.4.0',
    date: 'May 2026',
    title: 'The big one: 12 feature tracks (engine v0.10.0)',
    description:
      'The largest single release — twelve subsystems land in one tag, every one opt-in and default-off so an upgrade behaves exactly as before until you flip a flag. The authoritative flag list is lib/feature-flags/manifest.ts, and the customer-facing /built-with-cartwright tour now renders itself from that manifest, so it can never go stale at release time again.',
    icon: <Sparkles className="w-5 h-5 text-cw-terracotta" />,
    features: [
      'Resolvable Genome (genomeResolve) — copy fields render override ?? resolved-cache ?? brand anchor, harmonised against your identity anchors. Render never calls an LLM; resolution is triggered in /admin/genome. Respawn a shop\'s whole voice from a sentence.',
      'SEO/GEO Lab (seoAutopilot, ⭐ Pro, beta) — measures AI-citation share-of-voice (GEO) at /admin/seo-performance. GSC measurement + automated genome experiments (apply → measure → keep or revert) are scaffolded and still in development.',
      'Hoptify (hoptify + logoGenerator) — a tongue-in-cheek Shopify pendant: a familiar storefront design plus a parody "import from Shopify" onboarding that genuinely brings your palette (design-import) and products (Firecrawl scraper) across when a key is set, fail-soft to a demo otherwise. Includes a Gemini raster logo generator.',
      'Firecrawl scraper + Design import (designImport) — scrape product data from a URL, or pull a colour palette from any site into a live theme in ~2 minutes. /admin/design-import.',
      'Blog (blog) — /blog + RSS + BlogPosting JSON-LD + sitemap, edited from /admin/blog. Content marketing without a second CMS.',
      'Shipping & fulfillment (shippingZones) — zone/weight rates with delivery times + dropship-supplier routing, or a flat rate. /admin/shipping.',
      'Tax / VAT (stripeTax) — managed multi-country VAT via Stripe Tax (EU OSS, VAT-ID) with invoicing, or the built-in single-rate. Correct at checkout either way.',
      'WooCommerce parity — wishlist, abandoned-cart recovery, admin redirects, product CSV import/export, and a translation-management UI. The migration toolkit.',
      'GDPR / DSAR — data-subject export + soft-erasure, retention crons, and a processor register at /admin/processors. Compliance built in, not bolted on.',
      'Backup + indexing controls — automated DB backup cron, plus per-shop noindex + AI-crawler allow/block toggles wired into robots.txt and meta robots.',
      'All flags default-off and ship in the engine v0.10.0 tag — npx create-cartwright pulls them once the template ref bumps. See the engine CHANGELOG for per-feature setup + required keys (FIRECRAWL_API_KEY, BLOB_READ_WRITE_TOKEN).',
    ],
  },
  {
    version: '3.3.0',
    date: 'May 2026',
    title: 'Design System: pick a design, import from any AI tool',
    description:
      'Decouple visual design from industry seed-data. Previously a Cartwright shop was locked to one homepage component per industry-template slug. Now design is a first-class orthogonal axis — any industry combines with any design — and you can drop a design.md from Gemini Stitch, Claude Design, or v0 into /admin/designs to install it. Ships with 4 website designs and 4 webshop designs out-of-the-box, including 3 brand-new webshop variants (minimal, editorial, bold).',
    icon: <Palette className="w-5 h-5 text-cw-terracotta" />,
    features: [
      'New designs/ registry — first-class DesignPack abstraction with BrandingSettings.designSlug for explicit selection. Pick any design with any industry. Backwards-compat: shops upgraded from v0.6.0 with designSlug=NULL render identically via inferDesignFromIndustry().',
      'cartwright-design-v1 spec — YAML frontmatter + Markdown body. Defines palette (6 core + extraTokens), fonts, animations, and a sections array (hero / value-props / feature-grid / how-it-works / stack-grid / cta-footer / opaque). Round-trips cleanly through parser + serializer.',
      'Gemini Stitch adapter — drop a .md export from stitch.google into /admin/designs, hit "Import" with the Stitch adapter. Normalizes Stitch field names (colors.primary → palette.accent, sections[].kind="features" → "feature-grid") to cartwright-design-v1. ~30-second end-to-end.',
      'Claude Design / v0 / Loveable adapter — drop a raw .tsx file with the claude-design adapter. Best-effort hex-frequency palette extraction + regex headline/tagline scrape + sensible placeholder sections. Bridge to round-trip-edit, not a full parser.',
      '/admin/designs hub — card grid of installed designs with active-indicator and Auto-mode badge. Drag-drop upload with adapter selector (auto / cartwright / stitch / claude-design). Click any card to activate; revalidates / immediately.',
      '3 new webshop design variants — webshop-minimal (Apple-like full-bleed hero + oversized typography), webshop-editorial (magazine split-screen with story-card products, ⭐ Pro), webshop-bold (neo-brutalism with terracotta + electric-yellow paper, ⭐ Pro).',
      '4 existing implicit designs moved into the registry — saas-dark (Antigravity dark/indigo SaaS), studio (cartwright.app warm-tech, ⭐ Pro), corporate-baseline (generic cinematic), webshop-classic (the pre-v0.7.0 default). All git-mv with history preserved.',
      'Power-user CLI — tsx scripts/design-import.ts <file> [--from <adapter>] [--force]. Offline equivalent to /admin/designs upload; same parser + codegen + registry-update pipeline.',
      'Theme integration — lib/theme.ts:designToInlineCss() emits design pack tokens at page render. BrandingSettings.themeJson layers on top (last-write-wins) so per-shop palette fine-tuning still works on top of any design.',
      'Setup wizard — new Design dropdown in brand-step. Filters by mode (ecommerceEnabled hides webshop designs and vice versa). Default "Auto (xxx)" preview shows what the inference would resolve to.',
      'New docs section — /docs/designs covers overview, picking, design.md spec, Stitch import, Claude Design import, writing your own.',
    ],
  },
  {
    version: '3.2.0',
    date: 'May 2026',
    title: 'Voice Shop & Local AI v2',
    description:
      'Customers talk directly to your shop via Gemini Live, and you can run the whole admin AI on a free local Ollama model. Every AI call is provider/model/modality-stamped in the audit log so /admin/audit can filter "voice only" or "Gemma only" in one click.',
    icon: <Mic className="w-5 h-5 text-cw-terracotta" />,
    features: [
      'Voice Shop (Gemini Live) — floating mic-FAB on storefront, browser↔Google WebSocket with ephemeral tokens, server-side tool dispatch with same audit-log + scope-guards as text chat. Default off; opt-in per shop via brand.features.voiceShop. Default allowed tools cover products.search/get + cart.add/get_summary + discounts.try_apply (orders.create requires opt-in).',
      'BotID-protected token-mint in production + per-IP rate-limit (3 burst, 1 per 20 min) + pre-committed setup with lockAdditionalFields so the browser can never expand the tool list mid-session.',
      'Voice cap admin: maxMinutesPerSession + maxMinutesPerDay configurable in /admin/integrations, with VoiceUsageSection injected into the new AiStatusPill so you see today\'s minutes burned at a glance.',
      'Local AI v2 — chatModelResolved(intent) returns {handle, provider, model, capabilities}. Backwards-compatible with the legacy chatModel(). New MODEL_CAPABILITIES matrix tiers Claude 4.5/4.6/4.7, Gemma 4 (e2b/e4b/e4b-mlx/26b/31b), Gemma 3, Llama 3.x, Qwen — read-only / low-risk-writes / all.',
      'Ollama in admin: /admin/integrations "Hent modeller" button auto-detects Apple Silicon (offers -mlx variants), SSE-streaming pull with live progress bar, delete-with-confirm + total-disk-usage display, install-card with brew/curl/winget tabs when Ollama is offline.',
      'AiStatusPill on every /admin/* page — fixed bottom-right badge with 30s health-check polling. Four states: 🔒 Local AI, ☁️ Cloud AI, ⚠️ Auto degraded (recently fell back), ❌ AI offline.',
      'Setup-wizard 3-way AI step — Cloud (Anthropic) / Lokal (Ollama with live probe) / Spring over. Local branch auto-discovers and auto-selects first model when Ollama responds.',
      'Audit-log stamps — every AI-driven tool call gets provider/model/modality/sessionMinutes stamps via AsyncLocalStorage withAuditContext. Old rows backfilled to provider="anthropic", modality="text". /admin/audit can filter by modality (text vs voice) or provider (anthropic vs local vs google).',
      'Vibe generators always-cloud — theme + product-SEO + category-SEO use chatModelResolved("vibe") which forces Anthropic even when aiProvider="local", because structured JSON output from local models is hit-or-miss.',
    ],
  },
  {
    version: '3.1.0',
    date: 'May 2026',
    title: 'Headless Merchant: A2A Foundation',
    description: 'The full Agent-to-Agent architecture lands. Cartwright shops can now serve buyer agents end-to-end — signed Agent Card discovery, deterministic negotiation, Verify-then-Pay escrow with cryptographic Proof-of-Task-Execution, and human-in-the-loop oversight via /admin/agentic. All gated behind brand.features.a2a so your storefront stays clean unless you opt in.',
    icon: <ShieldCheck className="w-5 h-5 text-cw-terracotta" />,
    features: [
      'Three new A2A endpoints: GET /api/agent-card (signed ed25519 JSON), POST /api/negotiate (deterministic engine), POST /api/escrow/verify (state machine + PoTE).',
      'Anchor-and-Resume negotiation engine — pure TS, monotonicity-guaranteed, 800+ property tests per CI run. No LLM imports allowed in the kernel.',
      'Guardian middleware as the Adjudication branch of Separation-of-Power: every agentic call validated against shop legislation before money moves. Fails closed to deny-all by default.',
      'P2K scanner: blocks any commit that imports an LLM and a money/policy primitive in the same module. Architectural enforcement, not a lint suggestion.',
      'Five industry templates: --template website-corporate | coffee | sunglasses | agent-marketplace | generic. Each sets brand.mode + brand.features defaults to match the archetype.',
      '/admin/agentic dashboard — live A-JWT verification feed, escrow positions, disputed-escrow review queue, Agent Card snapshot. Read-only first; write-side incoming.',
      'EscrowTransaction + PoTEProof + AgentCard + AgenticJWT — four new Prisma models with state-machine-enforced transitions.',
      'CLI: --ref stable|next channel aliases (stable resolves to latest tag, next opts into bleeding-edge main).',
      'Vibe Coding sandbox at /admin/vibe-sandbox — push raw HTML from Cursor or v0 via /api/admin/vibe/push, auto-translate via Gemini.',
      'Phone.inc telephony scaffolded at /admin/telefon — IVR config, voicemail transcription, call routing. Preview while Phone.inc API spec stabilises.',
      'Setup wizard at /admin/setup — DB-first secret storage; no env file editing required.',
      '/integrations top-nav page launched — 15 core service integrations, plus the 10 planned Plus-tier MCP integrations (Klaviyo, Mailchimp, QuickBooks, Notion, Airtable, HubSpot, Slack, Zapier, ShipStation, Algolia) with real brand logos, category eyebrows, and deep-anchor /integrations#plus.',
      '/onboarding redesigned as Plus-tier preview — type a URL, watch a five-agent migration demo (DOM analyzer, brand extractor, product mapper, SEO generator, ACP deployer), join the waitlist.',
    ],
  },
  {
    version: '3.0.0',
    date: 'May 2026',
    title: 'Software 3.0: Vibe Templates & AI Localization',
    description: 'Our biggest update ever. We introduce Vibe Templates, allowing you to build and inject infinitely scalable layouts directly via Cursor or Vercel v0.',
    icon: <Sparkles className="w-5 h-5 text-cw-terracotta" />,
    features: [
      'Vibe API: Inject custom Tailwind HTML live from Cursor.',
      'Global Auto-Translation: Built-in Google Gemini Flash automatically translates Vibe designs globally while preserving code.',
      'Themes & AI Design dashboard in the admin panel.',
      'New Setup Wizard with email and Vercel domain flow.',
      'Setup wizard at /admin/setup walks brand → theme → API keys → first category → completion. Every key round-trip-validated before save.',
      'Stripe Elements wired with appearance block driven by brand.config.ts — Payment Element + webhooks + mock fallback for local-dev work without real Stripe traffic.',
      'Vercel domain flow integrated into the setup wizard — pick a domain, Cartwright prints the DNS records, polls until verified.',
    ],
  },
  {
    version: '2.5.0',
    date: 'April 2026',
    title: 'Local AI & Agentic Commerce',
    description: 'Make the platform independent with local AI via Ollama, and make your product catalog machine-readable with the Agentic Commerce Protocol (ACP).',
    icon: <Terminal className="w-5 h-5 text-cw-oker" />,
    features: [
      'Gemma 4 integration via Ollama for free on-device inference.',
      'MCP (Model Context Protocol) Server endpoints enabled out-of-the-box.',
      'llms.txt generation for AI search engines (Perplexity, OpenAI).',
      'Phone.inc Cloud telephony integration directly in the browser.',
      'Anthropic SDK + Gemini SDK both wired via the Vercel AI SDK — same chatModel() accessor, swap providers with one field in IntegrationSettings.',
      'i18nexus cloud strings for storefront copy translation — no manual locale-JSON management.',
      'DB-first secret storage via lib/secret-encryption.ts (AES-256-GCM): paste a key in /admin/integrations, no .env edit, no redeploy.',
    ],
  },
  {
    version: '2.0.0',
    date: 'March 2026',
    title: 'The Golden Stack & Multi-Tenant Architecture',
    description: 'A complete rewrite of the core engine to run B2B SaaS and Webshops on the exact same platform without compromises.',
    icon: <Globe className="w-5 h-5 text-blue-500" />,
    features: [
      'Next.js 16 and React 19 foundation for extreme speed.',
      'i18nexus cloud integration for standard texts.',
      'Dark Mode SaaS support out-of-the-box.',
      'Stripe Checkout B2B subscriptions added.',
      'Turso (libSQL) as the default database — point-in-time restore, edge-replicated, managed SQLite that survives a Vercel function cold start in under 50ms.',
      'Sentry error tracking + performance traces wired with build-time source-map upload via SENTRY_AUTH_TOKEN.',
      'Upstash Redis for lib/rate-limit.ts — per-IP and per-API-key throttling without standing up your own Redis.',
      'Custom domain on Vercel: /admin/setup walkthrough prints the exact A/CNAME records, then verifies Resend SPF/DKIM/DMARC on the same domain so transactional email is deliverable from go-live day.',
    ],
  },
  {
    version: '1.0.0',
    date: 'January 2026',
    title: 'Initial Release: Cartwright Engine',
    description: 'The first version of our vision for a self-custody e-commerce platform.',
    icon: <Code2 className="w-5 h-5 text-cw-stone-400" />,
    features: [
      'Prisma DB schema and basic CRUD for products and pages.',
      'Admin panel with Stripe Webhooks.',
      'Vercel Edge Network optimizations.',
      'NextAuth magic-link sign-in via Resend transactional templates — no third-party identity vendor lock-in from day one.',
      'Resend wired for order confirmation + magic-link emails, with a .mail-previews/ dev fallback so local development never burns email credits.',
      'Vercel Blob image uploads with signed URLs and per-product image variants — no S3 bucket setup, no CloudFront config.',
      'One-click Vercel deploy with the storefront + admin compiled as a single Next.js app — no separate dashboard hosting.',
    ],
  },
];

export default async function ChangelogPage() {
  // Live engine version, read from the engine CHANGELOG (lib/engine.ts) — never stale.
  const engineVersion = await getEngineVersion();
  return (
    <HomeLayout {...baseOptions()}>
      <main className="mx-auto max-w-4xl px-6 py-24 bg-cw-paper dark:bg-cw-ink">
        <header className="mb-20 text-center">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-cw-terracotta mb-4">
            Updates & Releases
          </p>
          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter mb-6 leading-tight text-cw-stone-900 dark:text-cw-stone-50">
            Changelog
          </h1>
          <p className="text-xl text-cw-stone-600 dark:text-cw-stone-400 max-w-2xl mx-auto font-light">
            Follow along as we continuously build the future of Software 3.0 commerce.
          </p>
          <p className="mt-6 text-sm text-cw-stone-500 dark:text-cw-stone-400">
            Current engine release:{' '}
            <span className="font-mono font-bold text-cw-stone-700 dark:text-cw-stone-200">
              v{engineVersion}
            </span>{' '}
            · <code className="font-mono">npx create-cartwright</code>
          </p>
        </header>

        {/* Security/maintenance foundation. Shipped in the v0.23.0 tag — kept as a
            standalone note (rather than folded into a version entry) because it
            describes an ongoing mechanism, not a one-off feature. */}
        <div className="mb-16 rounded-2xl border border-cw-stone-200 dark:border-cw-stone-800 bg-cw-stone-50 dark:bg-[#111] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-white dark:bg-white/5 border border-cw-stone-200 dark:border-white/10 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-cw-terracotta" />
            </div>
            <h2 className="text-2xl font-bold text-cw-stone-900 dark:text-cw-stone-50">
              Every shop knows its engine version
            </h2>
            <span className="ml-auto text-xs font-mono font-semibold uppercase tracking-wider text-cw-terracotta">
              v0.23.0
            </span>
          </div>
          <p className="text-cw-stone-600 dark:text-cw-stone-300 text-lg leading-relaxed font-light">
            Every Cartwright shop now ships a{' '}
            <code className="font-mono text-cw-stone-700 dark:text-cw-stone-200">.cartwright/release.json</code>{' '}
            marker recording the exact engine version it was scaffolded from — auto-stamped at release, so it
            never drifts. Paired with a published{' '}
            <strong className="font-semibold text-cw-stone-700 dark:text-cw-stone-200">security advisories</strong>{' '}
            index in the engine changelog, a known fix can always be matched to the shops that need it — even
            though you own the code and nothing auto-updates it. Live as of v0.23.0.
          </p>
        </div>

        <div className="space-y-16">
          {RELEASES.map((release, index) => (
            <article key={release.version} className="relative grid grid-cols-1 md:grid-cols-[1fr_3fr] gap-8 md:gap-12">
              {/* Timeline dot & line - hidden on mobile */}
              {index !== RELEASES.length - 1 && (
                <div className="hidden md:block absolute left-[calc(25%-1.5rem)] top-12 bottom-[-4rem] w-px bg-cw-stone-200 dark:bg-cw-stone-800" />
              )}
              
              {/* Meta information */}
              <div className="md:text-right pt-2 relative">
                <div className="hidden md:flex absolute right-[-2.25rem] top-2.5 w-6 h-6 rounded-full border-4 border-cw-paper dark:border-cw-ink bg-cw-stone-100 dark:bg-cw-stone-800 items-center justify-center z-10">
                  <div className="w-2 h-2 rounded-full bg-cw-stone-400" />
                </div>
                <h3 className="text-2xl font-black text-cw-stone-900 dark:text-cw-stone-50 mb-1">v{release.version}</h3>
                <time className="text-sm text-cw-stone-500 uppercase tracking-wider font-semibold">{release.date}</time>
              </div>

              {/* Content */}
              <div className="bg-cw-stone-50 dark:bg-[#111] border border-cw-stone-200 dark:border-cw-stone-800 rounded-2xl p-8 hover:border-cw-stone-300 dark:hover:border-cw-stone-700 transition-all shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white dark:bg-white/5 border border-cw-stone-200 dark:border-white/10 shadow-sm">
                    {release.icon}
                  </div>
                  <h2 className="text-2xl font-bold text-cw-stone-900 dark:text-cw-stone-50">{release.title}</h2>
                </div>
                
                <p className="text-cw-stone-600 dark:text-cw-stone-300 text-lg leading-relaxed mb-6 font-light">
                  {release.description}
                </p>

                <div className="space-y-3">
                  {release.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3 text-cw-stone-600 dark:text-cw-stone-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-cw-terracotta mt-2.5 shrink-0" />
                      <span className="leading-relaxed">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </HomeLayout>
  );
}
