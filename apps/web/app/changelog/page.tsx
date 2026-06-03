import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import type { Metadata } from 'next';
import { Sparkles, Terminal, Globe, Code2, ShieldCheck, Mic, Palette, Package, Pencil } from 'lucide-react';
import { getEngineVersion } from '@/lib/engine';

export const metadata: Metadata = {
  title: 'Changelog',
  description: 'Release history of the Cartwright template.',
};

const RELEASES = [
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
      'SEO/GEO Autopilot (seoAutopilot, ⭐ Pro) — measures search performance (GSC) + AI-citation share, then runs self-improving genome experiments: apply → measure → keep or revert. /admin/seo-performance.',
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
      '/integrations top-nav page launched — 15 core service integrations + 10 Plus-tier MCP integrations (Klaviyo, Mailchimp, QuickBooks, Notion, Airtable, HubSpot, Slack, Zapier, ShipStation, Algolia) with real brand logos, category eyebrows, and deep-anchor /integrations#plus.',
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
