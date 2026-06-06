import { Section, SectionHeader } from '@/components/landing/section';
import { Badge } from '@/components/ui/badge';

const proofs = [
  {
    badge: 'Discoverable',
    endpoint: 'GET /llms.txt',
    title: 'Legible to LLM crawlers',
    body: "Every shop serves /llms.txt and Product + Organization JSON-LD on every relevant page. Generative engines don't have to guess what you sell — the structured answer is already there.",
  },
  {
    badge: 'Catalogued',
    endpoint: 'GET /api/v1/tools',
    title: 'A public tool catalogue',
    body: '/api/v1/tools is a machine-readable list of every action an agent can take — products.search, cart, and more. Typed, versioned, and discoverable without docs.',
  },
  {
    badge: 'Indexable',
    endpoint: 'GET /api/acp/feed',
    title: 'A JSONL product feed agents can ingest',
    body: 'Every shop publishes its catalogue as newline-delimited JSON at /api/acp/feed — the format ChatGPT Instant Checkout and other AI shopping engines read directly. No XML to maintain, no merchant centre to upload to.',
  },
  {
    badge: 'Buyable',
    endpoint: 'POST /api/acp/v1/checkout_sessions',
    title: 'Stateless agentic checkout',
    body: 'A buyer agent POSTs line items + shipping in one call; the response is a checkout session with totals already computed by lib/pricing.ts. /complete posts the order. Idempotency keys handle retries. Specified per the Agentic Commerce Protocol v0.2.',
  },
  {
    badge: 'Connectable',
    endpoint: 'POST /api/mcp',
    title: 'A built-in MCP server',
    body: '/api/mcp speaks the Model Context Protocol natively, and /.well-known/mcp.json is the standard discovery card. Agents connect to your shop with no glue code.',
  },
  {
    badge: 'Accountable',
    endpoint: '/manifest',
    title: 'Purchase-capable, on the record',
    body: 'The storefront chat completes real purchases — browse, cart, checkout — and every agent-initiated action lands in a public audit log. The /manifest page indexes the whole surface.',
  },
  {
    badge: 'Negotiable',
    endpoint: 'POST /api/negotiate',
    title: 'Deterministic negotiation, never an LLM',
    body: "Buyer agents send a counter-offer; the Anchor-and-Resume engine returns {decision, nextOffer, reasoningCodes} — pure TypeScript, monotonicity-guaranteed, no prompt-injection surface. The engine produces the number; an optional LLM layer renders it as buyer-facing prose.",
  },
  {
    badge: 'Verifiable',
    endpoint: 'GET /api/agent-card',
    title: 'Signed Agent Card for discovery',
    body: "Every A2A shop publishes a signed JSON Agent Card describing its catalogue, payment rails, and negotiation policy. Buyer agents verify the ed25519 signature offline before they trust a single field — no centralised registry, no marketplace middleman.",
  },
  {
    badge: 'Trusted',
    endpoint: 'POST /api/escrow/verify',
    title: 'Verify-then-Pay with Proof of Task',
    body: "Funds held in escrow at checkout, released only when the buyer submits a Proof-of-Task-Execution (hash match, delivery confirmation, ed25519 signature, or webhook event). Every state transition writes to an A-JWT audit log; disputes route to a human in /admin/agentic.",
  },
  {
    badge: 'Identity-linked',
    endpoint: 'GET /.well-known/oauth-authorization-server',
    title: 'OAuth 2.0 identity-linking (UCP)',
    body: "A full Authorization Code + PKCE server implements UCP dev.ucp.common.identity_linking, so an agentic platform can act on a shopper's behalf across merchants — a consent screen, scoped tokens, refresh reuse-detection, and hashed-only storage. Default-off (ucpIdentityLinking); run db:push + set AUTH_URL to turn it on.",
  },
  {
    badge: 'In-browser',
    endpoint: 'document.modelContext',
    title: 'WebMCP tools in the tab',
    body: "The storefront registers search_products, get_cart, add_to_cart and a same-origin navigate as browser-native WebMCP tools, so an in-browser agent acts reliably instead of scraping the DOM. Experimental (Chrome 149 origin-trial), default-off (webMcp).",
  },
];

export function AgentSurface() {
  return (
    <Section>
      <SectionHeader
        eyebrow="THE AGENT SURFACE"
        title="Built to be found, cited, and bought by AI."
        description="Search is becoming a conversation. A cartwright shop ships the machine-readable surface that lets LLMs and agents discover your catalogue, understand your products, and act on them — without you bolting anything on."
      />
      <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-cw-stone-200 dark:border-cw-stone-800 bg-cw-stone-200 dark:bg-cw-stone-800 sm:grid-cols-2">
        {proofs.map((proof) => (
          <div
            key={proof.title}
            className="bg-cw-paper dark:bg-cw-stone-900/40 p-6 transition-colors hover:bg-cw-stone-50 dark:hover:bg-cw-stone-900"
          >
            <div className="flex items-center justify-between">
              <Badge tone="oker">{proof.badge}</Badge>
              <span className="font-mono text-[11px] text-cw-stone-400 dark:text-cw-stone-500">
                {proof.endpoint}
              </span>
            </div>
            <h3 className="mt-3 text-sm font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
              {proof.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-cw-stone-500 dark:text-cw-stone-400">
              {proof.body}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-6 max-w-2xl text-sm text-cw-stone-500 dark:text-cw-stone-400">
        A dozen agent endpoints. One signed Agent Card. One deterministic negotiation engine.
        One Guardian middleware that enforces shop legislation before any money moves — plus a
        full OAuth 2.0 identity-linking server (UCP) and in-browser WebMCP tools.
        Cartwright ships the full Headless Merchant architecture —
        Agentic Commerce Protocol checkout, A2A negotiation, escrow with PoTE, UCP
        identity-linking. Every surface is gated behind its own{' '}
        <span className="font-mono">brand.features</span> flag and default-off, so your
        storefront stays clean until you opt in.
      </p>
    </Section>
  );
}
