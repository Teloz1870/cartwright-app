import Link from 'next/link';
import { Section, SectionHeader } from '@/components/landing/section';

const features = [
  {
    title: 'Admin panel',
    body: '12 admin routes — products, orders, content, integrations, AI prompts, analytics.',
  },
  {
    title: 'Customer storefront',
    body: '11 customer routes — landing, PDP, cart, checkout, account, magic-link auth.',
  },
  {
    title: 'MCP server',
    body: 'Built-in /api/mcp with a tool registry — agents talk to your shop natively.',
  },
  {
    title: 'AI assistant',
    body: 'Anthropic and Gemini wired in. Bring your keys, swap providers in one file.',
  },
  {
    title: 'Stripe checkout',
    body: 'DB-first secret keys. Test mode and live mode toggled from the admin.',
  },
  {
    title: 'Magic-link auth',
    body: 'NextAuth with Resend. No third-party identity vendor lock-in.',
  },
  {
    title: 'Image uploads',
    body: 'Vercel Blob, signed URLs, image variants. Drop-in, no S3 buckets.',
  },
  {
    title: 'SEO automation',
    body: 'sitemap.xml, robots.txt, OG-images via Satori, JSON-LD, and /llms.txt for LLM crawlers.',
  },
  {
    title: 'Email via Resend',
    body: 'Receipts, magic-link, order updates — pre-built templates you can edit.',
  },
  {
    title: 'Sentry-ready',
    body: 'Error tracking + performance traces wired with sourcemap upload.',
  },
  {
    title: 'Brand config',
    body: 'brand.config.ts is the single source of truth: colors, copy, policies.',
  },
  {
    title: 'Industry templates',
    body: 'Five templates: website-corporate, coffee, sunglasses, agent-marketplace, generic. `--template <slug>` patches brand.mode + features.',
  },
  {
    title: 'A2A endpoints',
    body: 'GET /api/agent-card, POST /api/negotiate, POST /api/escrow/verify — buyer agents discover, negotiate, settle without a browser.',
  },
  {
    title: 'Anchor-Resume engine',
    body: 'Deterministic negotiation kernel in pure TS — never an LLM, monotonicity-guaranteed, 800+ property tests per CI run.',
  },
  {
    title: 'Guardian middleware',
    body: 'Adjudication branch + P2K scanner. Every agentic call validates against shop legislation before money or escrow state moves.',
  },
  {
    title: 'Headless Merchant mode',
    body: 'brand.mode = "agent-marketplace" ships an A2A-only shop — no GUI, just signed Agent Card + 5 ACP endpoints + admin.',
  },
  {
    title: 'Agentic dashboard',
    body: '/admin/agentic shows live A-JWT verifications, escrow positions, disputed-escrow review queue. Read-only first; write-side incoming.',
  },
  {
    title: 'ACP endpoints',
    body: '/api/acp/feed + /api/acp/v1/checkout_sessions — stateless agentic checkout per the Agentic Commerce Protocol spec. ChatGPT Instant Checkout-compatible.',
  },
  {
    title: 'Vibe Coding',
    body: 'Software 3.0 page builder: external AI tools (Cursor, v0, Lovable) push raw Tailwind HTML to /api/admin/vibe/push; Gemini auto-translates.',
  },
  {
    title: 'Setup wizard',
    body: '/admin/setup walks through brand, theme, API keys, first category. DB-first secrets — no env file editing required.',
  },
  {
    title: 'Video generation',
    body: 'Luma Dream Machine wired into /admin/generate-video. Cinematic 5-sec product showcases without leaving the admin.',
  },
  {
    title: 'Local AI / Ollama',
    body: 'IntegrationSettings.aiProvider toggles cloud Anthropic vs local Ollama. Same Guardian + audit log either way.',
  },
  {
    title: 'Audit + revert',
    body: '/admin/audit shows every tool call with before/after snapshots. One-click undo on revertible operations.',
  },
  {
    title: 'Phone.inc telephony',
    body: 'IVR + voicemail + transcription scaffolded at /admin/telefon. (Phone.inc API spec evolving — current integration is preview.)',
  },
  {
    title: 'Resolvable Genome',
    body: 'Copy fields resolve from override ?? cache ?? brand anchor, harmonised to your identity. Respawn a shop’s whole voice from a sentence. /admin/genome.',
  },
  {
    title: 'SEO/GEO Autopilot',
    body: 'Measures search (GSC) + AI-citation share, then runs self-improving experiments — apply, measure, keep or revert. Pro feature.',
  },
  {
    title: 'Hoptify',
    body: 'A tongue-in-cheek Shopify pendant: familiar storefront design + a parody “import from Shopify” onboarding that genuinely brings your look + products across.',
  },
  {
    title: 'Logo generator',
    body: 'Generate a real raster logo from a prompt (gemini-2.5-flash-image), upload to Blob, set as your brand mark — in one step.',
  },
  {
    title: 'Design import',
    body: 'Pull a colour palette from any URL (Firecrawl + AI) into a live theme in ~2 minutes. /admin/design-import.',
  },
  {
    title: 'Firecrawl scraper',
    body: 'Scrape product data from a URL into a structured product — the migration on-ramp behind design-import and Hoptify.',
  },
  {
    title: 'Blog',
    body: '/blog + RSS + BlogPosting JSON-LD + sitemap, edited from the admin. Content marketing without a second CMS.',
  },
  {
    title: 'Shipping & fulfillment',
    body: 'Zone/weight rates with delivery times + dropship-supplier routing — or a flat rate. /admin/shipping.',
  },
  {
    title: 'Tax / VAT',
    body: 'Managed multi-country VAT via Stripe Tax (EU OSS, VAT-ID) with invoicing, or built-in single-rate. Correct at checkout either way.',
  },
  {
    title: 'WooCommerce parity',
    body: 'Wishlist, abandoned-cart recovery, admin redirects, product CSV import/export, translation management — the migration toolkit.',
  },
  {
    title: 'GDPR / DSAR',
    body: 'Data-subject export + soft-erasure, retention crons, processor register at /admin/processors. Compliance built in, not bolted on.',
  },
  {
    title: 'Backup + indexing controls',
    body: 'Automated DB backup cron, plus per-shop noindex + AI-crawler allow/block toggles wired into robots.txt and meta robots.',
  },
];

export function FeatureGrid() {
  return (
    <Section>
      <SectionHeader
        eyebrow="What's in the box"
        title="A real shop, not a starter kit."
        description="Every box below is shipping code — wired, typed, and verified. Not a marketing page promise."
      />
      <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-cw-stone-200 dark:border-cw-stone-800 bg-cw-stone-200 dark:bg-cw-stone-800 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="bg-cw-paper dark:bg-cw-stone-900/40 p-6 transition-colors hover:bg-cw-stone-50 dark:hover:bg-cw-stone-900"
          >
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-cw-terracotta" />
              <h3 className="text-sm font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
                {f.title}
              </h3>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-cw-stone-500 dark:text-cw-stone-400">
              {f.body}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-6 max-w-2xl text-sm text-cw-stone-500 dark:text-cw-stone-400">
        Want the integration-by-integration story instead — Stripe, Resend, Vercel, Turso, Sentry, the AI providers, all wired?{' '}
        <Link
          href="/integrations"
          className="font-medium text-cw-terracotta hover:underline"
        >
          See what's in the box →
        </Link>
      </p>
    </Section>
  );
}
