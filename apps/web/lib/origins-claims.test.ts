import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MCP_TOOLS } from './mcp-tools';
import { METHODS, ORIGINS, WHEN_TO_USE } from './when-to-use';
import { routeExists } from './route-exists';

/**
 * The origin claims are a RATCHET.
 *
 * Until 2026-09-06 three surfaces sold a WooCommerce migration that does not
 * exist ("Hoptify can pull design + products across", "CSV covers catalog
 * exports from Shopify, WooCommerce, Magento and Squarespace", "column mapping
 * is configurable"). The V4 replay baseline measured what an AI did with that:
 * one run asserted that variants move, that `/?p=123` redirects work and that
 * "a Woo migration needs --profile full" — none true — and two more called
 * redirects undocumented (they exist; one clause on one page). So every
 * surface that names WordPress or WooCommerce must say, in the same file, what
 * is not built; the retired phrases can never return; and an origin may move
 * from planned to shipped only with a docs route that exists.
 *
 * Known limits (Gemini R2, nits 5-6), stated rather than hidden: the
 * promise-shape rule accepts any negation word within 150 chars, so "one-click
 * … no downtime" would pass — the reader of a review still has to read; and
 * the page-parity check matches names, not table cells. Both are ratchets
 * against the drift that was measured, not proofs of honesty.
 */
