import { Section, SectionHeader } from '@/components/landing/section';
import { Accordion } from '@/components/ui/accordion';

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
    a: 'No platform fees. You pay the underlying services you choose — Vercel hosting, Turso or Postgres, Stripe’s standard processing, Anthropic/Gemini if you use AI. There is no per-order tax going to cartwright.',
  },
  {
    q: 'Can I migrate from Shopify or WooCommerce?',
    a: 'There’s no migration tool yet (planned for v0.2). What you can do today: scaffold cartwright, run the import scripts for products and customers, and point your DNS over. The Stripe customer ID is the link key.',
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
    a: 'The admin ships with agentic helpers — drafting product copy, generating SEO metadata, answering customer questions in the storefront chat, and exposing a /api/mcp endpoint so external agents can act on the shop with tools you define.',
  },
  {
    q: 'Where do I get support?',
    a: 'Discord for community support. GitHub Issues on cartwright-app for docs/CLI bugs. Paid setup help is available — email hello@cartwright.app.',
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
