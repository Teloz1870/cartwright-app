import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { CopyCommand } from '@/components/landing/copy-command';
import { BrandLogo, type BrandSlug } from '@/components/landing/brand-logo';

export const metadata = {
  title: 'Integrations',
  description:
    'Every integration that ships pre-wired with Cartwright — Stripe, Vercel, Resend, Turso, Anthropic, Sentry, and a dozen more. Real logos. Real SDK calls. Production-ready.',
};

type Featured = {
  brand: BrandSlug;
  name: string;
  category: string;
  pitch: string;
  bullets: string[];
  brandUrl: string;
  docsHref: string;
};

const featured: Featured[] = [
  {
    brand: 'stripe',
    name: 'Stripe',
    category: 'Payments',
    pitch: 'Payment Element, webhooks, idempotency keys — checkout that survives every retry.',
    bullets: [
      'Stripe Elements (Payment Element) wired in your storefront',
      'Webhook signature verification + idempotency at /api/stripe/webhook',
      'Mock-mode fallback for local dev — no real traffic, realistic flows',
    ],
    brandUrl: 'https://stripe.com',
    docsHref: '/docs/features/checkout-stripe',
  },
  {
    brand: 'vercel',
    name: 'Vercel',
    category: 'Hosting + Blob',
    pitch: 'One Next.js app, one deploy. Custom domain, preview branches, Blob storage included.',
    bullets: [
      'Storefront + admin + agent endpoints in one Vercel project',
      'Custom domain DNS + verification wired into /admin/setup',
      'Vercel Blob for product images, signed URLs, /next/image variants',
    ],
    brandUrl: 'https://vercel.com',
    docsHref: '/docs/deployment/vercel',
  },
  {
    brand: 'resend',
    name: 'Resend',
    category: 'Email',
    pitch: 'Transactional email + magic-link templates. SPF/DKIM/DMARC verified in the setup wizard.',
    bullets: [
      'Order confirmation + shipping update + magic-link templates',
      '.mail-previews/ dev fallback — no credits burned locally',
      'Domain auth (SPF/DKIM/DMARC) verified via setup wizard',
    ],
    brandUrl: 'https://resend.com',
    docsHref: '/docs/features/email-resend',
  },
  {
    brand: 'turso',
    name: 'Turso',
    category: 'Database',
    pitch: 'Managed libSQL. Edge-replicated. Point-in-time restore. Two env vars to wire.',
    bullets: [
      'Prisma libSQL adapter — schema + migrations look standard',
      'Sub-50ms reads from a Vercel function cold start',
      'Local dev falls back to file-based SQLite (dev.db)',
    ],
    brandUrl: 'https://turso.tech',
    docsHref: '/docs/deployment/turso',
  },
  {
    brand: 'anthropic',
    name: 'Anthropic',
    category: 'AI provider',
    pitch: 'Claude Haiku 4.5 default for storefront chat. Swap to Sonnet/Opus per workload.',
    bullets: [
      'lib/ai/client.ts:chatModel() is the single accessor',
      'Tool-orchestration + storefront chat use the same model registry',
      'Provider toggle is one field — Anthropic ↔ Ollama, no redeploy',
    ],
    brandUrl: 'https://www.anthropic.com',
    docsHref: '/docs/features/ai-assistant',
  },
  {
    brand: 'sentry',
    name: 'Sentry',
    category: 'Observability',
    pitch: 'Errors + performance + session replay. Source maps uploaded on every build.',
    bullets: [
      'Build-time source-map upload via SENTRY_AUTH_TOKEN',
      'Server + client wrapped; React error boundary integrates with replay',
      'Cost-control sampling (tracesSampleRate: 0.1) tuned for production',
    ],
    brandUrl: 'https://sentry.io',
    docsHref: '/docs/configuration/env-vars',
  },
];

type Secondary = {
  brand: BrandSlug;
  name: string;
  category: string;
  pitch: string;
  brandUrl: string;
  docsHref?: string;
  preview?: boolean;
};

