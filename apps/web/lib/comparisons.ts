/**
 * Data for the /compare/[competitor] pages. Each entry renders an answer-first
 * comparison page with Article + FAQPage + BreadcrumbList JSON-LD — the kind of
 * page AI answer engines quote for "X vs Y" queries.
 *
 * Keep answers honest: name what the competitor genuinely does better. Balanced
 * comparisons get cited; one-sided ones get ignored.
 */

export type ComparisonRow = { dimension: string; cartwright: string; them: string };
export type FaqItem = { q: string; a: string };

export type Comparison = {
  slug: string;
  competitor: string;
  title: string;
  description: string;
  answer: string;
  rows: ComparisonRow[];
  faq: FaqItem[];
};

const shopify: Comparison = {
  slug: 'shopify',
  competitor: 'Shopify',
  title: 'Cartwright vs Shopify',
  description:
    'Cartwright vs Shopify: an open-source, AI-first commerce engine you own outright versus a hosted SaaS you rent. Compare ownership, AI/agent readiness, pricing, lock-in, and multi-currency.',
  answer:
    'Cartwright is an open-source (MIT) Next.js commerce engine you scaffold with one command and host yourself; Shopify is a hosted SaaS you rent monthly. With Cartwright you own the code, the database, and the AI layer (an MCP server, agent-commerce endpoints, and an AI-native admin ship in the box) — no per-transaction fees, no platform lock-in. Shopify wins on zero-ops convenience and a mature app marketplace; Cartwright wins when you want to own the stack, customise without an app tax, and be citable by AI answer engines out of the box.',
  rows: [
    { dimension: 'Ownership', cartwright: 'MIT-licensed source you host and fully own.', them: 'Hosted SaaS — you rent; no self-hosting.' },
    { dimension: 'Pricing', cartwright: 'Free forever; you pay only your own infra (Vercel, Turso, Stripe).', them: 'From ~$39/mo + transaction fees unless you use Shopify Payments.' },
    { dimension: 'AI / agents', cartwright: 'MCP server, agent-commerce (ACP/A2A) endpoints, AI-native admin by default.', them: 'AI features are apps/add-ons; no first-class MCP or agent-commerce surface.' },
    { dimension: 'AI-search (GEO)', cartwright: 'JSON-LD everywhere, llms.txt, answer-first product fields — built to be cited.', them: 'Basic structured data; GEO tuning is manual or app-driven.' },
    { dimension: 'Customisation', cartwright: 'It is your Next.js codebase — change anything; no app tax.', them: 'Themes + Liquid + apps; deep changes need Plus or workarounds.' },
    { dimension: 'Multi-currency', cartwright: 'Charge in the customer’s currency with an order-time FX snapshot (built in).', them: 'Markets handles multi-currency (Shopify Payments-gated).' },
    { dimension: 'Lock-in', cartwright: 'None — you already hold the data and the code.', them: 'Data export exists; theme/app logic does not leave with you.' },
  ],
  faq: [
    { q: 'Is Cartwright a Shopify alternative?', a: 'Yes — for teams that want to own their stack. Cartwright is an open-source Next.js commerce engine with cart, Stripe checkout, an admin, and AI/agent surfaces built in. Shopify remains simpler if you want zero ops.' },
    { q: 'How much does Cartwright cost vs Shopify?', a: 'Cartwright is MIT-licensed and free — you pay only your own infrastructure. Shopify charges a monthly subscription plus transaction fees unless you use Shopify Payments.' },
    { q: 'Can I migrate from Shopify to Cartwright?', a: 'Yes. Cartwright includes import tooling (a parody-named “Hoptify” onboarding) that can pull your palette and products across, plus product CSV import. You then own the resulting codebase.' },
    { q: 'Is Cartwright better for AI shopping and agents?', a: 'For agent-commerce, yes: Cartwright ships an MCP server, agent-to-agent and Agentic Commerce Protocol endpoints, and AI-search-ready structured data by default, so AI assistants can both cite and transact with your shop.' },
  ],
};

