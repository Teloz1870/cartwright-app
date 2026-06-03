/**
 * Data for the /use-cases/[slug] pages. Each renders an answer-first, who/why/how
 * page with Article + FAQPage + BreadcrumbList JSON-LD — the "who is this for"
 * surface AI assistants pull from when a user describes a goal rather than a tool.
 */

export type UseCasePoint = { heading: string; body: string };
export type FaqItem = { q: string; a: string };

export type UseCase = {
  slug: string;
  title: string;
  description: string;
  answer: string;
  points: UseCasePoint[];
  faq: FaqItem[];
};

const aiFirstShop: UseCase = {
  slug: 'ai-first-shops',
  title: 'Build an AI-first webshop',
  description:
    'Build a webshop where AI is the spine, not a plugin: an AI-native admin, a storefront assistant, and an MCP server so agents can act on your shop — all owned, scaffolded with one command.',
  answer:
    'An AI-first webshop treats AI as core infrastructure rather than a bolt-on widget. With Cartwright you scaffold one in a single command and get an AI-native admin (draft copy, generate SEO, answer support), a storefront assistant, and an MCP server that exposes your shop’s operations as typed tools agents can call. Because you own the codebase, you decide exactly what the AI can see and do.',
  points: [
    { heading: 'Who it’s for', body: 'Founders and developers who want AI woven through admin, storefront, and APIs — not a chatbot stapled on at the end.' },
    { heading: 'AI-native admin', body: 'Product copy, SEO metadata, and answers drafted in the admin; every AI write goes through the same tool registry + audit log as a human.' },
    { heading: 'Storefront assistant', body: 'A customer-facing assistant that can search, add to cart, and complete orders within the scopes you grant.' },
    { heading: 'MCP server', body: 'A public /api/mcp endpoint with a typed tool catalogue — external agents act on your shop natively, no scraping.' },
    { heading: 'You own it', body: 'MIT source on your infra; swap AI providers (Anthropic, Gemini, local Ollama) in one file.' },
  ],
  faq: [
    { q: 'What does “AI-first” actually mean here?', a: 'The admin, storefront, and API surfaces are all built around AI from the start: an AI-native admin, a storefront assistant, and an MCP tool registry — not a single chatbot feature.' },
    { q: 'Can I control what the AI is allowed to do?', a: 'Yes. Every AI action runs through a typed tool registry with scopes and an audit log, so you grant exactly the capabilities you want and can revert any change.' },
    { q: 'Do I have to use a specific AI provider?', a: 'No — Anthropic and Gemini are wired in, and local Ollama is supported. Providers swap in one file.' },
  ],
};

const agentCommerce: UseCase = {
  slug: 'agent-commerce',
  title: 'Sell to AI agents (agent-commerce)',
  description:
    'Let AI buying agents discover, negotiate, and purchase from your shop. Cartwright ships MCP, the Agentic Commerce Protocol, and agent-to-agent endpoints so agents are first-class customers.',
  answer:
    'Agent-commerce is selling to software that shops on a human’s behalf. Cartwright treats agents as first-class customers: a signed Agent Card for discovery, an Agentic Commerce Protocol (ACP) for creating and completing checkout sessions, agent-to-agent (A2A) negotiation and escrow verification, and an MCP server for tool calls. Your catalogue is structured (JSON-LD, a product feed) so agents can find it, and the checkout path is the same one humans use.',
  points: [
    { heading: 'Who it’s for', body: 'Shops that want to be reachable by ChatGPT, Claude, Perplexity, and future autonomous shoppers — not just human browsers.' },
    { heading: 'Discovery', body: 'A signed Agent Card + a product feed + JSON-LD everywhere, so agents can find and trust your catalogue.' },
    { heading: 'Transaction', body: 'ACP endpoints create, retrieve, and complete checkout sessions; A2A adds price negotiation and escrow verification.' },
    { heading: 'Determinism', body: 'The negotiation kernel is pure TypeScript (never an LLM) with monotonicity guarantees and hundreds of property tests per CI run.' },
  ],
  faq: [
    { q: 'How does an AI agent buy from a Cartwright shop?', a: 'Via the Agentic Commerce Protocol: the agent creates a checkout session, supplies the buyer details, and completes it — the same order path as a human checkout, settled through Stripe.' },
    { q: 'Is agent pricing/negotiation safe?', a: 'Yes — the negotiation engine is deterministic pure TypeScript with monotonicity guarantees, not an LLM, and it is covered by hundreds of property tests.' },
    { q: 'Do I need to expose my whole shop to agents?', a: 'No. Agent surfaces are feature-flagged and scoped — you choose which endpoints and tools are public.' },
  ],
};