const secondary: Secondary[] = [
  {
    brand: 'nextauth',
    name: 'Auth.js',
    category: 'Authentication',
    pitch: 'Magic-link sign-in via NextAuth + Resend. No password store, no vendor lock-in.',
    brandUrl: 'https://authjs.dev',
    docsHref: '/docs/features/auth-magiclink',
  },
  {
    brand: 'upstash',
    name: 'Upstash',
    category: 'Rate limiting',
    pitch: 'Redis-backed throttling for storefront chat, agent endpoints, admin writes.',
    brandUrl: 'https://upstash.com',
    docsHref: '/docs/features/api-rate-limiting',
  },
  {
    brand: 'i18nexus',
    name: 'i18nexus',
    category: 'i18n',
    pitch: 'Cloud strings for storefront copy. No locale-JSON file management.',
    brandUrl: 'https://i18nexus.com',
  },
  {
    brand: 'gemini',
    name: 'Google Gemini',
    category: 'AI provider',
    pitch: 'Image-aware tasks: palette extraction, Vibe translation, reference composition.',
    brandUrl: 'https://ai.google.dev',
    docsHref: '/docs/features/vibe-coding',
  },
  {
    brand: 'ollama',
    name: 'Ollama',
    category: 'Local AI',
    pitch: 'On-device alternative to cloud Anthropic. Same chatModel(), one field toggle.',
    brandUrl: 'https://ollama.com',
    docsHref: '/docs/features/local-ai-ollama',
  },
  {
    brand: 'mcp',
    name: 'Model Context Protocol',
    category: 'Agent surface',
    pitch: 'Built-in MCP server at /api/mcp. External agents discover and call your shop natively.',
    brandUrl: 'https://modelcontextprotocol.io',
    docsHref: '/docs/architecture/mcp-server',
  },
  {
    brand: 'phone-inc',
    name: 'Phone.inc',
    category: 'Telephony',
    pitch: 'IVR, voicemail transcription, call routing scaffolded at /admin/telefon.',
    brandUrl: 'https://phone.inc',
    docsHref: '/docs/features/phone-inc-telephony',
    preview: true,
  },
  {
    brand: 'luma',
    name: 'Luma Dream Machine',
    category: 'Video generation',
    pitch: 'Cinematic 5-sec product loops generated from /admin/generate-video.',
    brandUrl: 'https://lumalabs.ai',
    docsHref: '/docs/features/video-generation',
  },
  {
    brand: 'unsplash',
    name: 'Unsplash',
    category: 'Image library',
    pitch: 'Hero image search from inside the admin theme generator.',
    brandUrl: 'https://unsplash.com',
  },
  {
    brand: 'firecrawl',
    name: 'Firecrawl',
    category: 'Web scraping',
    pitch: 'Scrape product data + brand palette from any URL — the engine behind design-import and the Hoptify "import from Shopify" onboarding.',
    brandUrl: 'https://firecrawl.dev',
  },
];

const foundationStack: { brand: BrandSlug; name: string }[] = [
  { brand: 'nextjs', name: 'Next.js 16' },
  { brand: 'react', name: 'React 19' },
  { brand: 'typescript', name: 'TypeScript' },
  { brand: 'tailwind', name: 'Tailwind v4' },
  { brand: 'prisma', name: 'Prisma' },
];

type PlusIntegration = {
  brand: BrandSlug;
  name: string;
  category: string;
  pitch: string;
};

