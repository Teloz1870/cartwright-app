import { z } from 'zod';
import { DESIGNS } from '@/lib/designs-data';
import { SITE_URL } from '@/lib/agent-resources';
import { ENGINE_FACTS } from '@/lib/engine-facts';
import { INSTALL_COMMAND, INSTALL_COMMAND_SITE, SITE_COLD_RUN } from './home-copy';
import { DEFAULT_FITS, NOT_A_FIT, SITE_FITS, METHODS, ORIGINS } from './when-to-use';

/**
 * The four things an agent can ask this site, as MCP tools.
 *
 * Deliberately narrow, and deliberately read-only. cartwright.app is a
 * documentation and distribution site: it has no orders, no customers and no
 * write surface, so a tool that mutates anything here would have to be invented
 * before it could be exposed. Every one of these answers from data already
 * served publicly over HTTP — the point is not new access, it is that an agent
 * no longer has to scrape a page to get it.
 *
 * ## Why unauthenticated
 *
 * Each tool is a different shape of the same public bytes: `search_docs` reads
 * the same index published at `/static.json`, `list_designs` the same manifest
 * behind `/designs`, `get_cli_version` the same npm lookup as `/api/version`.
 * An API key here would guard nothing and would make the endpoint useless to
 * the clients it exists for.
 *
 * What that DOES mean is the endpoint is a compute surface, so every tool bounds
 * its own work: query length is capped, result counts are capped and clamped,
 * and nothing here fans out to another service except the npm registry lookup,
 * which is ISR-cached for an hour by the same route `/api/version` uses.
 *
 * ## The shop, not this site
 *
 * A shop built with Cartwright serves a much larger MCP surface on its own
 * domain — the full tool registry, scoped and API-key authenticated. That is
 * the interesting one, and it is not this. `describe_engine` exists mostly to
 * say so, because an agent that finds this server should not conclude that this
 * is all Cartwright can do.
 */

const MAX_QUERY = 200;
const MAX_RESULTS = 25;

export type McpToolResult = {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
};

const asText = (value: unknown): McpToolResult => ({
  content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
});

/** The shape `search_docs` needs from a page — a fumadocs page satisfies it. */
export type SearchablePage = {
  url: string;
  data: { title?: string; description?: string };
};

/**
 * Rank and shape the hits. Exported and pure so it can be tested against
 * fixtures: the handler that calls it loads the fumadocs corpus, which needs
 * the MDX pipeline and is therefore out of reach of a unit test. The ranking
 * and the clamping are the parts worth pinning, and they live here.
 */
export function rankDocs(
  pages: SearchablePage[],
  query: string,
  limit?: number,
): { results: SearchablePage[]; take: number } {
  const needle = query.trim().toLowerCase().slice(0, MAX_QUERY);
  const take = Math.min(Math.max(limit ?? 8, 1), MAX_RESULTS);

  const results = pages
    .map((page) => ({ page, score: scoreDoc(page, needle) }))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score || a.page.url.localeCompare(b.page.url))
    .slice(0, take)
    .map((hit) => hit.page);

  return { results, take };
}

/** Case-insensitive substring scoring over title, description and URL. */
function scoreDoc(
  page: { url: string; data: { title?: string; description?: string } },
  needle: string,
): number {
  const title = (page.data.title ?? '').toLowerCase();
  const description = (page.data.description ?? '').toLowerCase();
  const url = page.url.toLowerCase();

  // Title beats description beats URL: a page named for the query is what the
  // caller meant, and a URL match alone is the weakest possible signal.
  if (title === needle) return 100;
  if (title.includes(needle)) return 60;
  if (description.includes(needle)) return 30;
  if (url.includes(needle)) return 10;
  return 0;
}

