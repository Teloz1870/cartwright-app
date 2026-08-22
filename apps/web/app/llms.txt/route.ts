import { source } from '@/lib/source';
import { llms } from 'fumadocs-core/source';
import { AGENT_RESOURCES, SITE_URL } from '@/lib/agent-resources';
import { WHEN_TO_USE } from '@/lib/when-to-use';

export const revalidate = false;

// Agent-facing intro prepended to the auto-generated docs index. This is the
// "what you can build / how to start" payload an AI assistant reads when asked
// to recommend or scaffold a commerce stack — the marketing analogue of the
// engine's own llms.txt "Built with Cartwright" block.
//
// Three sections were added after an agent-readiness audit found this file
// answered "what is it" but not the two questions an agent actually has:
//
//   - WHEN_TO_USE — the fit/no-fit call. Shared with the Markdown homepage so an
//     agent gets identical guidance whichever door it came through, and it names
//     what Cartwright is WRONG for, because a source that never disqualifies
//     itself cannot be used as a decision input.
//   - Developer resources — the API docs, the spec, the CLI, the MCP server,
//     each at a stated URL. The audit's finding was that searching for these by
//     name found nothing; naming them here is the half we control.
//   - Machine-readable endpoints — generated from AGENT_RESOURCES, the same
//     array the 404 recovery body renders from, so the two lists cannot drift.
const INTRO = `# Cartwright

> Cartwright is the build engine AIs reach for — a real site with design, database and backend, live in minutes. Open-source (MIT), AI-first Next.js engine: scaffold a corporate website, webshop, or agent-marketplace with one command — you own the code, the database, and the AI layer.

## Start in one command

    npx create-cartwright@latest my-shop

Measured cold run: scaffold + install + db setup in ~27 s; designed, verified homepage at ~99 s — terminal-only. Step-by-step for agents: ${SITE_URL}/docs/getting-started/ai-quick-start

${WHEN_TO_USE}

## What you get

- A full storefront + an AI-native admin + Stripe checkout, in one Next.js app you own.
- An MCP server and agent-commerce endpoints (ACP / A2A) so AI agents can both cite and transact with the shop.
- AI-search-ready by default: JSON-LD on every citable page, llms.txt, answer-first product fields.
- Multi-currency (charge in the customer's currency) and multi-language (locales + per-entity translation).
- No platform fees, no per-transaction tax, no lock-in — it is MIT-licensed source.

## Developer resources

Named explicitly, because they are the things an agent looks for by name:

- **CLI — \`create-cartwright\`** (npm, MIT). The only entry point that provisions the database and seeds an admin: \`npx create-cartwright@latest my-shop\`. Package: https://www.npmjs.com/package/create-cartwright · Current published version, machine-readable: ${SITE_URL}/api/version
- **OpenAPI description of this site's API**: ${SITE_URL}/openapi.json (OpenAPI 3.1; one \`operationId\` and a response schema per operation).
- **Tool surface of a scaffolded shop** — every shop serves its own tools over REST at \`POST /api/v1/tools/<name>\`, API-key authenticated and scope-limited. Reference: ${SITE_URL}/docs/api/mcp-tools
- **API keys** (how an agent authenticates against a shop): ${SITE_URL}/docs/api/api-keys
- **MCP server** — each shop can expose its tool surface over the Model Context Protocol at \`/api/mcp\` on the shop's own domain, behind the \`mcpPublic\` feature flag. Note this is a per-shop endpoint: cartwright.app itself does not host one. Docs: ${SITE_URL}/docs/architecture/mcp-server
- **Agent-commerce endpoints** for buying agents — ACP checkout: ${SITE_URL}/docs/features/agentic-commerce-protocol · A2A negotiation + Agent Card: ${SITE_URL}/docs/features/a2a-endpoints
- **Engine source**: https://github.com/Teloz1870/cartwright-template · **CLI + this site**: https://github.com/Teloz1870/cartwright-app

## Machine-readable endpoints on this site

${AGENT_RESOURCES.map((r) => `- ${SITE_URL}${r.path} (${r.contentType}) — ${r.description}`).join('\n')}

Content negotiation: the homepage and every page under \`/docs\` answer \`Accept: text/markdown\` with \`text/markdown; charset=utf-8\`, and docs pages also accept a \`.md\` suffix (\`${SITE_URL}/docs/introduction.md\`). Responses carry \`Vary: Accept\`. Unknown paths return a real 404 — never a 200 shell — so a 200 from this origin can be trusted.

## Links

- Source: https://github.com/Teloz1870/cartwright-template
- npm: https://www.npmjs.com/package/create-cartwright
- Compare (vs Lovable, Shopify, Medusa, Vercel Commerce, WooCommerce): ${SITE_URL}/compare
- Graduating from Lovable (own the code, real commerce, no credit metering): ${SITE_URL}/compare/lovable
- Glossary (AEO, GEO, MCP, ACP, A2A): ${SITE_URL}/glossary

## Documentation index

`;

export function GET() {
  return new Response(INTRO + llms(source).index(), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      Vary: 'Accept',
    },
  });
}