const plusIntegrations: PlusIntegration[] = [
  {
    brand: 'klaviyo',
    name: 'Klaviyo',
    category: 'Email marketing',
    pitch: 'Trigger flows from cart and order events; sync customer segments back into your shop.',
  },
  {
    brand: 'mailchimp',
    name: 'Mailchimp',
    category: 'Email marketing',
    pitch: 'Push contacts and tag updates; pull campaign metrics back into the admin.',
  },
  {
    brand: 'quickbooks',
    name: 'QuickBooks',
    category: 'Accounting',
    pitch: 'Auto-create invoices for orders; sync customer and product records bi-directionally.',
  },
  {
    brand: 'notion',
    name: 'Notion',
    category: 'Knowledge',
    pitch: 'Mirror product docs and policies; the storefront AI cites them when answering customers.',
  },
  {
    brand: 'airtable',
    name: 'Airtable',
    category: 'Operations',
    pitch: 'Two-way sync inventory, suppliers, and returns into your existing Airtable bases.',
  },
  {
    brand: 'hubspot',
    name: 'HubSpot',
    category: 'CRM',
    pitch: 'Contacts and deals from Cartwright orders; the agent can update lifecycle stages.',
  },
  {
    brand: 'slack',
    name: 'Slack',
    category: 'Notifications',
    pitch: 'Real-time pings on new orders, low stock, and escrow disputes — routed by channel.',
  },
  {
    brand: 'zapier',
    name: 'Zapier',
    category: 'Meta-connector',
    pitch: 'Trigger any of 6 000+ Zapier apps from Cartwright events. Catch-all for the long tail.',
  },
  {
    brand: 'shipstation',
    name: 'ShipStation',
    category: 'Fulfillment',
    pitch: 'Auto-create labels and tracking on shipment; status writes back to Order rows.',
  },
  {
    brand: 'algolia',
    name: 'Algolia',
    category: 'Search',
    pitch: 'Instant product search wired to the storefront and agent-callable for typed queries.',
  },
];

const marqueeSlugs: BrandSlug[] = [
  'stripe', 'vercel', 'resend', 'turso', 'anthropic', 'sentry',
  'nextauth', 'upstash', 'i18nexus', 'gemini', 'ollama', 'mcp',
  'phone-inc', 'luma', 'unsplash',
];

