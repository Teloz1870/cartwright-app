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

  it('caps a Drive folder at the 50 files one run reads, the same 50 while its 50 newest stay the same (falsifier R4, MUST-FIX)', () => {
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
    // Falsifier R1 on app#412 (NIT): the order is "modifiedTime desc,name", so "the same 50" holds
    // only while the folder's 50 newest stay the same — a file with a later modifiedTime enters them.
    expect(images).toMatch(/the same 50 on every run while the folder's 50 most recently modified files stay the same; a file edited later, or added with a later modified time, moves into them/);
    expect(images).not.toMatch(/a second run on a fuller folder/);
    // Falsifier R2 on app#412 (NIT): the order pin stopped at "moves into them", so the clause after it
    // could say "newest" and stay green. A folder past 50 files loses its least recently modified one.
    expect(images).toMatch(/moves into them, and past 50 files the oldest drops out — and counts/);
    // Falsifier R2 on app#412 (NIT): drive-import.ts put()s the bytes to Blob BEFORE
    // findOrCreateBySha256 returns an existing asset with the same sha256, and only a matching
    // driveFileId skips the download. A file whose bytes the library already holds under another
    // driveFileId (or none) writes a new, unused Blob object on every run; the library gains nothing.
    expect(images).not.toMatch(/copies nothing new/);
    expect(images).toMatch(/a second run on an unchanged folder of more than 50 reports the same number and adds nothing new to the media library \(a copy of an image it already holds from elsewhere is still uploaded to Blob again on each run, unused\)/);
    expect(images).toMatch(/counts a file it copied on an earlier run as imported again/);
    // Falsifier R3 on app#412 (NIT): drive-import.ts takes IMAGE_MIME = jpeg/png/webp and
    // MAX_IMAGE_BYTES = 5_000_000, and findOrCreateBySha256 (lib/media/asset.ts) returns an existing
    // asset for bytes the library already holds — so only a NEW image gets an entry and URL of its own.
    expect(images).toMatch(/\. Each new JPEG, PNG or WebP up to 5 MB among them goes into the media library \(`\/admin\/media`\) on its own Blob URL/);
    // lib/tools/images.ts: MAX_IMAGE_BYTES = 5_000_000, SNIFF_MIMES jpeg/png/webp (+ mp4 at 10 MB).
    expect(images).toMatch(/`images\.import_from_url` tool \(`lib\/tools\/images\.ts`, over `POST \/api\/v1\/tools\/images\.import_from_url` — \[MCP tools\]\(\/docs\/api\/mcp-tools\); JPEG, PNG or WebP up to 5 MB, needs `BLOB_READ_WRITE_TOKEN`\)/);
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
    const hops = lineWith(woo, '**The hops before it.**');
    expect(hops).toMatch(/The old shop's addresses carry no language, and a redirect keeps the language of the request \(`lib\/redirects\/match\.ts`\), so with the default `localePrefix: "always"` a redirected address answers `301` to the new page without a language, then next-intl's `307` to that page in a language[^\n]*and `200` there/);
    expect(hops).toMatch(/The `307` is temporary because the language depends on who asks\./);
    expect(hops).toMatch(/localePrefix: "never"/);
    // Falsifier R3 on app#412 (NIT): the `[^\n]*` gap above let the language clause say "not the
    // defaultLocale", "any language the browser asks for", or lead with a /da/ example. next-intl
    // (i18n/routing.ts: defaultLocale = brand.defaultLocale) uses it when the request names no
    // locale it has; a scaffold is locales ["en"] (apps/cli/src/scaffold.ts).
    expect(hops).toMatch(/then next-intl's `307` to that page in a language — the shop's `defaultLocale` for a request like curl's that asks for none \(`\/en\/…` in a shop from `npx create-cartwright`, which starts English-only\), or a language the browser asks for that the shop has — and `200` there \(`proxy\.ts`\)\./);
  });

  it('step 9 restores the /admin-prefixed exception to the hop order (falsifier R3 on app#412, MUST-FIX)', () => {
    // proxy.ts skips the redirect lookup for pathname.startsWith("/admin") with no slash after it,
    // and the admin gate takes only /admin, /admin/… and /<locale>/admin…. So a row for /admin-old
    // fires on the SECOND request, after next-intl's 307 has added the language. Measured (real
    // next dev, engine 1f861db2, row /admin-old → /contact, "always"): trailingSlash off:
    // /admin-old/ → 308 /admin-old → 307 /en/admin-old → 301 /en/contact → 200; on:
    // /admin-old/ → 307 /en/admin-old/ → 301 /en/contact/ → 200 — the 301 is not first.
    const hops = lineWith(woo, '**The hops before it.**');
    expect(hops).toMatch(/Under `"always"` a row whose source only begins with `\/admin`, such as `\/administration\/` or `\/admin-old\/`, is the exception, with `trailingSlash` on or off: the lookup skips that address's first request \(above\), so the row fires one hop later, on the request that carries the language — next-intl's `307` comes before your `301`, and the `301` goes to the new page already in that language\./);
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
    const hops = lineWith(woo, '**The hops before it.**');
    expect(hops).toMatch(/With `trailingSlash` off \(the default\), an old address that ends in `\/` first answers Next's own `308` to the same path without it \(`next\.config\.ts` turns that redirect off only together with `trailingSlash`\), and the hops below come after that one\./);
    expect(hops).toMatch(/`trailingSlash` off[^\n]*`308`[^\n]*`301`[^\n]*`307`/);
  });

  it('step 9 reads the END of the chain: three end states, each true whatever the URL options (falsifier R2 on app#412)', () => {
    // The hop lists of R3–R5 kept growing a new exception per round. Step 9 now says what each
    // last status line means — a meaning that holds by construction of proxy.ts — and keeps only
    // the short chains whose conditions it states.
    expect(lineWith(woo, '**Check from outside**')).toMatch(/read every status line\. The last one, and the address it answers for, is what a visitor gets\. Then submit the new `\/sitemap\.xml` to your search console\./);
    // Falsifier R3 on app#412 (MUST-FIX): app/[locale]/product/[slug]/loading.tsx and
    // category/[slug]/loading.tsx make those pages stream, so the 200 is sent before notFound()
    // (product page.tsx:133, category page.tsx:145) runs. Measured read-only 2026-10-24 on
    // demo.cartwright.app: /product/no-such-product-check/ → 308 → 307 → 200 "Product not found",
    // /produkt/… → 308 → 301 → 307 → 200, /category/no-such-cat-check/ → 200 "Category not found",
    // both with <meta name="robots" content="noindex"/>; /info/no-such-info-check/ → 404.
    // Product.notFound is "Product not found" (messages/en.json) / "Produkt ikke fundet" (da.json);
    // the category title is the literal "Category not found".
    const ok = lineWith(woo, '**A `200` on a page of yours**');
    expect(ok).not.toMatch(/or because it already is a route\. Check/);
    expect(ok).toMatch(/\(not the login page\): the address is handled — by your row, by one of the shop's own redirects \(above\), or because it already is a route — except at a product or category address, which answers `200` even when nothing is there\./);
    expect(ok).toMatch(/A product or category page streams \(its `loading\.tsx`, in `app\/\[locale\]\/product\/\[slug\]\/` and `app\/\[locale\]\/category\/\[slug\]\/`\), so its `200` is sent before the page has looked the slug up: the old shop's `\/product\/<slug>\/` whose slug was not kept, the same address under `\/produkt\/`, or a row pointing at a mistyped product or category ends on a `200` page that says nothing was found\./);
    expect(ok).toMatch(/`curl -sIL` prints only the headers, so for those addresses read the page: `curl -sL <url> \| grep -o '<title>\[\^<\]\*'` prints `<title>Product not found` \(`Produkt ikke fundet` on a Danish page\) or `<title>Category not found`, and the page carries `<meta name="robots" content="noindex"\/>`\. Check that it is the page you meant\./);
    // A 404 is not only "no row": a row may point at no page, and some rows never fire — the
    // seven Danish segments (LEGACY_SLUG_RE runs before the lookup), the matcher's dotted paths,
    // and under "never" /administration/ (lookup and gate both skip it; measured 404 row or not).
    // A row → /info/typo ends 404 (info has no loading.tsx); a row → a missing product ends 200.
    // Falsifier R3 (NIT): a Danish-segment path's row never fires, but a row on its English twin
    // does, one hop later — "no row can answer it" read as if nothing could.
    const notFound = lineWith(woo, '**A `404`**');
    expect(notFound).toMatch(/no page at the last address\. A missing product or category does not end here: its address answers `200` \(above\)\. The address has no row and no page, its row points at a page that does not exist \(a row to a missing `\/info\/<slug>` ends here\), or no row for it fires: a path in one of the seven Danish segments \(a row for its English path does, one hop later\), or one of the paths that never reach your redirects \(above\)/);
    expect(notFound).not.toMatch(/no row can answer it/);
    expect(notFound).toMatch(/a path with a dot among them, which the proxy never sees, and under `"never"` a path such as `\/administration\/`/);
    expect(woo).not.toMatch(/A `404` at the end is an address with no row and no page yet, or one the proxy never sees/);
  });

  it('step 9 names both gates that end an address on the login page, with what each takes (falsifier R2 on app#412, MUST-FIX)', () => {
    // proxy.ts, engine 1f861db2. Admin gate: pathname === "/admin" || startsWith("/admin/") ||
    // LOCALE_ADMIN_RE (^/(en)/admin, no boundary). Account gate: isKontoRoute = pathname ===
    // "/account" || includes("/account/") || LOCALE_ACCOUNT_RE (^/(en)/account, no boundary), unless
    // isPublicAuthPage (includes "/account/login" or "/account/signup"). Both answer a request without
    // a session with a 307 to /account/login, and both sit AFTER the redirect lookup, which skips
    // only startsWith("/api") / ("/admin"). The matcher's .*\..* keeps dotted paths out of the proxy.
    // Measured (real next dev, locales ["en"], no session, no row): "always", trailingSlash off:
    //   /account/edit-address/ → 308 → 307 /account/login → 307 /en/account/login → 200;
    //   /accounting/ → 308 → 307 /en/accounting → 307 /account/login → 307 /en/account/login → 200.
    // "always", on: /accounts/ → 307 /en/accounts/ → 307 /account/login → 307 /en/account/login/ → 200.
    // "never", on: /account/edit-address/ → 307 /account/login → 308 /account/login/ → 200.
    // /admin/foo.php → 404 directly (never reaches the gate).
    const login = lineWith(woo, '**A `200` on the login page**');
    expect(login).toMatch(/\(`\/account\/login`, with the language and final `\/` your URL options give it\): the address that answered with a `307` to `\/account\/login` was caught by a gate in `proxy\.ts`, not answered by a row — the gate sends a visitor without a session to sign in\./);
    expect(login).toMatch(/A gate sees each request as the proxy gets it: with `trailingSlash` off, after Next's `308` has dropped the final `\/`, and under `"always"`, again after next-intl's `307` has added the language\./);
    expect(login).toMatch(/The \*\*admin gate\*\* takes `\/admin`, every path below `\/admin\/` and every path that begins with a configured language and then `\/admin` \(`\/en\/admin…` in a new scaffold\), so under `"always"` also `\/administration\/` with no row\./);
    expect(login).toMatch(/The \*\*account gate\*\* takes `\/account`, every path with `\/account\/` in it and every path that begins with a configured language and then `\/account`, except one containing `\/account\/login` or `\/account\/signup`:/);
    expect(login).toMatch(/in either mode WooCommerce's My Account endpoints where the old account page sat at `\/account\/`, such as `\/account\/edit-address\/` \(WooCommerce's default `\/my-account\/` is caught by neither gate\), and under `"always"` also `\/accounting\/` with no row\./);
    expect(login).toMatch(/A path with a dot never reaches the proxy, so never a gate\./);
    // The lookup runs before both gates, so a row rescues an account-gate address; /admin and below
    // skip the lookup, and a Danish-segment row never fires (LEGACY_SLUG_RE answers first).
    expect(login).toMatch(/If the address matters, give it a row — the lookup runs before both gates — except for `\/admin` and everything below it, and the seven Danish segments, whose rows never fire \(above\): redirect those ahead of the proxy\./);
    // The R5 wording named the admin gate as the only exception and said everything below /admin
    // reaches it — false for /account/… and for dotted paths.
    expect(woo).not.toMatch(/The exception is an address the admin gate catches/);
    expect(woo).not.toMatch(/everything below it reach the gate at once/);
  });

  it('step 9 keeps the short route and "never" chains with their conditions, and the right cause for the slash forms (falsifier R2 on app#412, NIT)', () => {
    // WooCommerce's product address is also an engine route (app/[locale]/product/[slug]).
    // Measured on demo.cartwright.app 2026-10-24 (trailingSlash off, localePrefix "always"):
    // /product/ethiopia-yirgacheffe/ → 308 /product/ethiopia-yirgacheffe → 307 /en/product/… → 200,
    // and the same path without the slash → 307 → 200; with trailingSlash on both take the 307 alone.
    const hops = lineWith(woo, '**The hops before it.**');
    expect(hops).toMatch(/An old address that is already a route and has no row of its own, such as the old shop's `\/product\/<slug>\/`, takes the same hops without the `301`\./);
    // Under "never" with trailingSlash on, a route asked for without the slash takes the proxy's own
    // 308 first (trailingSlashRedirect, lib/urls.ts; proxy.ts URL2): /product/blue-chair → 308 → 200.
    expect(hops).toMatch(/On a one-language shop with `localePrefix: "never"` there is no language hop: a redirected address is `301` then `200`, and a route answers `200` without a `301` — there, with `trailingSlash` on, a route asked for without the `\/` takes the proxy's `308` to the slash form first\./);
    // Both slash forms answer the 301 first because matchRedirect reads /x and /x/ as one key
    // (withoutTrailingSlash) and the lookup runs before next-intl and URL2 — not because the
    // destination carries the slash (withSlash leaves an absolute or dotted destination alone).
    expect(hops).toMatch(/With `trailingSlash` on, a redirected address answers its `301` first in either form: the lookup reads `\/x` and `\/x\/` as one address \(`lib\/redirects\/match\.ts`\) and runs before the proxy adds a slash\./);
    expect(woo).not.toMatch(/since the destination carries the slash/);
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
    expect(lineWith(woo, '**The hops before it.**')).toMatch(/`defaultLocale`[^\n]*`\/en\/…` in a shop from `npx create-cartwright`/);
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
    // customer-storefront names the file earlier on the line, so "the form" is enough there; go-live
    // names it nowhere else, so its sentence has to carry CheckoutForm.tsx (falsifier R1 on app#412, NIT).
    expect(checkout).toMatch(/in the checkout form \(`components\/CheckoutForm\.tsx`\)/);
    expect(checkout).toMatch(/Payment Element, which the form renders through `components\/StripePaymentPanel\.tsx`/);
    const live = lineWith(read('content/docs/deployment/go-live.mdx'), 'automatic_payment_methods');
    expect(live).toMatch(/Payment Element, which the checkout form \(`components\/CheckoutForm\.tsx`\) renders through `components\/StripePaymentPanel\.tsx`/);
    // AIStylistPanel.tsx:496 renders StripePaymentPanel for an order the assistant places (createOrder →
    // createPaymentIntent, the same automatic_payment_methods as the checkout).
    expect(live).toMatch(/\(so does the AI assistant's panel, `components\/AIStylistPanel\.tsx`, for an order it places with `aiStylist` on\)/);
    // Falsifier R3 on app#412 (NIT): app/api/commerce/agent-checkout/route.ts:57 creates its
    // PaymentIntent with payment_method_types: ["card"], not automatic_payment_methods.
    expect(live).toMatch(/; the agent checkout \(`app\/api\/commerce\/agent-checkout\/route\.ts`\) is card-only\. No code change and no Cartwright flag is needed\./);
  });
});
