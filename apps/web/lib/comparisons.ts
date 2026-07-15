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

const createNextApp: Comparison = {
  slug: 'create-next-app',
  competitor: 'create-next-app',
  title: 'Cartwright vs create-next-app',
  description:
    'create-next-app gives you a blank Next.js canvas. create-cartwright gives you the same stack with a designed site, database, admin, checkout and AI/agent surfaces already running. When to start blank, when to start complete.',
  answer:
    'Both are one-command Next.js scaffolds — the difference is what exists when the command finishes. create-next-app hands you a blank canvas: routing and tooling, no pages, no data layer, no admin. create-cartwright hands you a running product on the same stack: a designed homepage, Prisma database with seeded content, an admin with auth, optional cart/checkout, JSON-LD, and an AI tool surface your coding agent can drive. Start blank when the app is genuinely novel and you want zero opinions; start with Cartwright when the goal is a website or shop — you skip the first two weeks of plumbing and still own every line, because it is your repo either way.',
  rows: [
    { dimension: 'What exists after the command', cartwright: 'A running site: design system, seeded database, admin, auth, SEO/JSON-LD — and a webshop if you want it.', them: 'A blank app directory with routing, TypeScript and Tailwind configured. Everything else is yours to build.' },
    { dimension: 'Stack', cartwright: 'Next.js 16 + React 19 + Tailwind v4 + Prisma + Stripe + NextAuth — pre-wired.', them: 'Next.js + your choices; official, minimal, unopinionated.' },
    { dimension: 'Freedom', cartwright: 'Opinionated defaults you can rip out — it is a normal repo, not a framework on top.', them: 'Total — no opinions to remove. This is its genuine strength for novel apps.' },
    { dimension: 'AI-agent readiness', cartwright: 'Agent rules files, an MCP server, a REST tool surface and plan-first admin tools ship in the box.', them: 'The 16.3 next-dev-loop skill helps agents iterate, but there is no product surface to drive.' },
    { dimension: 'Time to a shippable website/shop', cartwright: 'Minutes (measured 99 s to a designed homepage with an AI agent).', them: 'Days to weeks — auth, data, admin, checkout and SEO are all still ahead of you.' },
    { dimension: 'Ownership', cartwright: 'MIT; your repo from the first commit.', them: 'MIT; your repo from the first commit. Equal.' },
  ],
  faq: [
    { q: 'Is create-cartwright built on create-next-app?', a: 'No — it scaffolds a complete open-source Next.js engine (Cartwright) from a template repo. The result is a normal Next.js 16 project you could have built from create-next-app, with the product layers already implemented.' },
    { q: 'When is create-next-app the better choice?', a: 'When you are building something that is not a website, shop or content product — a dashboard, an internal tool, a novel app — and you want zero opinions in the repo. Blank is a feature there.' },
    { q: 'Can I strip Cartwright back to almost-blank?', a: 'Yes — it is your repo, and the engine is flag- and module-gated. But if you know you want near-blank, start with create-next-app instead; Cartwright earns its weight when you use the product layers.' },
  ],
};

const v0: Comparison = {
  slug: 'v0',
  competitor: 'v0 (Vercel)',
  title: 'Cartwright vs v0',
  description:
    'v0 generates UI and apps from prompts in the browser; Cartwright is an open-source site + commerce engine your own AI agent builds on. They compose well — v0 for exploration, Cartwright for the production shop.',
  answer:
    'v0 is Vercel’s prompt-to-app builder: describe UI in the browser, get polished React/Next.js you can iterate on visually and deploy to Vercel in a click — the best-in-class way to explore an interface idea. Cartwright is a complete open-source commerce/site engine that lives in your repo and is built on by whatever AI agent you already use, with a database, admin, checkout and agent-commerce protocols included. Use v0 to find the design; use Cartwright to run the business. They are not rivals: Cartwright pages are plain React Server Components, so a section you prototyped in v0 pastes into a Cartwright design pack cleanly.',
  rows: [
    { dimension: 'What it is', cartwright: 'An engine in your repo: storefront + admin + checkout + AI/agent surfaces.', them: 'A hosted AI builder that generates UI/apps from prompts, with visual iteration.' },
    { dimension: 'Where you work', cartwright: 'Your terminal/IDE with your own agent (Claude Code, Cursor, Copilot…).', them: 'v0.app in the browser; code can sync out to GitHub/Vercel.' },
    { dimension: 'Backend & commerce', cartwright: 'Prisma DB, Stripe checkout, orders, VAT, shipping, GDPR tooling — built in.', them: 'Generates frontends and API stubs; a real commerce backend is your project (or an integration).' },
    { dimension: 'Design exploration', cartwright: '28+ design packs and a Magic Builder, but exploration is prompt-in-repo.', them: 'Genuinely superb — instant visual variants from a prompt is what v0 is for.' },
    { dimension: 'Pricing', cartwright: 'MIT engine; you pay infra + your own AI usage at cost.', them: 'Free tier + subscription with usage-based credits.' },
    { dimension: 'Lock-in', cartwright: 'None — the repo is the product.', them: 'Low-ish: code exports cleanly to Next.js, the workflow lives on the platform.' },
  ],
  faq: [
    { q: 'Can I use v0 and Cartwright together?', a: 'Yes, and it is a good workflow: explore a section or page in v0, then have your agent translate the result into a Cartwright design pack or governed section. Cartwright’s pages are standard React Server Components, so v0 output ports naturally.' },
    { q: 'Does v0 build webshops?', a: 'v0 excels at generating storefront UI, but cart/checkout/orders/tax are integrations you assemble. Cartwright ships the commerce engine — Stripe checkout, orders, VAT, shipping zones — as tested, flag-gated code.' },
    { q: 'Which is better for AI-search visibility?', a: 'Cartwright server-renders every page with JSON-LD and ships llms.txt and agent endpoints by default. v0 output can be made SEO-friendly, but it is your job to add the structured-data layer.' },
  ],
};