export const MCP_TOOLS = {
  search_docs: {
    title: 'Search the Cartwright documentation',
    description:
      'Search the Cartwright engine documentation by keyword. Returns matching pages with their title, description and absolute URL. Every result is also fetchable as Markdown by appending `.md` to its URL. Use this before answering questions about how Cartwright works, rather than relying on memory.',
    inputSchema: {
      query: z
        .string()
        .min(1)
        .max(MAX_QUERY)
        .describe('Keywords to search for, e.g. "api keys" or "multi-currency".'),
      limit: z
        .number()
        .int()
        .min(1)
        .max(MAX_RESULTS)
        .optional()
        .describe(`Maximum results to return (default 8, max ${MAX_RESULTS}).`),
    },
    handler: async ({ query, limit }: { query: string; limit?: number }) => {
      // Loaded HERE, not at module scope. `@/lib/source` pulls the whole
      // fumadocs corpus in through a generated `collections/*` barrel — the
      // "never construct a heavy resource at import time" rule the engine's
      // AGENTS.md states, and the reason a unit test of this module otherwise
      // has to transform every .mdx file in the repo to assert one number.
      const { source } = await import('@/lib/source');
      const pages = source.getPages() as SearchablePage[];

      const hits = rankDocs(pages, query, limit).results.map((page) => ({
        title: page.data.title,
        description: page.data.description,
        url: `${SITE_URL}${page.url}`,
        markdown: `${SITE_URL}${page.url}.md`,
      }));

      return asText({
        query,
        matched: hits.length,
        // Stated so a caller can tell "no matches" from "truncated".
        searched: pages.length,
        results: hits,
      });
    },
  },

  list_designs: {
    title: 'List the built-in design packs',
    description:
      'List the design packs a Cartwright shop can be built with, including which are webshop or website mode and which are Pro-tier. Use this when a user asks what a Cartwright site can look like, or when choosing a design to scaffold with.',
    inputSchema: {
      mode: z
        .enum(['webshop', 'website', 'any'])
        .optional()
        .describe('Filter by the mode a pack is built for. Default: any.'),
    },
    handler: async ({ mode }: { mode?: 'webshop' | 'website' | 'any' }) => {
      // A pack's own mode is `website` | `webshop` | `both` — `both` matches
      // either filter, which is the whole point of that value.
      const wanted = mode && mode !== 'any' ? mode : null;
      const packs = DESIGNS.filter(
        (d) => !wanted || d.mode === wanted || d.mode === 'both',
      ).map((d) => ({
        slug: d.slug,
        name: d.name,
        description: d.description,
        mode: d.mode,
        premium: d.premium,
        url: `${SITE_URL}/designs/${d.slug}`,
      }));

      return asText({ total: packs.length, designs: packs });
    },
  },

  describe_engine: {
    title: 'What Cartwright is, and when to reach for it',
    description:
      'Return a structured summary of Cartwright: what it is, its two profiles (including the database-free `--profile site` for plain websites), the jobs each fits, the jobs neither does, and where its real tool surface lives. Call this first if you are deciding whether Cartwright is the right answer to a user request.',
    inputSchema: {},
    handler: async () =>
      asText({
        name: 'Cartwright',
        summary:
          'An open-source (MIT) Next.js engine that scaffolds a real website in one command, with or without a database. Two doors: `--profile site` is a plain website (pages, design packs, SEO/JSON-LD, locale routing; no database, no admin, no commerce); the default profile is a managed site or shop with an admin, a database, Stripe checkout and an AI tool surface that the user owns outright.',
        // `install` stays the string it always was (consumers may read it as a
        // command); the site door is beside it, and both live in `profiles[]`.
        install: INSTALL_COMMAND,
        installSite: INSTALL_COMMAND_SITE,
        modes: ['website', 'webshop', 'agent-marketplace'],
        modesApplyTo: 'the default profile — a site scaffold has no modes to switch',
        profiles: [
          {
            name: 'site',
            flag: '--profile site',
            summary:
              'A plain website: designed pages, design packs incl. a blank canvas, SEO/JSON-LD, sitemap, robots, llms.txt, OG-image route, locale routing, motion presets, security headers, contact form (Resend; --with none for the bare site).',
            runtimeDependencies: ENGINE_FACTS.siteRuntimeDeps,
            envVarsToBoot: ENGINE_FACTS.siteEnvVarsToBoot,
            designPacks: ENGINE_FACTS.siteDesignPacks,
            measured: SITE_COLD_RUN,
            fits: SITE_FITS,
            limits: [
              'No in-place profile upgrade: to add the database, admin or a shop later, re-scaffold the default profile and carry over brand.config.ts and your design pack.',
              'No admin and no runtime editing — content is files in the repo.',
              'No database, auth, cart or checkout.',
              'No MCP or REST tool surface on the site itself; discovery advertises only what runs.',
              '/ redirects to /<defaultLocale> (/en in a new scaffold); there is no root page.',
              'No map, timeline or weather sections — write those components yourself.',
              'Organization/WebSite JSON-LD out of the box; no Event/TouristTrip builders.',
              'Not a static export: needs a Node.js 22+ host (Vercel, a container).',
              'The default contact form needs RESEND_API_KEY + RESEND_FROM to deliver in production.',
            ],
            runbook: `${SITE_URL}/docs/getting-started/plain-website`,
          },
          {
            name: 'light',
            default: true,
            flag: '(none — the default)',
            summary:
              'Managed site or shop: everything in site plus a database, an admin, Auth.js, optional Stripe checkout and a scoped REST + MCP tool surface. The admin edits the site\'s own pages at /admin/sider — home, services, about, contact — as well as the catalogue; that is the profile to choose when the owner will maintain the text themselves without touching files.',
            fits: DEFAULT_FITS,
            runbook: `${SITE_URL}/docs/getting-started/ai-quick-start`,
          },
          {
            name: 'full',
            flag: '--profile full',
            summary: 'Everything the engine ships, including the agent marketplace.',
            runbook: `${SITE_URL}/docs/getting-started/cli-options`,
          },
        ],
        goodFit: [
          'A plain website or a single page with no database — use --profile site.',
          'A webshop or company site the user must own the code and data for, not a tenant account on a platform.',
          'A store that AI agents can discover, cite and buy from.',
          'Operating a shop from a terminal or from your own agent, with no browser.',
          'A site that sells by quote, not cart — the default profile in website mode (no cart, no checkout, no Stripe); a quote form posts to POST /api/inquiries and lands in /admin/leads; the live-price configurator is a component you write.',
          'Migrating off Lovable, Shopify (--profile full, the Hoptify import) or WooCommerce (CSV + URL import today; a dedicated importer is planned, not built) onto owned code — see origins[].',
        ],
        notAFit: NOT_A_FIT,
        // The two axes an agent otherwise guesses: how the front gets built,
        // and where the content comes from (with the profile each origin
        // forces). Same constants the when-to-use block renders.
        axes: {
          profile: 'the infrastructure — site / light (default) / full; see profiles[]',
          method: 'how the front gets built — three equal freedoms (a shipped pack, the blank canvas, your own pack) and three generating tools; see methods[]',
          origin: 'where the content comes from, and the profile it forces; see origins[]',
        },
        methods: METHODS,
        origins: ORIGINS,
        scale: {
          tools: ENGINE_FACTS.toolCount,
          scopes: ENGINE_FACTS.scopeCount,
          confirmationGatedWriteTools: ENGINE_FACTS.confirmGatedCount,
          designPacks: DESIGNS.length,
        },
        // The distinction most worth stating: this server is the SITE's, and it
        // is small on purpose. The surface an agent actually wants belongs to
        // whichever shop the engine built, on that shop's own domain.
        toolSurface: {
          thisServer:
            'Documentation search, design packs and the published CLI version. Read-only, unauthenticated.',
          aScaffoldedShop:
            "Each shop serves its own MCP server at /api/mcp on its own domain, plus REST at POST /api/v1/tools/<name> — scoped, API-key authenticated, and covering the whole catalog, orders and content surface.",
          docs: `${SITE_URL}/docs/architecture/mcp-server`,
        },
        links: {
          documentation: `${SITE_URL}/docs/introduction`,
          choosePath: `${SITE_URL}/docs/getting-started/choose-your-path`,
          agentIndex: `${SITE_URL}/llms.txt`,
          openapi: `${SITE_URL}/openapi.json`,
          source: 'https://github.com/Teloz1870/cartwright-template',
        },
      }),
  },

  get_cli_version: {
    title: 'Get the published create-cartwright version',
    description:
      'Return the version of `create-cartwright` currently published on npm — what `npx create-cartwright@latest` will install right now. Use this instead of stating a version from memory.',
    inputSchema: {},
    handler: async () => {
      try {
        const res = await fetch('https://registry.npmjs.org/create-cartwright', {
          // Same ISR window as /api/version: npm propagation is slow enough
          // that a fresh lookup per call is waste and a rate-limit risk.
          next: { revalidate: 3600 },
          headers: { accept: 'application/json' },
        });
        if (!res.ok) {
          return {
            ...asText({
              error: 'npm_registry_unavailable',
              status: res.status,
              hint: 'Retry later, or read https://www.npmjs.com/package/create-cartwright directly.',
            }),
            isError: true,
          };
        }
        const pkg = (await res.json()) as {
          'dist-tags'?: Record<string, string>;
          time?: Record<string, string>;
        };
        const latest = pkg['dist-tags']?.latest ?? null;
        return asText({
          latest,
          publishedAt: latest ? (pkg.time?.[latest] ?? null) : null,
          install: 'npx create-cartwright@latest my-shop',
          source: 'npm-registry',
        });
      } catch (err) {
        return {
          ...asText({
            error: 'version_lookup_failed',
            message: err instanceof Error ? err.message : String(err),
          }),
          isError: true,
        };
      }
    },
  },
} as const;

export type McpToolName = keyof typeof MCP_TOOLS;