const multiCurrencyEu: UseCase = {
  slug: 'multi-currency-eu',
  title: 'Run a multi-currency European shop',
  description:
    'Sell across Europe in multiple currencies and languages: charge in the customer’s currency with an order-time FX snapshot, plus per-locale routing, hreflang, and content translation.',
  answer:
    'A European shop usually needs to show and charge in several currencies and speak several languages. Cartwright handles both natively: turn on multi-currency to charge in the customer’s selected currency (a Stripe presentment-currency charge with the FX rate snapshotted on the order), and declare your locales in one config line to get per-locale routes, automatic hreflang, and per-entity content translation. VAT is handled by Stripe Tax (EU OSS) or a built-in single rate.',
  points: [
    { heading: 'Who it’s for', body: 'EU/Nordic merchants selling cross-border who need DKK/EUR/USD and Danish/English/German from day one.' },
    { heading: 'Charge, don’t just display', body: 'Multi-currency charges in the customer’s currency and records currency + FX rate on the order for clean receipts, refunds, and accounting.' },
    { heading: 'Languages + hreflang', body: 'Add a locale in brand.config; routes and hreflang appear automatically, and products, categories, pages, services, and posts are translatable.' },
    { heading: 'VAT', body: 'Stripe Tax for managed multi-country VAT (EU OSS, VAT-ID, invoicing), or the built-in single rate — correct at checkout either way.' },
  ],
  faq: [
    { q: 'Does Cartwright actually charge in the customer’s currency?', a: 'Yes — with multi-currency enabled, the Stripe PaymentIntent is created in the customer’s presentment currency with the converted amount, and the order snapshots the currency and FX rate.' },
    { q: 'How do I add a language?', a: 'Add the locale to the `locales` array in brand.config.ts. Routing and hreflang update automatically, and the translation admin covers products, categories, pages, services, and blog posts.' },
    { q: 'How is EU VAT handled?', a: 'Via Stripe Tax for managed multi-country VAT (EU OSS, VAT-ID, invoicing), or a built-in single rate if you prefer.' },
  ],
};

const migrateFromShopify: UseCase = {
  slug: 'migrate-from-shopify',
  title: 'Migrate off Shopify and own your stack',
  description:
    'Move from renting a hosted SaaS to owning your commerce codebase: import products and design, keep Stripe as the link key, and run a modern Next.js shop with AI built in.',
  answer:
    'Migrating off Shopify with Cartwright means trading a rented SaaS for a codebase you own. You scaffold a Cartwright shop, import your products (CSV, plus a “Hoptify” onboarding that can pull design and catalogue across), point your DNS over, and keep Stripe as the link key for customers. The result is a modern TypeScript/Next.js shop with an AI-native admin and agent-commerce built in — no monthly platform fee and no per-transaction tax.',
  points: [
    { heading: 'Who it’s for', body: 'Shopify merchants who have outgrown app fees and theme limits and want to own the stack.' },
    { heading: 'Import', body: 'Product CSV import plus the Hoptify onboarding, which can bring your palette and products across when a key is set.' },
    { heading: 'Keep what matters', body: 'Stripe stays your processor and the customer link key, so billing continuity is preserved.' },
    { heading: 'Gain', body: 'A modern DX, AI/agent commerce, AI-search-ready structured data, and zero platform lock-in.' },
  ],
  faq: [
    { q: 'How hard is it to migrate from Shopify?', a: 'Scaffold Cartwright, import products (CSV or the Hoptify onboarding), and point your DNS over. Stripe stays your processor and the customer link key, so billing continuity is preserved.' },
    { q: 'Will I lose my customers or payment history?', a: 'No — Stripe remains the system of record for payments and the link key for customers, so history is preserved on Stripe’s side.' },
    { q: 'What do I gain over Shopify?', a: 'You own the code, pay no platform or per-transaction fees, and get a modern Next.js stack with AI-native admin and agent-commerce built in.' },
  ],
};

export const USE_CASES: UseCase[] = [aiFirstShop, agentCommerce, multiCurrencyEu, migrateFromShopify];

export function getUseCase(slug: string): UseCase | undefined {
  return USE_CASES.find((u) => u.slug === slug);
}
