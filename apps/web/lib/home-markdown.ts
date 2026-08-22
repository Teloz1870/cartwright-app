import { AGENT_RESOURCES, SITE_URL } from './agent-resources';
import { WHEN_TO_USE } from './when-to-use';
import { COLD_RUN, HOME_H1_TEXT, HOME_LEDE, INSTALL_COMMAND } from './home-copy';

/**
 * The homepage as Markdown, and the frontmatter helper both Markdown surfaces use.
 *
 * This body used to live inside `app/llms.mdx/home/route.ts`. It moved here
 * because there are now TWO ways to ask for the Markdown homepage and they must
 * return the same document:
 *
 *   - `Accept: text/markdown` on `/`  → rewritten to `/llms.mdx/home`
 *   - `GET /index.md`                 → the suffix form agents try first
 *
 * Two copies of a hand-authored document drift; one copy behind two routes
 * cannot. `lib/home-markdown.test.ts` additionally pins the headline claim and
 * the install command against what `hero.tsx` actually renders, so the Markdown
 * cannot quietly fall behind the React page either.
 */

/**
 * A `---` frontmatter block.
 *
 * Agents read frontmatter as document metadata instead of scraping it back out
 * of the prose — which is the whole point: `title` and `description` are stated
 * rather than inferred, and `canonical` tells a caller which URL this document
 * IS, so a Markdown twin fetched from `/index.md` still resolves to the same
 * entity as the HTML at `/`.
 *
 * Values are single-quoted and internal quotes doubled, which is YAML's own
 * escape. Em-dashes and other UTF-8 need no escaping.
 */
export function frontmatter(fields: {
  title: string;
  description?: string;
  canonical?: string;
  lastUpdated?: string;
}): string {
  const q = (v: string) => `'${v.replace(/'/g, "''")}'`;
  const lines = [`title: ${q(fields.title)}`];
  if (fields.description) lines.push(`description: ${q(fields.description)}`);
  if (fields.canonical) lines.push(`canonical: ${q(fields.canonical)}`);
  if (fields.lastUpdated) lines.push(`last-updated: ${q(fields.lastUpdated)}`);
  return `---\n${lines.join('\n')}\n---\n\n`;
}

const HOME_BODY = `# Cartwright — ${HOME_H1_TEXT}

${HOME_LEDE}

    ${INSTALL_COMMAND}

${COLD_RUN.provenance}: ${COLD_RUN.running} · ${COLD_RUN.designed}.

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

/** The homepage Markdown document, frontmatter included. */
export const HOME_MARKDOWN =
  frontmatter({
    title: `Cartwright — ${HOME_H1_TEXT}`,
    description: HOME_LEDE,
    canonical: `${SITE_URL}/`,
  }) + HOME_BODY;
