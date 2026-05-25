import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import type { Metadata } from 'next';
import { Sparkles, Terminal, Globe, Code2, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Changelog',
  description: 'Release history of the Cartwright template.',
};

const RELEASES = [
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

export default function ChangelogPage() {
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
