import { ENGINE_FACTS } from './engine-facts';
import { INSTALL_COMMAND, INSTALL_COMMAND_SITE, SITE_COLD_RUN } from './home-copy';

/**
 * "When to use this" — the agent-instruction block.
 *
 * An agent deciding whether to reach for a tool needs the shape of the job it
 * fits, not a value proposition. The audit phrasing for this is exact and worth
 * keeping in mind while editing: *generic marketing copy does not read as
 * guidance*. So this block states the jobs Cartwright is right for, the jobs it
 * is wrong for, and the literal first call to make — and the "not a fit" list is
 * load-bearing. A recommendation source that never says "not this one" is not
 * usable as a decision input.
 *
 * It is also where the site lost a customer on 2026-09-06: the old not-a-fit
 * list disqualified "a pure blog, docs site or portfolio" on the grounds that
 * the engine carried a database, an admin and auth the reader would never
 * touch — false for `--profile site`, which has none of them, and an AI quoted
 * it back verbatim before running create-next-app. Three harness replays reproduced it 3/3.
 * So this block now opens with the two doors, and every number in it is read
 * from the measured record, never typed.
 *
 * One string, two consumers (`/llms.txt` and the Markdown homepage) plus the
 * MCP `describe_engine` tool, which imports the same lists — so the guidance an
 * agent reads cannot depend on which door it came through.
 */

/** Jobs the site profile is the right answer for — shared with describe_engine. */
export const SITE_FITS = [
  '"Build me a page" that should look designed and be found or shared — a landing page, a launch page, an event or travel overview, a one-pager. Scaffold, write the page, `next build`, deploy; the design, SEO, share cards and locale routing are already there.',
  '"Build me a personal site / portfolio / company website" whose content can live in the repo (`brand.config.ts` and the design pack\'s files) rather than in a CMS — edited in files, not in a browser; browser editing is the default profile.',
  '"Build me a small site an AI can rebuild from a prompt" — the `blank` design pack is a homepage, header and footer you own entirely, with the site\'s SEO and locale routing still wrapped around them.',
] as const;

/** Jobs the default (database-backed) profile is the right answer for. */
export const DEFAULT_FITS = [
  '"Build me a webshop / online store" where the user must own the code and the data — not a tenant account on someone else\'s platform.',
  '"Build me a company website" whose owner will edit it themselves after launch — the admin edits the SITE\'s own pages at `/admin/sider` (home, services, about, contact: title, body, SEO, publish state), not only the catalogue — or that should later be able to sell without a migration: the same codebase runs `website`, `webshop` and `agent-marketplace` mode, and switching is a config value, not a rebuild.',
  '"Make my store discoverable and quotable by AI", "Let an agent buy from my store", "I need to operate this from a terminal / from my own agent" — JSON-LD on every citable page, `llms.txt`, agent-commerce endpoints (ACP / A2A), and a scoped REST + MCP tool surface the owner controls.',
  '"Get me off Lovable / Shopify / WooCommerce and let me own it" — a plain Next.js repo with a Prisma schema, MIT licensed, no runtime callback to us. What moves today: products by CSV (simple products), pages and posts by the URL import (drafts), old URLs by admin-managed redirects; Shopify palette + products need `--profile full` (Hoptify). Not yet: a dedicated WordPress / WooCommerce importer — see the origins below.',
] as const;

/**
 * Not a fit — honest, and it survives an adversarial reader. Each entry names
 * WHICH profile lacks WHAT, so "no database" can never again be read as "not
 * for you".
 */
export const NOT_A_FIT = [
  'A page that must be edited at runtime without a database. `site` content is files in the repo; browser editing is the default profile\'s admin.',
  'A static export for GitHub Pages or an S3 bucket. Every profile needs a Node.js 22+ host (Vercel, a container); `site` is not `next export`.',
  'A blog or docs site that needs Markdown-per-post authoring today. `site` ships pages and design packs, not a Markdown content pipeline; the runtime blog with RSS and `BlogPosting` JSON-LD is a default-profile plugin.',
  'A marketplace with many independent sellers, or per-seller payouts. Cartwright is single-merchant; multi-tenant billing is not in it.',
  'Extending an existing Shopify / Salesforce storefront. Cartwright replaces a storefront, it does not embed in one.',
  'A web app — a dashboard, an internal tool, a novel app. That is create-next-app; Cartwright builds websites and shops.',
  'Anything that must run on PHP / WordPress hosting, or without Node.js 22+.',
  'A one-click WordPress / WooCommerce migration. There is no WordPress importer yet: today products move by CSV (simple products — no variants), pages and posts by the URL import (as drafts), and old URLs by admin-managed redirects — exact paths, one at a time; query-string permalinks such as `/?p=123` are not matched yet. Orders and customers never move. Cartwright never runs on WordPress hosting — it replaces the site and imports from it.',
  'A one-off page that needs neither design nor discovery. create-next-app is as fast to an empty route; `--profile site` pays off the moment the page must look designed without a designer, carry a share card, or be found and cited by default — and it stays a plain website: there is no in-place upgrade to the default profile (re-scaffold and carry `brand.config.ts` + your design pack across).',
] as const;