const ROOT = join(__dirname, '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

const SURFACES = [
  'lib/when-to-use.ts',
  'lib/mcp-tools.ts',
  'lib/comparisons.ts',
  'components/landing/faq.tsx',
  'content/docs/faq.mdx',
  'content/docs/features/product-variants.mdx',
  'content/docs/why-cartwright.mdx',
  'content/docs/getting-started/choose-your-path.mdx',
  'lib/use-cases.ts',
  // Widened after Gemini R2 (nit 4): pages that could grow a promise without
  // ever having sold one. The guards are cheap; the list is the known set of
  // surfaces that talk about migration or the profiles at all.
  'content/docs/getting-started/cli-options.mdx',
  'content/docs/getting-started/plain-website.mdx',
  'content/docs/in-the-box.mdx',
  'app/llms.txt/route.ts',
  'lib/home-markdown.ts',
  // The WooCommerce status page (TREND8-a) names the platform on nearly every line.
  'content/docs/migrate/woocommerce.mdx',
];

/** Every surface that promises redirects. Since engine v0.62.0 (RED1) the proxy serves them from the database when Redis is absent, so none may say Redis is required. */
const REDIRECT_SURFACES = ['lib/when-to-use.ts', 'lib/comparisons.ts', 'components/landing/faq.tsx', 'content/docs/faq.mdx', 'content/docs/why-cartwright.mdx', 'content/docs/getting-started/choose-your-path.mdx', 'content/docs/in-the-box.mdx', 'content/docs/migrate/woocommerce.mdx'];

/** Every surface that names Hoptify must couple it to --profile full within 600 chars. */
const HOPTIFY_SURFACES = [
  'lib/comparisons.ts',
  'lib/use-cases.ts',
  'lib/when-to-use.ts',
  'lib/mcp-tools.ts',
  'components/landing/faq.tsx',
  'content/docs/faq.mdx',
  'content/docs/why-cartwright.mdx',
  'content/docs/in-the-box.mdx',
  'content/docs/getting-started/choose-your-path.mdx',
  'app/(home)/onboarding/onboarding-client.tsx',
  'app/(home)/onboarding/page.tsx',
  // Falsifier R3 grepped all of apps/web: these three sold Hoptify with no profile.
  'app/(home)/pricing/page.tsx',
  'app/(home)/integrations/page.tsx',
  'content/docs/roadmap.mdx',
];

const RETIRED = [
  'pull design + products across',
  'covers catalog exports from',
  'column mapping is configurable',
];

describe('origin claims stay honest', () => {
  it.each(SURFACES)('%s never carries a retired phrase', (rel) => {
    const src = read(rel);
    for (const phrase of RETIRED) expect(src, phrase).not.toContain(phrase);
  });

  it.each(SURFACES)('%s qualifies every WordPress/WooCommerce mention that promises a move', (rel) => {
    // Window-level, not file-level: one honest sentence at the top of a file
    // must not license a new promise at the bottom (Gemini R1, nit 3). Only
    // promise-shaped windows count — "PHP + WordPress + MySQL" in a
    // comparison row is a description, not a migration claim.
    const src = read(rel);
    const PROMISE = /import|migrat|\bmove|bring[s]? [^.]{0,40}across|pull/i;
    const QUALIFIER = /not yet|planned, not built|not built|does not exist|no (dedicated|WordPress|WooCommerce)|simple products|by hand|Cartwright never runs on|never runs on PHP|WordPress hosting/i;
    for (const m of src.matchAll(/WooCommerce|WordPress/g)) {
      const window = src.slice(Math.max(0, m.index! - 700), m.index! + 700);
      if (!PROMISE.test(window)) continue;
      expect(window, `${rel} @${m.index}: "${src.slice(m.index!, m.index! + 60)}"`).toMatch(QUALIFIER);
    }
  });

  it.each(REDIRECT_SURFACES)('%s never says an admin-managed redirect needs Upstash Redis (engine v0.62.0, RED1)', (rel) => {
    // Per mention: the engine serves the redirect map from the database when
    // Redis is not configured (lib/redirects/load.ts), so "Redis required" is
    // now a false limit that would push a shop owner to buy what they do not need.
    const src = read(rel);
    const mentions = [...src.matchAll(/admin[- ]managed redirect|admin redirects/gi)];
    expect(mentions.length, rel).toBeGreaterThanOrEqual(1);
    for (const m of mentions) {
      const near = src.slice(Math.max(0, m.index! - 300), m.index! + 300);
      expect(near, `${rel} @${m.index}`).not.toMatch(/Redis required|need Upstash Redis|no redirect fires|nothing redirects|nothing at `\/admin\/redirects` fires/);
    }
  });

  it.each(HOPTIFY_SURFACES)('%s couples every Hoptify mention to --profile full (falsifier R2: /compare/shopify had none)', (rel) => {
    // Per mention, per surface: scoping this to one file left /compare/shopify
    // selling Hoptify with no profile and no limits.
    const src = read(rel);
    for (const m of src.matchAll(/Hoptify/gi)) {
      // 600 chars: an ORIGINS entry's `today` sits that far from its `minProfile`.
      const window = src.slice(Math.max(0, m.index! - 600), m.index! + 600);
      expect(window, `${rel} @${m.index}`).toMatch(/--profile[= ]full|profile full|full profile|only in full|minProfile: 'full'/);
    }
    expect(src).not.toContain('pull design and catalogue across');
    expect(src).not.toContain('pull your palette and products across');
  });

  it('the URL origin says imported services have no public page on a customer scaffold', () => {
    // Engine: app/[locale]/services/* is saas-gated (Teloz-only) and pruned by
    // the light profile; classify.ts still routes /services|ydelser|… there.
    const url = ORIGINS.find((o) => o.id === 'url')!;
    expect(url.notYet).toMatch(/public page for imported services/);
    expect(url.today).not.toMatch(/pages, services and posts/);
    expect(read('components/landing/faq.tsx')).toMatch(/no public page today/);
    expect(read('content/docs/getting-started/choose-your-path.mdx')).toMatch(/public page for imported services/);
  });

  it.each(SURFACES)('%s never states a promise-shaped migration claim without a negation beside it', (rel) => {
    // The window rule above accepts a promise that sits next to an honest
    // sentence (measured while proving it). Promise SHAPES are therefore
    // blocked outright unless negated within 150 chars — "A one-click
    // migration. There is no importer yet" passes; "One click imports your
    // whole catalogue. CSV covers simple products" does not.
    const src = read(rel);
    const SHAPES = [
      /one[- ]click/gi,
      /(whole|entire|full) (WooCommerce|WordPress|Shopify) (catalogue|catalog|site|shop|store)/gi,
      /(imports?|pulls?|brings?|moves?|migrates?) (your|the) (entire|whole|full|complete) /gi,
      /everything (moves|comes|carries) (across|over)/gi,
    ];
    const NEGATION = /not yet|there is no|\bno\b|\bnot\b|planned|not built|does not|never|cannot/i;
    for (const shape of SHAPES) {
      for (const m of src.matchAll(shape)) {
        const near = src.slice(Math.max(0, m.index! - 150), m.index! + 150);
        expect(near, `${rel} @${m.index}: "${m[0]}"`).toMatch(NEGATION);
      }
    }
  });

  it('the when-to-use block carries "not yet" and the query-permalink limit an AI otherwise promises', () => {
    expect(WHEN_TO_USE).toContain('Not yet:');
    expect(WHEN_TO_USE).toContain('/?p=123');
    expect(WHEN_TO_USE).toMatch(/planned, not built/);
  });

  it('describe_engine carries the axes, with the WooCommerce importer marked planned and Shopify pinned to full', async () => {
    const out = JSON.parse((await MCP_TOOLS.describe_engine.handler()).content[0].text) as {
      axes: Record<string, string>;
      methods: typeof METHODS;
      origins: typeof ORIGINS;
      goodFit: string[];
      links: { choosePath: string };
    };
    expect(Object.keys(out.axes).sort()).toEqual(['method', 'origin', 'profile']);
    expect(out.methods.map((m) => m.id)).toEqual(METHODS.map((m) => m.id));
    const woo = out.origins.find((o) => o.id === 'woocommerce')!;
    expect(woo.status).toBe('planned');
    expect(woo.notYet.length).toBeGreaterThan(40);
    expect(out.origins.find((o) => o.id === 'shopify')!.minProfile).toBe('full');
    expect(out.goodFit.join('\n')).toMatch(/planned, not built/);
    expect(routeExists(new URL(out.links.choosePath).pathname)).toBe(true);
  });

  it('comparison FAQ answers carry no backticks — they render as plain text and as FAQPage JSON-LD', () => {
    // Falsifier R3: `--profile full` rendered literally on /compare/shopify.
    expect(read('lib/comparisons.ts')).not.toMatch(/a: '[^']*`/);
  });

  it('the ratchet: exactly these origins are planned, and every origin points at a docs route that exists', () => {
    // Moving an origin to `shipped` is a one-line diff here — and it may only
    // happen with a runbook the reader can follow.
    expect(ORIGINS.filter((o) => o.status === 'planned').map((o) => o.id)).toEqual(['woocommerce']);
    for (const o of ORIGINS) expect(routeExists(o.docs), o.id).toBe(true);
  });
});

/**
 * The WooCommerce status page and the storefront route map, against the engine
 * (falsifier on app #410, measured on engine origin/main 1f861db2). Each pin is
 * a sentence that was false on that page, so it cannot come back.
 */
describe('the WooCommerce status page matches the engine', () => {
  const woo = read('content/docs/migrate/woocommerce.mdx');
  const lineWith = (src: string, needle: string) => src.split('\n').find((l) => l.includes(needle)) ?? '';

  it('dates trailingSlash routing to v0.60.0 (engine CHANGELOG v0.60.0), not v0.61.0', () => {
    const bullet = lineWith(woo, '`trailingSlash: true`');
    expect(bullet).toMatch(/v0\.60\.0/);
    expect(bullet).not.toMatch(/v0\.61\.0/);
  });

  it('names the Sheets sync for SKUs and the Drive folder import for media instead of saying nothing carries them', () => {
    // plugins/google-workspace/lib/sheets-sync.ts writes `sku`; drive-import.ts copies up to 50 images a run.
    expect(woo).not.toMatch(/do not move by any engine path|moves one file at a time/);
    expect(woo).toMatch(/`sheetsSync`[^\n]*`sku`/);
    expect(woo).toMatch(/`drive\.import_folder`[^\n]*\b50\b/);
  });

  it('caps a Drive folder at the 50 files one run reads, the same 50 every time (falsifier R4, MUST-FIX)', () => {
    // drive-import.ts lists the folder once with pageSize MAX_FILES_PER_IMPORT = 50 and no pageToken;
    // google/drive.ts orders by "modifiedTime desc,name". A file already in MediaAsset returns
    // { ok: true, skipped: false } and counts as imported, so a re-run looks like progress.
    const images = lineWith(woo, '**Images are stored as the URLs you give**');
    expect(images).not.toMatch(/up to 50 such images per run/);
    expect(images).toMatch(/Google Drive folders of at most 50 files each, images only/);
    // Falsifier R5 (NIT): Drive's pageSize is a maximum — a page may hold fewer files and still
    // carry a nextPageToken, which the import never follows — so 50 is a ceiling, not a count.
    expect(images).not.toMatch(/reads only the folder's first 50 files/);
    expect(images).toMatch(/reads at most the folder's first 50 files — the most recently modified first, with no next page, so at most the same 50 on every run/);
    expect(images).toMatch(/counts a file it copied on an earlier run as imported again/);
    expect(images).toMatch(/pass each folder's ID as `folderId` to `drive\.import_folder`/);
    expect(lineWith(woo, '**Copy the product images**')).toMatch(/Drive folders of at most 50 images each with `drive\.import_folder`, one folder per run/);
  });

  it('caps a product CSV import at the 1 MB a Server Action takes (falsifier R4, MUST-FIX)', () => {
    // app/admin/produkter/import/actions.ts importProductsAction(csvText) is a Server Action; the
    // engine's next.config.ts sets no experimental.serverActions.bodySizeLimit, and Next 16.4.2
    // defaults it to 1 MB (serverActions.md, "bodySizeLimit"). Measured: 1.2 MB → "Body exceeded 1 MB limit."
    const cap = lineWith(woo, '**Under 1 MB per file.**');
    expect(cap).toMatch(/Server Action[^\n]*caps a Server Action's request at 1 MB unless `experimental\.serverActions\.bodySizeLimit`[^\n]*the engine's does not/);
    expect(cap).toMatch(/fails as a whole[^\n]*nothing saved/);
    expect(cap).toMatch(/split the file into parts well under 1 MB/);
    expect(lineWith(woo, '**Copy the product images**')).toMatch(/`\/admin\/produkter\/import`, in files under 1 MB/);
  });

  it('pins the product CSV and redirect import limits as the engine sets them', () => {
    // lib/products-csv.ts: upsert per row, no dry run, categorySlug looked up in existing categories.
    // lib/redirects/import.ts REDIRECT_IMPORT_LIMITS = { maxRows: 2000, maxBytes: 256 * 1024 };
    // lib/redirects/load.ts TTL_MS = 60_000.
    expect(lineWith(woo, '**One row is one simple product**')).toMatch(/There is no dry run\./);
    expect(lineWith(woo, '**Row rules:**')).toMatch(/`categorySlug` must name a category that already exists — the import never creates one/);
    expect(lineWith(woo, '**The rules**')).toMatch(/at most 2,000 rows and 256 KB per file; status `301` \(the default\) or `302`/);
    expect(lineWith(woo, '**No Redis needed.**')).toMatch(/cached for 60 seconds per server instance/);
    expect(woo).toMatch(/^Each answers with a `308` \(not the table's `301`\)/m);
  });

  it('tells the owner a redirect source is matched undecoded, and that a slug with æ/ø/å cannot be kept', () => {
    // lib/redirects/match.ts looks map[path] up as the request sends it; import.ts and store.ts
    // only trim and strip the trailing slash. products-csv.ts: slug must match /^[a-z0-9-]+$/.
    const rules = lineWith(woo, '**The rules**');
    expect(rules).toMatch(/character for character, without decoding it[^\n]*percent-encoded/);
    expect(rules).toMatch(/`\/r%c3%b8d-stol` for an `ø`[^\n]*the case of those letters counts[^\n]*add a second row for `\/r%C3%B8d-stol`; a row for `\/rød-stol` itself never matches/);
    expect(woo).toMatch(/a Cartwright slug holds only `a–z`, `0–9` and `-`, so a slug with `æ`, `ø` or `å` gets a new one and its old address a row/);
  });

  it('says what step 9 shows under the default localePrefix: the 301, then next-intl\'s 307, then the 200', () => {
    // An old WordPress path has no locale, so the merchant redirect's destination has none
    // (lib/redirects/match.ts) and next-intl's middleware adds it with a 307 (proxy.ts).
    const step = lineWith(woo, '**Check from outside**');
    expect(step).toMatch(/`301`[^\n]*`307`[^\n]*`200`/);
    expect(step).toMatch(/localePrefix: "never"/);
  });

  it('names the old addresses the proxy never looks a redirect up for, and what the owner does instead', () => {
    // proxy.ts: the matcher leaves out every dotted path and anything starting /hero (no
    // slash after it); the lookup is skipped for startsWith("/api") / ("/admin") and comes
    // after the /oauth branch (lib/locale-exempt.ts). Under "never", next.config.ts sends
    // /om-os to /about and canonicalTrustRedirect sends /info/<alias> on before the lookup.
    // planRedirectImport accepts every one of those rows, so the dry run cannot warn.
    const bullet = lineWith(woo, '**Some paths never reach your redirects.**');
    expect(bullet).toMatch(/dry run counts it valid/);
    expect(bullet).toMatch(/dot anywhere[^\n]*`\/wp-content\/uploads\/`[^\n]*`matcher`/);
    expect(bullet).toMatch(/`\/hero`[^\n]*`\/heroes\/`/);
    expect(bullet).toMatch(/begins with `\/api` — `\/apiary\/` as well, since that check has no slash after it/);
    expect(bullet).toMatch(/`\/oauth`/);
    // Falsifier R4 (MUST-FIX): /administration skips the lookup only on its first request. The
    // admin branch takes /admin and /admin/… alone (proxy.ts), so under "always" next-intl's 307
    // adds /en and the row answers; under "never" next-intl rewrites, and it never does.
    expect(bullet).not.toMatch(/`\/apiary\/` and `\/administration\/`/);
    expect(bullet).toMatch(/localePrefix: "never"[^\n]*any other path that begins with `\/admin`, such as `\/administration\/`/);
    expect(bullet).toMatch(/With the default `"always"` all three reach your row/);
    expect(bullet).toMatch(/`\/administration\/` is skipped only on its first request: next-intl's `307` adds the language, and your row answers the request after it/);
    expect(lineWith(woo, '**Check from outside**')).toMatch(/begins with `\/admin` without being `\/admin` or below it, such as `\/administration\/`, has the two the other way round: the `307`, then your `301`/);
    expect(bullet).toMatch(/localePrefix: "never"[^\n]*`\/om-os`[^\n]*`next\.config\.ts`[^\n]*`\/info\/om-os`/);
    const instead = lineWith(woo, '**What to do with those instead.**');
    expect(instead).toMatch(/`redirects\(\)`[^\n]*`next\.config\.ts`[^\n]*before the proxy[^\n]*`\/favicon\.ico`/);
    expect(instead).toMatch(/host's or CDN's redirect rules/);
    // Step 6 must not leave the owner believing the dry run vetted them.
    expect(lineWith(woo, '**Write the redirect CSV**')).toMatch(/the dry run passes them/);
    // choose-your-path promises "a redirect for every old path you care about".
    const path = read('content/docs/getting-started/choose-your-path.mdx');
    expect(lineWith(path, 'an admin-managed redirect for every old path')).toMatch(/never a path with a dot[^\n]*`\/wp-content\/uploads\/`/);
  });

  it('step 9 counts Next\'s own 308 that an old slash address takes first when trailingSlash is off', () => {
    // next.config.ts sets skipTrailingSlashRedirect only with urls.trailingSlash on; off, Next
    // strips the slash with a 308 before the proxy runs (measured: demo.cartwright.app
    // /product-category/chairs/ → 308 → 307 → 404).
    const step = lineWith(woo, '**Check from outside**');
    expect(step).toMatch(/`trailingSlash` off[^\n]*`308`[^\n]*`301`[^\n]*`307`/);
    expect(step).toMatch(/or one the proxy never sees/);
  });

  it('step 9 gives an old slash address that is already a route its 308 before the 307, not the 307 alone', () => {
    // WooCommerce's product address is also an engine route (app/[locale]/product/[slug]).
    // Measured on demo.cartwright.app 2026-10-24 (trailingSlash off, localePrefix "always"):
    // /product/ethiopia-yirgacheffe/ → 308 /product/ethiopia-yirgacheffe → 307 /en/product/… → 200,
    // and the same path without the slash → 307 → 200.
    const step = lineWith(woo, '**Check from outside**');
    expect(step).not.toMatch(/`\/product\/<slug>\/`, answers with the `307` alone/);
    expect(step).toMatch(/`\/product\/<slug>\/` answers the `308`, then the `307`, then `200`/);
    expect(step).toMatch(/without the `\/` answers the `307` alone/);
    // Falsifier R4 (NIT): that 308 is Next's own trailing-slash redirect, so it is there only with
    // trailingSlash off; with it on and "always", both forms answer next-intl's 307 alone.
    expect(step).toMatch(/with `trailingSlash` off, the old shop's `\/product\/<slug>\/` answers the `308`[^\n]*; with it on, both answer the `307` alone/);
    // Under "never" the route still takes the 308 first when it ends in `/` — but only with
    // trailingSlash off: with it on, next.config.ts sets skipTrailingSlashRedirect (falsifier R3).
    expect(step).toMatch(/localePrefix: "never"[^\n]*with `trailingSlash` off, an address ending in `\/` has the `308` in front/);
    expect(step).toMatch(/`localePrefix: "never"`, a redirected address is `301` then `200`/);
    // Falsifier R5 (NIT): under "never" with trailingSlash on, a route asked for without the slash
    // takes the proxy's own 308 first (trailingSlashRedirect, lib/urls.ts; proxy.ts URL2), measured
    // /product/blue-chair → 308 /product/blue-chair/ → 200. A redirect row matches either form and
    // its destination carries the slash (lib/redirects/match.ts), so /gammel and /gammel/ → 301 /ny/.
    expect(step).not.toMatch(/one that is already a route answers `200` directly/);
    expect(step).toMatch(/one that is already a route answers `200` without a `301`; with `trailingSlash` off/);
    expect(step).toMatch(/with it on, an address ending in `\/` answers directly, and a route asked for without the `\/` takes the proxy's `308` to the slash form first/);
    expect(step).toMatch(/a redirected address answers its `301` in either form, since the destination carries the slash/);
  });

  it('step 9 ends an /admin address on the login page, not a 404 (falsifier R5, NIT)', () => {
    // proxy.ts: /admin and /admin/… skip the redirect lookup and hit the admin gate, which answers a
    // request without a session with a 307 to /account/login. Under "always" /administration first
    // takes next-intl's 307 to /en/administration; with no row there, LOCALE_ADMIN_RE (^/(en)/admin,
    // no boundary) sends it to the same gate. Measured: → 307 /en/administration → 307 /account/login.
    const step = lineWith(woo, '**Check from outside**');
    expect(step).toMatch(/A `404` at the end is an address with no row and no page yet, or one the proxy never sees \(above\)\. The exception is an address under `\/admin`/);
    expect(step).toMatch(/`\/admin` and everything below it, and under the default `"always"` a path such as `\/administration\/` with no row, take the admin gate's `307` to `\/account\/login` \(`proxy\.ts`\) and end on the login page with a `200`/);
  });

  it('ties the second 308 after a next.config.ts query rule to localePrefix "never" (falsifier R4, NIT)', () => {
    // Under "always" next-intl's 307 adds the slash itself (proxy.ts URL2 comment); only under
    // "never" does the proxy's trailingSlashRedirect answer a slashless destination with a 308.
    const para = lineWith(woo, 'Each answers with a `308`');
    expect(para).toMatch(/under `localePrefix: "never"` a destination without it takes a second `308` to the slash form; under the default `"always"` next-intl's `307` adds the slash either way/);
    expect(para).not.toMatch(/or the proxy adds a second `308`/);
  });

  it('keeps the legacy Danish segments to the configured languages, and the scaffold examples on /en/', () => {
    // proxy.ts LEGACY_SLUG_RE is built from LOCALE_ALTERNATION (brand.locales), so /da/produkt/x on
    // an en-only scaffold is not a legacy match (measured: 307 /en/da/produkt/x).
    expect(lineWith(woo, '**Seven Danish segments answer first.**')).toMatch(/with or without a configured language in front/);
    expect(read('content/docs/features/auth-magiclink.mdx')).toContain('(for example `/en/account/login`)');
    expect(read('content/docs/recipes/new-industry-template.mdx')).toContain('`/en/category/sunglasses` (your locale and slug)');
  });

  it('pins the MobilePay box to Stripe\'s published values and categories.list to its own scope', () => {
    // docs.stripe.com/payments/mobilepay: customers in DK/FI, DKK/EUR/NOK/SEK, 35 DKK a month for
    // a Danish business. lib/tools/categories.ts: categories.list scope "categories:read".
    const live = read('content/docs/deployment/go-live.mdx');
    expect(lineWith(live, '**Who sees it:**')).toMatch(/customers in Denmark and Finland, on an order charged in DKK, EUR, NOK or SEK\./);
    expect(lineWith(live, '**What it costs:**')).toMatch(/a fixed 35 DKK a month for a business registered in Denmark\./);
    const mcp = read('content/docs/api/mcp-tools.mdx');
    expect(mcp).toContain('| `categories.list` | `categories:read` |');
    expect(mcp).toContain('`categories.list` requires `categories:read` (`lib/tools/categories.ts`)');
  });

  it('scopes the query-string limit to the redirect table and gives the owner the next.config.ts `has` query rule', () => {
    // Only the table is path-only (falsifier R3, MUST-FIX): matchRedirect looks a row up by the
    // pathname, so a `/?p=123` row is planned valid and never fires, and the source `/` is refused
    // (redirectInputError). A redirects() rule in next.config.ts can match the query — Next 16.4.2
    // redirects.md, "Header, Cookie, and Query Matching" — and runs before proxy.ts (proxy.md,
    // "Execution order"). Measured 2026-10-24 on a Next 16.4.2 app whose proxy redirects `/`:
    // /?p=123 → 308 /product/blue-chair?p=123, /?p=124 → the proxy's 307.
    expect(woo).not.toMatch(/cannot be redirected/);
    const bullet = lineWith(woo, '**The redirect table matches paths only.**');
    expect(bullet).toMatch(/`\/admin\/redirects` cannot redirect a query-string address/);
    expect(bullet).toMatch(/dry run counts it valid[^\n]*never fires/);
    expect(woo).toContain('has: [{ type: "query", key: "p", value: "123" }]');
    expect(lineWith(woo, '**Write the redirect CSV**')).toMatch(/`\/\?p=123`[^\n]*`type: "query"`/);
  });

  it('names /en/ as a scaffold\'s language and keeps orders and customers at "do not move"', () => {
    // apps/cli/src/scaffold.ts patchBrandConfigForEnglishFirst: locales ["en"], defaultLocale "en".
    // Only the engine repo itself ships "da" first.
    expect(woo).not.toMatch(/`\/da\/(product\/<slug>\/|…)` as shipped/);
    expect(lineWith(woo, '**Check from outside**')).toMatch(/`defaultLocale`[^\n]*`\/en\/…` in a shop from `npx create-cartwright`/);
    const map = read('content/docs/features/customer-storefront.mdx');
    expect(lineWith(map, 'The customer storefront covers')).toMatch(/`\/en\/product\/<slug>` in a shop from `npx create-cartwright`/);
    // Engine CHANGELOG v0.59.0 adds externalId/source to orders and customers for a later import.
    expect(woo).not.toMatch(/Orders and customers never move/);
    expect(lineWith(woo, '**Orders and customers do not move:**')).toMatch(/v0\.59\.0[^\n]*the import that would fill them is not built/);
  });

  it('does not say the admin redirect preview lists every row (it shows counts and errors)', () => {
    // app/admin/redirects/RedirectsManager.tsx renders the summary and ErrorLines only;
    // the per-row plan is the redirects.import tool's dryRun output.
    expect(woo).not.toMatch(/dry run shows every row/);
    expect(lineWith(woo, '**Admin-managed redirects**')).toMatch(/does not list the valid rows[^\n]*`dryRun: true` returns[^\n]*every row/);
  });

  it('describes the cart and checkout the storefront actually renders', () => {
    // app/[locale]/cart/page.tsx: line items + flat shipping, no discount field or calculator;
    // components/CheckoutForm.tsx: delivery details + discount code, no delivery-method choice.
    const map = read('content/docs/features/customer-storefront.mdx');
    const cart = lineWith(map, '**`/[locale]/cart`**');
    const checkout = lineWith(map, '**`/[locale]/checkout`**');
    expect(cart).not.toMatch(/shipping calculator|discount[- ]code (field|input)/i);
    expect(cart).toMatch(/takes no discount code/);
    expect(checkout).not.toMatch(/delivery selection/i);
    expect(checkout).toMatch(/optional discount code/);
    expect(checkout).toMatch(/no delivery-method choice/);
    // Falsifier R5 (Gemini NIT3): CheckoutForm.tsx renders StripePaymentPanel (:147), and
    // StripePaymentPanel.tsx renders <PaymentElement /> (:150) — one name for the file, on both pages.
    const panel = /Payment Element, which (the form|the checkout form \(`components\/CheckoutForm\.tsx`\)) renders through `components\/StripePaymentPanel\.tsx`/;
    expect(checkout).toMatch(/in the checkout form \(`components\/CheckoutForm\.tsx`\)/);
    expect(checkout).toMatch(panel);
    expect(lineWith(read('content/docs/deployment/go-live.mdx'), 'automatic_payment_methods')).toMatch(panel);
  });
});