const bolt: Comparison = {
  slug: 'bolt-new',
  competitor: 'bolt.new',
  title: 'Cartwright vs bolt.new',
  description:
    'bolt.new is a browser AI builder running full-stack apps in WebContainers; Cartwright is an open-source commerce engine in your own repo. Prototype speed versus owned production commerce.',
  answer:
    'bolt.new (StackBlitz) is a prompt-to-app builder that runs a full Node.js environment in your browser tab — startlingly fast for prototyping full-stack ideas without installing anything. Cartwright is the opposite end of the same journey: an MIT-licensed commerce/site engine scaffolded into your own repository, built on by your own AI agent, with a real database, admin, Stripe checkout and agent-commerce protocols already implemented and tested. Reach for bolt.new to explore an idea in minutes; reach for Cartwright when the idea is “a site or shop that must run in production and be mine.”',
  rows: [
    { dimension: 'Zero-install start', cartwright: 'Needs Node + a terminal + an AI agent (a developer environment).', them: 'Unmatched — a full dev environment in the browser tab, nothing installed.' },
    { dimension: 'What you own afterwards', cartwright: 'A normal Next.js repo with a tested engine inside — yours from commit one.', them: 'Export/GitHub sync exists; the build workflow and environment live on the platform.' },
    { dimension: 'Commerce depth', cartwright: 'Cart, Stripe checkout + webhooks, orders, VAT/Stripe Tax, shipping zones, GDPR, multi-currency — engine code, not generated on the fly.', them: 'AI-generated per project; payments and order flows are yours to assemble and harden.' },
    { dimension: 'AI model & metering', cartwright: 'Bring your own agent and API key; the engine meters nothing.', them: 'Built-in agent, token/credit-metered subscription.' },
    { dimension: 'Production posture', cartwright: 'Deploys as a standard Next.js app (Vercel etc.) with a real migration/versioning story.', them: 'Deploys exist, but hardening an AI-generated codebase for production is on you.' },
  ],
  faq: [
    { q: 'Is Cartwright a bolt.new alternative?', a: 'They solve different moments. bolt.new is the fastest browser-based way to prototype a full-stack idea. Cartwright is a production commerce engine your own agent extends in your own repo. Prototype there, graduate here — or start here when you already know you are building a site or shop.' },
    { q: 'Why not just let bolt.new generate my shop?', a: 'A checkout is the least forgiving code you will run: payments, webhooks, tax, refunds, GDPR. Cartwright ships those as tested, flag-gated engine code with a public update path — instead of one-off generated code you must audit and maintain alone.' },
    { q: 'Can I move a bolt.new prototype to Cartwright?', a: 'Bring the design and the intent, not the code: Cartwright’s design-import can lift your palette from a URL, products come in via CSV, and your agent rebuilds the pages as design-pack sections on the engine’s data layer.' },
  ],
};

