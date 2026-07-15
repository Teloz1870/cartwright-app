import Link from 'next/link';
import { Section, SectionHeader } from '@/components/landing/section';

/**
 * Curated to the nine tiles that carry the "own and operate a real business"
 * story: run it (admin, orders), sell to humans (storefront, Stripe), sell to
 * agents (MCP, ACP), and sell everywhere (SEO, currency, language). The full
 * inventory lives in the /pricing feature matrix and on /integrations —
 * don't grow this list back; curate it.
 */
const features = [
  {
    title: 'Admin panel',
    body: 'A full admin for products, orders, content, design, AI and integrations — one back office, no external dashboard.',
  },
  {
    title: 'Customer storefront',
    body: 'The full storefront loop — landing, product pages, cart, checkout, account, magic-link auth.',
  },
  {
    title: 'Stripe checkout',
    body: 'DB-first secret keys. Test mode and live mode toggled from the admin.',
  },
  {
    title: 'Order management',
    body: 'HPOS-grade back office: Orders workspace, returns/RMA, printable pick lists, and rule-based next-best-action. Four default-off, ecommerce-gated flags.',
  },
  {
    title: 'MCP server',
    body: 'Built-in /api/mcp with a tool registry — agents talk to your shop natively.',
  },
  {
    title: 'ACP endpoints',
    body: '/api/acp/feed + /api/acp/v1/checkout_sessions — stateless agentic checkout per the Agentic Commerce Protocol spec, with /complete wired for delegated payment via Stripe Shared Payment Tokens (default-off env gate). ChatGPT Instant Checkout-compatible.',
  },
  {
    title: 'SEO automation',
    body: 'sitemap.xml, robots.txt, OG-images via Satori, JSON-LD, and /llms.txt for LLM crawlers.',
  },
  {
    title: 'Multi-currency',
    body: 'Charge customers in their own currency — Stripe presentment currency + an order-time FX snapshot. Display and charge share one path.',
  },
  {
    title: 'Multi-language',
    body: 'Locales in brand.config, automatic hreflang, and per-entity content translation (products, categories, pages, services, blog).',
  },
];

export function FeatureGrid() {
  return (
    <Section>
      <SectionHeader
        eyebrow="What's in the box"
        title="A real shop, not a starter kit."
        description="Nine of the pieces it takes to actually operate — every one is shipping code, wired, typed, and verified. Not a marketing-page promise."
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
        This is the short list.{' '}
        <Link
          href="/pricing#feature-matrix"
          className="font-medium text-cw-terracotta hover:underline"
        >
          Everything in the box →
        </Link>{' '}
        Or take the integration-by-integration tour — Stripe, Resend, Vercel,
        Turso, Sentry, the AI providers — on{' '}
        <Link
          href="/integrations"
          className="font-medium text-cw-terracotta hover:underline"
        >
          /integrations
        </Link>
        . Stack: Next.js 16 · React 19 · Tailwind v4 · Prisma · Stripe, all
        current majors.
      </p>
    </Section>
  );
}