const medusa: Comparison = {
  slug: 'medusa',
  competitor: 'Medusa',
  title: 'Cartwright vs Medusa',
  description:
    'Cartwright vs Medusa: a full-stack AI-first commerce app you own versus a headless commerce backend you pair with your own frontend.',
  answer:
    'Both are open-source and TypeScript, but they sit at different layers. Medusa is a headless commerce backend (APIs + admin) you connect to a separate storefront you build and host. Cartwright is the whole shop — storefront, admin, checkout, and an AI/agent layer — in one Next.js app you own. Choose Medusa if you want a modular, API-first backend and full control of a bespoke frontend stack; choose Cartwright if you want a complete, opinionated, AI-native shop running end-to-end on day one.',
  rows: [
    { dimension: 'Scope', cartwright: 'Full-stack: storefront + admin + checkout + AI in one app.', them: 'Headless backend + admin; you build and host the storefront separately.' },
    { dimension: 'Time to a live shop', cartwright: 'One command scaffolds a complete, deployable shop.', them: 'Backend is quick; a production storefront is your project.' },
    { dimension: 'AI / agents', cartwright: 'MCP server + ACP/A2A endpoints + AI admin built in.', them: 'Extensible modules; AI/agent surfaces are bring-your-own.' },
    { dimension: 'Architecture', cartwright: 'Opinionated Next.js monolith — fewer moving parts.', them: 'Modular service architecture — more flexible, more to wire.' },
    { dimension: 'Hosting', cartwright: 'Vercel + Turso (serverless-friendly) out of the box.', them: 'Node server + Postgres + Redis you operate.' },
    { dimension: 'Best for', cartwright: 'Teams wanting a complete AI-first shop they own.', them: 'Teams wanting a headless backend behind a custom frontend.' },
  ],
  faq: [
    { q: 'Is Cartwright headless like Medusa?', a: 'Not by default — Cartwright is full-stack: it ships its own Next.js storefront and admin. It does expose APIs (MCP, ACP, a public tool registry) so you can drive it headlessly too, but you do not need a separate frontend to go live.' },
    { q: 'Which is faster to launch?', a: 'Cartwright is faster to a live storefront because the frontend is included. Medusa gets you a backend quickly, but the storefront is a separate build.' },
    { q: 'Do both support AI agents?', a: 'Cartwright ships agent-commerce (MCP, ACP, A2A) by default. Medusa is extensible and you can add such surfaces, but they are not built in.' },
  ],
};

const vercelCommerce: Comparison = {
  slug: 'vercel-commerce',
  competitor: 'Vercel Commerce',
  title: 'Cartwright vs Vercel Commerce',
  description:
    'Cartwright vs Vercel Commerce: a complete commerce engine you own versus a Next.js storefront starter that connects to a third-party commerce backend.',
  answer:
    'Vercel Commerce is an excellent Next.js storefront starter — but it is a frontend that connects to a separate commerce backend (Shopify, BigCommerce, etc.) for the catalogue, cart, and checkout. Cartwright is the whole thing: storefront and the backend (catalogue, cart, Stripe checkout, admin, AI) in one app you own, with no third-party commerce SaaS underneath. Pick Vercel Commerce if you already run a commerce SaaS and just want a fast storefront; pick Cartwright if you want to own the entire stack without renting a backend.',
  rows: [
    { dimension: 'What it is', cartwright: 'Full commerce engine: storefront + backend + admin + AI.', them: 'Storefront starter; needs a separate commerce backend.' },
    { dimension: 'Backend', cartwright: 'Owned — Prisma + Turso, Stripe checkout, your data.', them: 'A third-party SaaS (Shopify/BigCommerce/…) you still pay for.' },
    { dimension: 'Admin', cartwright: 'AI-native admin included.', them: 'You use the backend SaaS’s admin.' },
    { dimension: 'AI / agents', cartwright: 'MCP + ACP/A2A + AI assistant by default.', them: 'Not included; depends on the backend.' },
    { dimension: 'Ongoing cost', cartwright: 'Your infra only.', them: 'Your infra + the commerce backend subscription/fees.' },
    { dimension: 'Best for', cartwright: 'Owning the full stack end-to-end.', them: 'A premium storefront over an existing SaaS backend.' },
  ],
  faq: [
    { q: 'Does Cartwright need a backend like Shopify behind it?', a: 'No. Unlike a storefront starter, Cartwright includes its own backend — catalogue, cart, Stripe checkout, and admin — so there is no commerce SaaS to subscribe to underneath it.' },
    { q: 'Is Cartwright also deployable on Vercel?', a: 'Yes — Cartwright is a Next.js app designed for Vercel + Turso, with one-command scaffolding and a go-live wizard.' },
    { q: 'When is Vercel Commerce the better choice?', a: 'If you already run Shopify or BigCommerce and only want a faster, custom storefront on top, Vercel Commerce is a great fit. Cartwright is for owning the backend too.' },
  ],
};