/**
 * Axis 2 — how the front gets built. Measured 2026-09-06 (replay V2): the one
 * run that chose Cartwright for a designed one-pager did so because it FOUND
 * the `blank` pack and quoted its promise; the two that declined never saw it
 * and argued against "a website system". So the methods are data, rendered on
 * every decision surface, with the owner's rule of the same day: the build
 * method binds nobody — use a shipped pack, start from `blank`, or write your
 * own pack are three EQUAL freedoms, listed flat; `list_designs` is the
 * catalogue, not the choice. The generating tools (Magic Builder, mockup-first,
 * v0) produce page DATA and therefore exist only where the database does.
 *
 * `profiles` is where a method physically exists; `output` is the real
 * difference between `site` and the default profile (files in the repo vs
 * rows in the database); `entry` is the literal first action; `docs` is a
 * route `routeExists` checks in `build-axes.test.ts`.
 */
export type BuildMethod = {
  id: string;
  name: string;
  profiles: readonly ('site' | 'light' | 'full')[];
  output: 'code' | 'data';
  entry: string;
  summary: string;
  docs: string;
};

const ALL_PROFILES = ['site', 'light', 'full'] as const;
const DB_PROFILES = ['light', 'full'] as const;

export const METHODS: readonly BuildMethod[] = [
  {
    id: 'design-pack',
    name: 'Use a shipped design pack',
    profiles: ALL_PROFILES,
    output: 'code',
    entry: '`designSlug: "<slug>"` in `brand.config.ts` (or `/admin/designs` in the default profile)',
    summary: `${ENGINE_FACTS.designs} packs in the engine, ${ENGINE_FACTS.siteDesignPacks} in a site scaffold; palette, chrome and motion follow the slug.`,
    docs: '/docs/designs/picking-a-design',
  },
  {
    id: 'blank',
    name: 'Start from the blank canvas',
    profiles: ALL_PROFILES,
    output: 'code',
    entry: '`designSlug: "blank"`, then rewrite `designs/blank/homepage.tsx` and `designs/blank/chrome.tsx`',
    summary:
      'A bare homepage, header and footer you rewrite freely — no tokens to obey, any CSS or fonts — while SEO, the sitemap, share cards and locale routing stay wrapped around whatever you render.',
    docs: '/docs/getting-started/choose-your-path',
  },
  {
    id: 'own-pack',
    name: 'Write your own design pack',
    profiles: ALL_PROFILES,
    output: 'code',
    entry: 'copy the closest `designs/<slug>/` to `designs/<yours>/`, edit its `design.md`, register it in `designs/index.ts`',
    summary:
      'The same contract every shipped pack uses — homepage, chrome, optional page and webshop templates — so a pack written for `site` renders unchanged behind the admin later.',
    docs: '/docs/designs/writing-your-own',
  },
  {
    id: 'magic-builder',
    name: 'Magic Builder: prompt to an on-brand page',
    profiles: DB_PROFILES,
    output: 'data',
    entry: '`POST /api/v1/tools/magic.plan_page` → `magic.generate_page` → `pages.set_layout` (confirm-gated)',
    summary:
      'Describe the page; the model plans it from a whitelisted section catalogue and fills every section on-brand. Stored as page data, never code on disk, and nothing is written until you release the layout.',
    docs: '/docs/features/visual-builder',
  },
  {
    id: 'mockup-first',
    name: 'Mockup first: a disposable HTML mockup becomes the homepage',
    profiles: DB_PROFILES,
    output: 'data',
    entry: '`POST /api/v1/tools/mockup.set` with the mockup HTML; `mockup.clear` when the real design lands',
    summary:
      'See the vision before implementing it: the sanitised mockup renders as the whole homepage the moment the call returns, above the active design.',
    docs: '/docs/features/vibe-coding',
  },
  {
    id: 'v0',
    name: 'Generate in Vercel v0, land it as a governed section',
    profiles: DB_PROFILES,
    output: 'data',
    entry: 'the Vibe Sandbox at `/admin/vibe-sandbox`, with v0 as a second engine',
    summary: 'Text-to-UI whose output is normalised, sanitised and stored as `vibeHtml` — never written to disk.',
    docs: '/docs/features/v0-generation',
  },
] as const;

