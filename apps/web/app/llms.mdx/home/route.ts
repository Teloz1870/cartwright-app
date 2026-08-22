import { MARKDOWN_CONTENT_TYPE } from '@/lib/content-negotiation';
import { AGENT_RESOURCES, SITE_URL } from '@/lib/agent-resources';
import { WHEN_TO_USE } from '@/lib/when-to-use';

/**
 * The homepage, as Markdown.
 *
 * `/docs/*` had a Markdown representation because fumadocs holds those pages as
 * MDX and can hand back the source. The homepage is hand-written React, so there
 * is nothing to hand back — which is why `Accept: text/markdown` on `/` returned
 * HTML and the site read as non-compliant.
 *
 * Rather than convert the rendered DOM (fragile, and it would carry nav chrome
 * and decorative copy an agent has no use for), this is an authored Markdown
 * representation of the same page: the same claim, the same install command, the
 * same proof points, in the order the page makes them. It is deliberately short
 * — an agent that wants depth follows the links.
 *
 * Kept in sync by `lib/home-markdown.test.ts`, which asserts the install command
 * and the headline claim match the ones the React homepage actually renders.
 */

export const revalidate = false;

const HOME_MARKDOWN = `# Cartwright — AI runs the shop. You keep the keys.

Cartwright is an AI-native commerce engine built for trusted operation: scoped
tools, confirmation-gated writes, auditable actions, agent checkout — and a repo
you can leave with.

    npx create-cartwright@latest my-shop

Open source, MIT licensed, Next.js. You own the code, the database and the AI
layer; there are no platform fees and no per-transaction cut.

${WHEN_TO_USE}

## Everyone operates the same shop

- **You, in a browser** — an admin where every AI action is proposed, shown, and
  confirmed before it writes.
- **Your AI coding agent, in a terminal** — the whole tool surface over REST at
  \`POST /api/v1/tools/<name>\`, plus an MCP server, so an agent can build and
  operate the shop without a browser.
- **Shopping agents, over the wire** — JSON-LD on every citable page, llms.txt,
  and agent-commerce endpoints (ACP / A2A) so an external buying agent can both
  cite the shop and transact with it.

## The first commit is the exit plan

The scaffold is a plain Next.js repository on your machine from the first
command. There is no runtime dependency on cartwright.app: no license check at
boot, no hosted control plane, no build step that phones home. Deleting your
account leaves the shop running.

## Machine-readable entry points

${AGENT_RESOURCES.map((r) => `- \`${r.path}\` — ${r.description}`).join('\n')}

## Links

- Source (engine template): https://github.com/Teloz1870/cartwright-template
- Source (CLI + this site): https://github.com/Teloz1870/cartwright-app
- npm: https://www.npmjs.com/package/create-cartwright
- Documentation: ${SITE_URL}/docs/introduction
- Pricing: ${SITE_URL}/pricing
- Comparisons (Lovable, Shopify, Medusa, Vercel Commerce, WooCommerce): ${SITE_URL}/compare
`;

export function GET(): Response {
  return new Response(HOME_MARKDOWN, {
    headers: {
      'Content-Type': MARKDOWN_CONTENT_TYPE,
      Vary: 'Accept',
    },
  });
}