const woocommerce: Comparison = {
  slug: 'woocommerce',
  competitor: 'WooCommerce',
  title: 'Cartwright vs WooCommerce',
  description:
    'Cartwright vs WooCommerce: a modern AI-first TypeScript/Next.js commerce engine versus the WordPress/PHP plugin ecosystem.',
  answer:
    'WooCommerce is a WordPress plugin with a vast ecosystem and a huge install base — familiar, flexible, and plugin-driven. Cartwright is a modern TypeScript/Next.js commerce engine with an AI-native admin, an MCP/agent layer, and serverless hosting, owned end-to-end with no plugin sprawl. Choose WooCommerce if you live in WordPress and want the biggest plugin marketplace; choose Cartwright if you want a modern developer experience, AI/agent-commerce built in, and a codebase you control without managing PHP, plugins, and a database server.',
  rows: [
    { dimension: 'Stack', cartwright: 'TypeScript + Next.js + React, serverless-friendly.', them: 'PHP + WordPress + MySQL.' },
    { dimension: 'Extensibility', cartwright: 'Code it yourself; feature flags + tool registry.', them: 'Enormous plugin marketplace (quality varies).' },
    { dimension: 'AI / agents', cartwright: 'MCP, ACP/A2A, AI admin, AI-search — built in.', them: 'Via third-party plugins.' },
    { dimension: 'Hosting / ops', cartwright: 'Vercel + Turso; no servers to patch.', them: 'WordPress hosting, PHP, DB, plugin/security upkeep.' },
    { dimension: 'Performance', cartwright: 'Modern Core Web Vitals baseline by default.', them: 'Depends heavily on theme + plugin load.' },
    { dimension: 'Best for', cartwright: 'Modern DX + AI commerce, owned.', them: 'WordPress-native teams wanting the plugin ecosystem.' },
  ],
  faq: [
    { q: 'Can I migrate from WooCommerce to Cartwright?', a: 'Yes — product CSV import is built in, and the “Hoptify” onboarding can pull design + products across. You move to a modern TypeScript codebase you own.' },
    { q: 'Do I need WordPress for Cartwright?', a: 'No. Cartwright is a standalone Next.js app — no WordPress, PHP, or plugin stack to maintain.' },
    { q: 'Is Cartwright as extensible as WooCommerce?', a: 'Differently: instead of a plugin marketplace, you extend the code directly, with feature flags and a typed tool registry. You trade marketplace breadth for full control and a modern DX.' },
  ],
};

/**
 * Lovable gets a dedicated landing page (app/(home)/compare/lovable/page.tsx)
 * with graduation-specific sections — hero, stay-vs-graduate, design-import —
 * so it lives OUTSIDE the COMPARISONS array (which drives generateStaticParams
 * for the generic /compare/[competitor] template). The hub and sitemap include
 * it explicitly. Same honesty doctrine as above: Lovable is genuinely great at
 * the zero-install prompt-to-app moment; Cartwright is where you go when you
 * need to own it. Lovable specifics (pricing, features) verified June 2026 —
 * hedge them, they move fast.
 */