export default function IntegrationsPage() {
  return (
    <main className="relative min-h-screen overflow-hidden pb-32">
      <div aria-hidden className="absolute inset-0 cw-grid-bg opacity-50" />

      <div className="relative mx-auto max-w-6xl px-6 pt-24 sm:pt-32">
        {/* Hero */}
        <div className="flex flex-col items-center text-center">
          <Badge tone="terracotta" className="mb-6">
            <span className="size-1.5 rounded-full bg-cw-terracotta" />
            Pre-wired
          </Badge>
          <h1 className="max-w-3xl text-4xl sm:text-5xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
            Sixteen integrations.{' '}
            <span className="relative inline-block text-cw-terracotta">
              <span className="relative z-10">Wired. Validated. Ready to take an order.</span>
              <span
                aria-hidden
                className="absolute inset-x-0 -bottom-1 h-3 bg-cw-terracotta/20 dark:bg-cw-terracotta/30 -z-0"
              />
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-base sm:text-lg text-cw-stone-500 dark:text-cw-stone-400">
            Paste a key in <span className="font-mono text-sm">/admin/setup</span> and the storefront is already calling the right SDK. No glue code, no SaaS lock-in. The CLI scaffolds the wiring; the wizard collects the keys; you go live in an afternoon.
          </p>
        </div>
      </div>

      {/* Marquee logo band — full-bleed */}
      <div className="relative mt-16 sm:mt-20 border-y border-cw-stone-200 dark:border-cw-stone-800 bg-cw-stone-50/40 dark:bg-cw-stone-900/40 py-10 overflow-hidden cw-marquee-mask">
        <div className="cw-marquee-track flex items-center gap-12 sm:gap-16">
          {[...marqueeSlugs, ...marqueeSlugs].map((slug, i) => (
            <BrandLogo key={`${slug}-${i}`} brand={slug} size={48} />
          ))}
        </div>
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Featured integrations */}
        <div className="mt-24 sm:mt-32">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-cw-terracotta">
              The heavyweights
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
              Six services that do the real work.
            </h2>
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-cw-stone-500 dark:text-cw-stone-400">
              Payments, hosting, email, database, AI, and observability — the things every shop needs, wired with idempotency, retries, and graceful local-dev fallbacks.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((item) => (
              <div
                key={item.brand}
                className="relative flex flex-col rounded-3xl border border-cw-stone-200 dark:border-cw-stone-800 bg-cw-stone-50/50 dark:bg-cw-stone-900/50 backdrop-blur-sm p-8 transition-all duration-300 hover:shadow-xl hover:border-cw-stone-300 dark:hover:border-cw-stone-700"
              >
                <div className="mb-5 flex items-center gap-4">
                  <BrandLogo brand={item.brand} size={56} />
                  <div>
                    <h3 className="text-lg font-semibold text-cw-stone-900 dark:text-cw-stone-50">
                      {item.name}
                    </h3>
                    <span className="text-xs font-mono uppercase tracking-wider text-cw-terracotta">
                      {item.category}
                    </span>
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-cw-stone-600 dark:text-cw-stone-300">
                  {item.pitch}
                </p>

                <ul className="mt-5 mb-6 flex-1 space-y-2.5 text-sm text-cw-stone-500 dark:text-cw-stone-400">
                  {item.bullets.map((b) => (
                    <li key={b} className="flex gap-2.5">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-cw-terracotta" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center gap-4 pt-4 border-t border-cw-stone-200 dark:border-cw-stone-800 text-xs font-medium">
                  <a
                    href={item.brandUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cw-terracotta hover:underline"
                  >
                    Visit {new URL(item.brandUrl).hostname.replace('www.', '')} →
                  </a>
                  <a
                    href={item.docsHref}
                    className="text-cw-stone-500 dark:text-cw-stone-400 hover:text-cw-stone-900 dark:hover:text-cw-stone-50"
                  >
                    Setup docs →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Secondary integrations */}
        <div className="mt-24 sm:mt-32">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-cw-terracotta">
              And another nine
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
              The supporting cast.
            </h2>
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-cw-stone-500 dark:text-cw-stone-400">
              Auth, i18n, rate limiting, local AI, telephony, video, image search — each wired the same way: paste a key, flip a flag, the surface is already there.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {secondary.map((item) => (
              <a
                key={item.brand}
                href={item.brandUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-2xl border border-cw-stone-200 dark:border-cw-stone-800 bg-cw-stone-50/30 dark:bg-cw-stone-900/30 p-5 transition-all hover:border-cw-stone-300 dark:hover:border-cw-stone-700 hover:bg-cw-stone-50/60 dark:hover:bg-cw-stone-900/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <BrandLogo brand={item.brand} size={36} />
                  {item.preview && (
                    <span className="rounded-full bg-cw-oker/15 text-cw-oker-strong dark:text-cw-oker px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                      Preview
                    </span>
                  )}
                </div>
                <h3 className="mt-4 text-sm font-semibold text-cw-stone-900 dark:text-cw-stone-50">
                  {item.name}
                </h3>
                <span className="text-[11px] font-mono uppercase tracking-wider text-cw-stone-500">
                  {item.category}
                </span>
                <p className="mt-2 text-sm leading-relaxed text-cw-stone-500 dark:text-cw-stone-400">
                  {item.pitch}
                </p>
                {item.docsHref && (
                  <span className="mt-3 text-xs font-medium text-cw-terracotta group-hover:underline">
                    Setup docs →
                  </span>
                )}
              </a>
            ))}
          </div>
        </div>

        {/* Coming with Plus — premium MCP integrations */}
        <div id="plus" className="mt-24 sm:mt-32 scroll-mt-24">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-cw-terracotta">
              Coming with Plus
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
              Premium MCP integrations.
            </h2>
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-cw-stone-500 dark:text-cw-stone-400">
              Tool-callable from the storefront AI and the admin. Plus tier ships these as MCP integrations so an agent can act on them without a single line of glue code.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {plusIntegrations.map((item) => (
              <div
                key={item.brand}
                className="flex flex-col rounded-2xl border border-cw-stone-200 dark:border-cw-stone-800 bg-cw-stone-50/30 dark:bg-cw-stone-900/30 p-5"
              >
                <BrandLogo brand={item.brand} size={36} />
                <h3 className="mt-4 text-sm font-semibold text-cw-stone-900 dark:text-cw-stone-50">
                  {item.name}
                </h3>
                <span className="text-[11px] font-mono uppercase tracking-wider text-cw-stone-500">
                  {item.category}
                </span>
                <p className="mt-2 text-sm leading-relaxed text-cw-stone-500 dark:text-cw-stone-400">
                  {item.pitch}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-cw-terracotta/30 bg-cw-terracotta/5 dark:bg-cw-terracotta/10 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-sm text-cw-stone-600 dark:text-cw-stone-300">
              These ship with the Plus tier — launching Q3 2026.
            </p>
            <a
              href="/pricing"
              className="text-sm font-medium text-cw-terracotta hover:underline"
            >
              Join the Plus waitlist →
            </a>
          </div>
        </div>

        {/* Foundation strip */}
        <div className="mt-20 sm:mt-24 rounded-2xl border border-cw-stone-200 dark:border-cw-stone-800 bg-cw-stone-50/40 dark:bg-cw-stone-900/40 px-6 py-6 sm:flex sm:items-center sm:justify-between gap-6">
          <p className="text-sm text-cw-stone-500 dark:text-cw-stone-400 max-w-md">
            <span className="font-medium text-cw-stone-900 dark:text-cw-stone-50">Underneath:</span>{' '}
            the npm foundation Cartwright is built on. Tracked upstream, upgraded for you.
          </p>
          <ul className="mt-4 sm:mt-0 flex flex-wrap items-center gap-x-5 gap-y-3">
            {foundationStack.map((dep) => (
              <li key={dep.brand} className="flex items-center gap-2 text-sm text-cw-stone-600 dark:text-cw-stone-300">
                <BrandLogo brand={dep.brand} size={22} />
                <span className="font-mono text-xs">{dep.name}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pricing tie-in */}
        <div className="mt-20 sm:mt-24 rounded-3xl border border-cw-terracotta/30 bg-cw-terracotta/5 dark:bg-cw-terracotta/10 p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8">
          <div className="flex-1">
            <h2 className="text-2xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
              All wired. Self-hosted at $0 per Cartwright.
            </h2>
            <p className="mt-2 text-sm text-cw-stone-500 dark:text-cw-stone-400 max-w-xl">
              The template is MIT and free, forever. You pay the underlying services (Vercel, Stripe processing, Turso, etc.) directly. Optional managed tiers start at $49/mo if you&apos;d rather have us run it.
            </p>
          </div>
          <ButtonLink href="/pricing" size="lg">
            See pricing →
          </ButtonLink>
        </div>

        {/* CTA footer */}
        <div className="mt-24 sm:mt-32 flex flex-col items-center text-center">
          <h2 className="max-w-2xl text-3xl sm:text-4xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
            Start with one command.
          </h2>
          <p className="mt-4 max-w-xl text-base text-cw-stone-500 dark:text-cw-stone-400">
            The CLI scaffolds the template with every integration above already wired. You bring the keys; the SDKs are already calling.
          </p>
          <div className="mt-8 w-full max-w-xl">
            <CopyCommand command="npx create-cartwright@latest my-shop" />
          </div>
          <div className="mt-6 flex gap-3">
            <ButtonLink href="/docs/getting-started/quick-start" size="lg">
              Read the docs
            </ButtonLink>
            <ButtonLink href="/docs/in-the-box" variant="outline" size="lg">
              Developer-tone deep dive
            </ButtonLink>
          </div>
        </div>
      </div>
    </main>
  );
}