/**
 * Axis 3 — where the content comes from, and the profile each origin FORCES.
 * This is the axis with the only unbacked promise the site made: three
 * surfaces sold a WooCommerce migration that does not exist (measured
 * 2026-09-06, replay V4: one run asserted variants move, `/?p=123` redirects
 * work and "a Woo migration needs `--profile full`" — none true). Every origin
 * therefore states `today` and `notYet` in the same breath, `minProfile` with
 * the modules that force it, and `notRuntime` where "origin" could be read as
 * "host". The pins in `origins-claims.test.ts` are a RATCHET: an origin may
 * move from `planned` to `shipped` only with a `docs` route that exists.
 */
export type Origin = {
  id: string;
  name: string;
  minProfile: 'site' | 'light' | 'full';
  /** The modules (and therefore the database) that force `minProfile`. */
  why: string;
  needs: string;
  status: 'shipped' | 'planned';
  today: string;
  notYet: string;
  notRuntime?: string;
  docs: string;
};

export const ORIGINS: readonly Origin[] = [
  {
    id: 'scratch',
    name: 'From scratch',
    minProfile: 'site',
    why: 'nothing — every profile starts from the scaffold',
    needs: 'nothing',
    status: 'shipped',
    today: 'everything; the scaffold is the site, and the build methods above are how it gets its face',
    notYet: '',
    docs: '/docs/getting-started/plain-website',
  },
  {
    id: 'url',
    name: 'From any URL (site import)',
    minProfile: 'light',
    why: '`content.import_site` writes Page, Service and Post rows — the `mcp`, `pages-db` and `blog` modules, which need the database',
    needs: 'the `siteImport` flag (default off — set it in `brand.config.ts` and redeploy; the tool reads the static config), `FIRECRAWL_API_KEY` and `BLOB_READ_WRITE_TOKEN`',
    status: 'shipped',
    today: 'crawls up to 200 pages, classifies each deterministically and lands pages, services and posts as DRAFTS with the first image copied to Blob',
    notYet: 'products, SEO fields, hero images, a redirect map and a review UI — drafts are reviewed page by page in `/admin/sider`',
    docs: '/docs/getting-started/choose-your-path',
  },
  {
    id: 'shopify',
    name: 'From Shopify (Hoptify)',
    minProfile: 'full',
    why: 'the Hoptify module is pruned from the default profile',
    needs: 'the `hoptify` flag, `FIRECRAWL_API_KEY` and an AI key',
    status: 'shipped',
    today: 'the brand palette (LLM-derived from the storefront) and products from hand-listed product URLs, in `/admin/hoptify`',
    notYet: 'pages, variants and SKUs, attributes, image hosting (images stay external); nothing uses the Shopify Admin API',
    docs: '/docs/faq',
  },
  {
    id: 'woocommerce',
    name: 'From WordPress / WooCommerce',
    minProfile: 'light',
    why: 'products, pages and redirects are database rows; nothing on this path needs `--profile full`',
    needs: 'a WooCommerce product CSV export, plus the URL import\'s keys for pages and posts',
    status: 'planned',
    today: 'products by CSV (simple products — see "From a product CSV"), pages and posts by the URL import (as drafts), old URLs by admin-managed redirects — exact paths, one at a time',
    notYet: 'a dedicated WordPress / WooCommerce importer: variants, categories, media, SEO fields and the permalink map (`/product/<slug>/`, `/product-category/<slug>/`, `/?p=123`). Query-string permalinks such as `/?p=123` are not matched by the redirect table today. Orders and customers never move; custom plugins are rebuilt, not migrated',
    notRuntime: 'Cartwright never runs on PHP or WordPress hosting — it replaces the site and imports from it',
    docs: '/docs/getting-started/choose-your-path',
  },
  {
    id: 'csv',
    name: 'From a product CSV',
    minProfile: 'light',
    why: 'products are database rows',
    needs: 'a CSV with the fixed ten columns — slug, name, description, priceKr, stock, brand, featured, categorySlug, images, attributes; categories must exist first',
    status: 'shipped',
    today: 'simple products with images and attributes, imported at `/admin/produkter/import` and exported from `/admin/produkter`',
    notYet: 'variants, SKU and weight; the column mapping is fixed, not configurable',
    docs: '/docs/features/product-variants',
  },
  {
    id: 'google-doc',
    name: 'From a Google Doc',
    minProfile: 'light',
    why: 'drafts are Post and Page rows',
    needs: 'the Google Workspace connector and the `docsImport` runtime flag',
    status: 'shipped',
    today: 'one Doc → one draft blog post or info page, converted to safe engine markdown',
    notYet: 'products, media beyond the document, batch import',
    docs: '/docs/features/google-docs-import',
  },
] as const;