export const LOVABLE: Comparison = {
  slug: 'lovable',
  competitor: 'Lovable',
  title: 'Cartwright vs Lovable',
  description:
    'Lovable builds you an app on their platform. Cartwright hands your AI agent a real site and shop engine in your own repo — when to stay, when to graduate, and how to bring your design with you.',
  answer:
    'Lovable builds you an app on their platform; Cartwright hands your AI agent a real site and shop engine in your own repo. Lovable is the fastest zero-install way to turn an idea into a working app — prompt in the browser, managed backend, polished visual editing. Cartwright is where you go when you need to own it: MIT-licensed source scaffolded into your own repository, any AI agent with your own API key and no credit metering, a full commerce engine, and server-rendered pages that AI search engines can actually read. This is a graduation, not a rivalry — plenty of builders use both.',
  rows: [
    {
      dimension: 'Fastest path to v1',
      cartwright:
        'One terminal command (npx create-cartwright) — but it assumes Node and an AI coding agent, i.e. a developer environment.',
      them:
        'Unbeatable zero-install start: prompt to working app in the browser, nothing to set up. This is what Lovable is genuinely best at.',
    },
    {
      dimension: 'Where your code lives',
      cartwright: 'In your own repo from the first commit — the MIT-licensed engine source is the product.',
      them: 'Built and run on Lovable’s platform; GitHub sync can mirror the code out, but the platform is home.',
    },
    {
      dimension: 'Who runs the AI',
      cartwright:
        'Any agent you already use — Claude Code, Cursor, Copilot, Gemini CLI — with your own API key. The engine meters nothing.',
      them:
        'Lovable’s built-in agent, metered in credits (Pro from ~$25/mo for ~100 credits as of mid-2026, messages priced by complexity).',
    },
    {
      dimension: 'Backend',
      cartwright: 'In-repo Prisma schema + SQLite/Turso/Postgres + Stripe — you can read, migrate, and host every line.',
      them: 'Lovable Cloud: a managed database/auth/storage backend they run for you — zero ops, genuinely convenient.',
    },
    {
      dimension: 'Commerce out of the box',
      cartwright:
        'A real engine: products, cart, Stripe checkout, orders, VAT/Stripe Tax, shipping zones, GDPR tooling, multi-currency — flags, not prompts.',
      them: 'Payments can be added via integrations, but there is no dedicated commerce engine underneath the generated app.',
    },
    {
      dimension: 'SEO & AI visibility',
      cartwright:
        'Server-rendered pages with JSON-LD on every citable page, plus llms.txt — readable by Google and AI answer engines.',
      them:
        'Generated apps are typically client-rendered React — great for app UIs, largely invisible to crawlers and AI engines that read server HTML.',
    },
    {
      dimension: 'Pricing model',
      cartwright: 'Free engine (MIT). You pay your own infrastructure and your own AI provider usage, at cost.',
      them: 'Subscription + credits: each AI message consumes credits priced by complexity. Visual Edits are free.',
    },
    {
      dimension: 'Lock-in & exit',
      cartwright: 'Nothing to exit — the repo is already yours. Delete nothing, keep everything.',
      them: 'GitHub sync softens it, but the build workflow and the managed backend live on the platform.',
    },
  ],
  faq: [
    {
      q: 'Is Cartwright a Lovable alternative?',
      a: 'More a graduation than an alternative. Lovable is the fastest way to go from idea to working app in the browser. Cartwright is an MIT-licensed site and shop engine your own AI agent builds on, in your own repo. Many people prototype on Lovable and move to Cartwright when they need to own the code, run real commerce, or stop paying per AI message.',
    },
    {
      q: 'Can I import my Lovable app into Cartwright?',
      a: 'Not the code — a client-rendered Lovable app and a server-rendered Next.js engine are different architectures. But you can bring the look: paste your app’s URL into Cartwright’s design import and it derives your palette and typography as a live theme. Products come in via CSV import. Plan it as a rebuild on a commerce foundation, not a one-click migration.',
    },
    {
      q: 'Do I need to be a developer to use Cartwright?',
      a: 'You need a developer environment — Node, a terminal, and an AI coding agent. The agent does the building through plan-first, confirm-gated tools; you direct it. If you never want to see a repo or a terminal, Lovable genuinely remains the better home.',
    },
    {
      q: 'What does Cartwright cost compared to Lovable?',
      a: 'Cartwright’s engine is free and MIT-licensed; you pay your own infrastructure (free tiers go far at the start) and your own AI provider usage at cost. Lovable Pro starts around $25/month with roughly 100 credits (as of mid-2026), with messages priced by complexity — simple to start, but heavy build weeks consume more credits.',
    },
  ],
};

export const COMPARISONS: Comparison[] = [shopify, medusa, vercelCommerce, woocommerce];

export function getComparison(slug: string): Comparison | undefined {
  return COMPARISONS.find((c) => c.slug === slug);
}