const saleor: Comparison = {
  slug: 'saleor',
  competitor: 'Saleor',
  title: 'Cartwright vs Saleor',
  description:
    'Cartwright vs Saleor: a one-repo Next.js commerce app you own end-to-end versus an enterprise-grade headless GraphQL commerce platform. Different weight classes, both open source.',
  answer:
    'Both are open-source commerce platforms with agentic ambitions, at different weight classes. Saleor is an enterprise-grade headless backend — a Python/GraphQL commerce API you run (or buy as Saleor Cloud) behind a storefront you build, strong on multi-channel, multi-warehouse and B2B complexity. Cartwright is a single Next.js app that IS the storefront, admin and backend in one repo, sized for the independent shop or agency site that wants AI/agent surfaces working on day one. Choose Saleor for enterprise catalogs, multi-channel orchestration and a dedicated engineering team; choose Cartwright when one owned repo with commerce, design system and MCP/ACP/A2A endpoints already wired is the whole point.',
  rows: [
    { dimension: 'Architecture', cartwright: 'One Next.js app: storefront + admin + API + DB in a single repo.', them: 'Headless GraphQL core (Python/Django) + separate storefront + apps; more services, more flexibility.' },
    { dimension: 'Enterprise features', cartwright: 'Sized for SMB: variants, discounts, shipping zones, VAT, multi-currency.', them: 'Genuinely deeper: multi-channel, multi-warehouse, B2B price lists, permission systems.' },
    { dimension: 'Time to a live shop', cartwright: 'One command; a designed, seeded shop in minutes.', them: 'Core is quick to start; a production storefront + infra is a real project.' },
    { dimension: 'AI / agents', cartwright: 'MCP server, ACP feed + checkout endpoints, A2A negotiation — shipped and flag-gated in the box.', them: 'Agentic-commerce positioning (ACP/AP2) at the platform level; surfaces land via apps/integrations.' },
    { dimension: 'Team fit', cartwright: 'A solo builder or agency with an AI coding agent.', them: 'A product/engineering team comfortable operating services.' },
    { dimension: 'Hosting', cartwright: 'Any Next.js host — Vercel + Turso free tiers carry a small shop.', them: 'Self-host the stack or pay for Saleor Cloud.' },
  ],
  faq: [
    { q: 'Is Cartwright an alternative to Saleor?', a: 'For independent shops and agency sites, yes. For enterprise multi-channel commerce with warehouses and B2B contracts, Saleor is the stronger platform — that is its home turf, not Cartwright’s.' },
    { q: 'Which is more AI/agent-ready today?', a: 'Cartwright ships working MCP, ACP and A2A endpoints in the scaffold, default-off and flag-gated, plus JSON-LD and llms.txt on every shop. Saleor’s agentic story is platform-level and integration-driven — powerful, but assembled per project.' },
    { q: 'GraphQL or REST?', a: 'Saleor is GraphQL-first — excellent for complex clients. Cartwright exposes a curated REST tool surface (and MCP) designed for AI agents: small, scoped, plan-first-confirmed operations rather than an open query language.' },
  ],
};

const wix: Comparison = {
  slug: 'wix',
  competitor: 'Wix',
  title: 'Cartwright vs Wix',
  description:
    'Wix is a hosted drag-and-drop site builder with commerce plans; Cartwright is an open-source AI-first site + shop engine you own. Convenience-rental versus owned code.',
  answer:
    'Wix is the mainstream hosted builder: drag-and-drop editing, hundreds of templates, commerce plans, and genuinely zero technical setup — you rent convenience. Cartwright is an open-source engine your AI agent builds on in your own repository: the site is code you own, the shop is a real Stripe checkout, and the AI layer (assistant, MCP server, agent-commerce endpoints) is native rather than an add-on. If you never want to see a repo, Wix remains the safer home. If you (or your agent) can run a terminal, Cartwright gives you ownership, no monthly platform fee, and a site built to be read and transacted with by AI systems.',
  rows: [
    { dimension: 'Editing model', cartwright: 'Prompt an AI agent (or use the admin’s no-code Vibe/Magic Builder) — changes land as code/data in your repo and DB.', them: 'Mature drag-and-drop visual editor — the best-known zero-code editing experience.' },
    { dimension: 'Ownership', cartwright: 'MIT source in your repo; export nothing because you already hold everything.', them: 'Hosted; sites are not portable off the platform.' },
    { dimension: 'Cost over time', cartwright: 'Engine free; pay infra (often near-zero on free tiers) + your AI usage.', them: 'Monthly plan per site; commerce features on higher tiers.' },
    { dimension: 'Commerce', cartwright: 'Stripe checkout, orders, VAT, shipping zones, discounts, multi-currency — in the engine.', them: 'Solid built-in commerce on business plans; transaction terms vary by plan/region.' },
    { dimension: 'AI & agent readiness', cartwright: 'AI-native: agent rules, MCP/ACP/A2A surfaces, JSON-LD everywhere, llms.txt.', them: 'AI site-generation and content tools exist; there is no owned agent surface for outside AI to transact with.' },
    { dimension: 'Who it is for', cartwright: 'Builders with an AI coding agent; agencies shipping owned sites.', them: 'Non-technical owners who want a site today with zero tooling.' },
  ],
  faq: [
    { q: 'Is Cartwright harder than Wix?', a: 'Day one, yes — you need Node, a terminal and an AI agent. Day thirty, the balance flips: your agent edits the site by prompt, the admin handles daily content, and there is no plan ceiling or platform fee in the way.' },
    { q: 'Can I move from Wix to Cartwright?', a: 'There is no code to export from Wix, but Cartwright’s site-import tooling can scrape your existing pages into draft content and derive your palette from the URL, and products come in via CSV. Plan a rebuild-with-import, not a migration.' },
    { q: 'What does a Cartwright site cost to run vs Wix?', a: 'The engine is free (MIT). Small sites typically run on free tiers (Vercel + Turso), so the ongoing cost is your domain plus whatever AI usage your agent consumes — usually less than a Wix business plan.' },
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

export const COMPARISONS: Comparison[] = [
  shopify,
  medusa,
  vercelCommerce,
  woocommerce,
  createNextApp,
  v0,
  bolt,
  saleor,
  wix,
];

export function getComparison(slug: string): Comparison | undefined {
  return COMPARISONS.find((c) => c.slug === slug);
}