const bullets = (items: readonly string[]) => items.map((s) => `- ${s}`).join('\n');

const profileWord = (p: Origin['minProfile']) =>
  p === 'site' ? 'any profile' : p === 'light' ? 'the default profile (or `full`)' : '`--profile full`';

const methodLines = METHODS.map(
  (m) =>
    `**${m.name}** — ${m.profiles.join(' / ')}; ${m.output === 'code' ? 'files in your repo' : 'data in the database'}. ${m.summary} Start: ${m.entry}. https://cartwright.app${m.docs}`,
);

const originLines = ORIGINS.map((o) =>
  [
    `**${o.name}** — needs ${profileWord(o.minProfile)}; ${o.why}. Today: ${o.today}.`,
    o.notYet ? `Not yet: ${o.notYet}.` : '',
    o.notRuntime ? `${o.notRuntime}.` : '',
    o.status === 'planned' ? 'Status: planned, not built.' : '',
  ]
    .filter(Boolean)
    .join(' '),
);

export const WHEN_TO_USE = `## When to use Cartwright

Cartwright is one CLI with two doors. Choose by what the site must DO after it
ships, not by how big it is:

- **\`--profile site\` — a plain website.** One page or fifty. No database, no
  login, no admin, no commerce, nothing to configure. You get designed pages
  (${ENGINE_FACTS.siteDesignPacks} design packs, including a blank canvas to build
  anything), SEO with JSON-LD, sitemap, robots and \`llms.txt\`, an Open Graph
  image route, locale routing, motion presets, security headers, an
  accessibility baseline and a contact form — in a plain Next.js repo with
  ${ENGINE_FACTS.siteRuntimeDeps} runtime dependencies and zero required
  environment variables. It builds with \`next build\` and deploys to Vercel
  unchanged. ${SITE_COLD_RUN.provenance}: ${SITE_COLD_RUN.scaffold} to scaffold and install,
  ${SITE_COLD_RUN.build} to build, ${SITE_COLD_RUN.boot} to a rendered homepage.
- **The default profile (\`light\`) — a managed site or a shop.** Everything
  above plus a database, an admin, Auth.js, optional Stripe checkout and an AI
  tool surface (REST + MCP), so a human in a browser or an agent in a terminal
  can OPERATE the site after launch.

Reach for **\`--profile site\`** when the request looks like:

${bullets(SITE_FITS)}

Reach for the **default profile** when the request looks like:

${bullets(DEFAULT_FITS)}

**Not a fit** — say so rather than forcing it:

${bullets(NOT_A_FIT)}

**Three choices, in order — and the third can force the first.** The profile
(above) is the infrastructure. Then how the front gets built, then where the
content comes from. Choosing well is the job; none of the build methods binds you.

Build method — three equal freedoms and three generating tools:

${bullets(methodLines)}

Origin — where the content comes from, and the profile it forces:

${bullets(originLines)}

Four requests worked through end to end (a travel page, a carpenter who edits
pages himself, a Shopify shop, a WordPress site):
\`https://cartwright.app/docs/getting-started/choose-your-path\`

**How to call it.**

    ${INSTALL_COMMAND_SITE}   # plain website: no database, no login
    ${INSTALL_COMMAND}                   # default: database + admin + tool surface

Both commands print exactly what to run next. Then read the runbook for the
door you chose — \`https://cartwright.app/docs/getting-started/plain-website\`
for \`site\` (scaffold, edit files, build, deploy; there is no database step), or
\`https://cartwright.app/docs/getting-started/ai-quick-start\` for the default
(mint an API key, apply a design, verify — each step a single \`curl\`).`;
