import { Section, SectionHeader } from '@/components/landing/section';
import { Accordion } from '@/components/ui/accordion';
import { contactEmail } from '@/lib/shared';

const items = [
  {
    q: 'Is cartwright open source?',
    a: (
      <>
        The CLI (<code>create-cartwright</code>) and this site are MIT and public
        from day one. The template repo is currently in private early access — it
        flips to public after Solbrillen.dk’s production milestones are met. The
        CLI fetches from a public sanitised mirror in the meantime, so no token
        is required to use it.
      </>
    ),
  },
  {
    q: 'Will it cost me anything to run?',
    a: (
      <>
        No platform fees. You pay the underlying services you choose — Vercel hosting, Turso or
        Postgres, Stripe’s standard processing, Anthropic/Gemini if you use AI. There is no
        per-order tax going to cartwright. Optional paid tiers (Plus $49/mo, Cloud $199/mo, Enterprise)
        layer on hosted services and premium MCP integrations — see{' '}
        <a href="/pricing" className="text-cw-terracotta">pricing</a> for the full breakdown.
      </>
    ),
  },
  {
    q: 'Can I migrate from Shopify or WooCommerce?',
    a: (
      <>
        Two paths. <strong>Today:</strong> scaffold cartwright, run the import scripts for products
        and customers, and point your DNS over. The Stripe customer ID is the link key.{' '}
        <strong>Q3 2026 with Plus:</strong> an{' '}
        <a href="/onboarding" className="text-cw-terracotta">agentic onboarding flow</a> that takes a
        source URL and runs a five-agent migration to a deployed Cartwright shop. The preview is
        live today; the agent ships with the Plus tier.
      </>
    ),
  },
  {
    q: 'How does this compare to Medusa, Saleor, or next-forge?',
    a: 'Medusa and Saleor are commerce engines you connect to a frontend. cartwright is a full shop you own end-to-end. next-forge is a SaaS starter — cartwright is the same opinionated spine, but for commerce specifically, with AI baked in.',
  },
  {
    q: 'Do I need to know Next.js?',
    a: 'You need to read TypeScript and have run Next.js dev once. The setup wizard handles every secret through a UI, so you do not edit env files unless you want to. Anything past “set up your shop” is normal Next.js work.',
  },
  {
    q: 'What does the AI actually do?',
    a: (
      <>
        The admin ships with agentic helpers — drafting product copy, generating SEO metadata,
        answering customer questions in the storefront chat, and exposing a <code>/api/mcp</code>{' '}
        endpoint so external agents can act on the shop with tools you define. Plus tier adds MCP
        integrations for Klaviyo, HubSpot, Slack, Zapier, Airtable, Notion, and four others so the
        agent can act on them directly — see{' '}
        <a href="/integrations" className="text-cw-terracotta">integrations</a>.
      </>
    ),
  },
  {
    q: 'Where do I get support?',
    a: (
      <>
        Discord for community support. GitHub Issues on cartwright-app for
        docs/CLI bugs. Paid setup help is available — email{' '}
        <a href={`mailto:${contactEmail}`} className="text-cw-terracotta">
          {contactEmail}
        </a>
        .
      </>
    ),
  },
  {
    q: 'When is 1.0?',
    a: 'When the template contract is stable enough that we will not break your fork on minor bumps. Realistic target: 8–12 weeks after the first dogfood shop ships.',
  },
];

export function Faq() {
  return (
    <Section>
      <SectionHeader
        eyebrow="FAQ"
        title="Honest answers, no marketing-speak."
        description="If your question is not here, ask on Discord or open an issue. We will add it."
      />
      <div className="mt-10 max-w-3xl">
        <Accordion items={items} />
      </div>
    </Section>
  );
}
