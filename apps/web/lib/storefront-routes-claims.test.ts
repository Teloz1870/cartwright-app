import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * DOC-STOREFRONT-ROUTES: the storefront's routes are English and live under
 * the language segment.
 *
 * Engine origin/main 2bed5508: the shop's pages are app/[locale]/category/[slug],
 * app/[locale]/product/[slug], app/[locale]/cart, … The Danish folders of older
 * releases (/kategori, /produkt, /kurv, /ordre, /konto, /kontakt, /anmeld) are
 * not routes. proxy.ts answers them with a 301 to the English twin
 * (LEGACY_SLUG_MAP, proxy.ts:152-163; the redirect, proxy.ts:309-321), before
 * next-intl and before the merchant redirect lookup. `categories.list` requires
 * `categories:read` (lib/tools/categories.ts:61-63), not `catalog:read`.
 *
 * #410 fixed the storefront route map (it listed /kategori/[slug] and
 * /produkt/[slug]) and the categories.list scope. The architecture diagram
 * still labelled the storefront "/produkt /kurv" until this test.
 *
 * The rules walk every surface instead of naming files, so a new page that
 * lists a Danish segment as a route goes red without anyone remembering this
 * list. ENGINE_LOCALE_ROUTES mirrors the engine's app/[locale]/ pages as
 * measured. When the engine adds or renames one, change it in the same PR as
 * the copy. The changelog is history and keeps what each release said.
 *
 * Known limit: outside a route shape (`[locale]/kurv`, `/kategori/[slug]`), a
 * line that names a Danish segment passes when it also says 301, legacy or
 * redirect. The check catches the drift that happened. It does not prove that
 * every such sentence is true.
 */
const ROOT = join(__dirname, '..');
const DIRS = ['app', 'components', 'content', 'lib'];
const SKIP_DIRS = new Set(['node_modules', '.next', '.source', 'changelog']);
const FILE = /\.(?:ts|tsx|md|mdx)$/;

function surfaces(): string[] {
  const found: string[] = [];
  const walk = (rel: string) => {
    for (const entry of readdirSync(join(ROOT, rel), { withFileTypes: true })) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const child = `${rel}/${entry.name}`;
      if (entry.isDirectory()) walk(child);
      else if (FILE.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) found.push(child);
    }
  };
  for (const dir of DIRS) walk(dir);
  return found;
}

const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');
const lineWith = (src: string, needle: string) => src.split('\n').find((l) => l.includes(needle)) ?? '';

/** Every page under the engine's app/[locale]/ (page.tsx), without the `/[locale]` in front. */
const ENGINE_LOCALE_ROUTES = new Set([
  '',
  '/about',
  '/account',
  '/account/forgot-password',
  '/account/login',
  '/account/orders',
  '/account/orders/[id]/review',
  '/account/reset-password',
  '/account/settings',
  '/account/signup',
  '/account/subscriptions',
  '/account/wishlist',
  '/blog',
  '/blog/[slug]',
  '/builder-preview',
  '/built-with-cartwright',
  '/cart',
  '/cartwright',
  '/cases',
  '/category/[slug]',
  '/changelog',
  '/checkout',
  '/contact',
  '/developers',
  '/info',
  '/info/[slug]',
  '/mixer-preview',
  '/order/[id]',
  '/priser',
  '/privacy',
  '/product/[slug]',
  '/produkter',
  '/review/[token]',
  '/scene-preview',
  '/services',
  '/services/[slug]',
  '/services/domain-migration',
  '/start',
  '/webmcp-check',
]);

/** The top-level keys of proxy.ts LEGACY_SLUG_MAP. `(?<!admin)` keeps /admin/konto, an admin page. */
const DANISH = '(?:kategori|produkt|kurv|ordre|konto|kontakt|anmeld)(?![\\w-])';
const DANISH_PATH = new RegExp(`(?<!admin)\\/${DANISH}`);
/** A Danish segment written as a route: behind [locale], or in front of a dynamic segment. */
const DANISH_ROUTE = new RegExp(`\\[locale\\]\\/${DANISH}|(?<!admin)\\/(?:kategori|produkt|kurv|ordre|konto|kontakt|anmeld)\\/\\[`);
const SAYS_REDIRECT = /301|LEGACY_SLUG_MAP|legacy|redirect/i;

describe('the storefront routes are named as the engine serves them', () => {
  const files = surfaces();

  it('walks the docs, including the pages that list routes', () => {
    expect(files).toContain('content/docs/features/customer-storefront.mdx');
    expect(files).toContain('content/docs/architecture/overview.mdx');
    expect(files).toContain('content/docs/api/mcp-tools.mdx');
    expect(files.some((f) => f.startsWith('app/changelog/'))).toBe(false);
  });

  it('finds the lines that name a Danish segment as a redirect, so the rule below is not vacuous', () => {
    const redirects = files.flatMap((rel) =>
      read(rel).split('\n').filter((l) => DANISH_PATH.test(l) && SAYS_REDIRECT.test(l)),
    );
    expect(redirects.length).toBeGreaterThan(1);
  });

  it('names a Danish segment only as the redirect it is, never as a route', () => {
    const offenders: string[] = [];
    for (const rel of files) {
      read(rel)
        .split('\n')
        .forEach((line, i) => {
          if (DANISH_ROUTE.test(line) || (DANISH_PATH.test(line) && !SAYS_REDIRECT.test(line))) {
            offenders.push(`${rel}:${i + 1}: ${line.trim().slice(0, 100)}`);
          }
        });
    }
    expect(offenders).toEqual([]);
  });

  it('lists in the route map only pages the engine has, with the English product and category routes', () => {
    const page = read('content/docs/features/customer-storefront.mdx');
    const map = page.slice(page.indexOf('## Route map'), page.indexOf('## Nested categories'));
    const routes = [...map.matchAll(/^- \*\*`\/\[locale\]([^`]*)`\*\*/gm)].map((m) => m[1]);
    expect(routes.length).toBeGreaterThan(5);
    expect(routes.filter((r) => !ENGINE_LOCALE_ROUTES.has(r))).toEqual([]);
    expect(routes).toContain('/category/[slug]');
    expect(routes).toContain('/product/[slug]');
    expect(lineWith(page, 'The customer storefront covers')).toMatch(
      /The Danish paths of older releases — `\/kategori`, `\/produkt`, `\/kurv`, `\/ordre`, `\/konto`, `\/kontakt`, `\/anmeld`, with or without the language in front — are not routes: they answer with a permanent 301 to their English twin \(`LEGACY_SLUG_MAP` in `proxy\.ts`\)/,
    );
  });

  it('labels the storefront in the architecture overview with the same engine routes as its prose', () => {
    const page = read('content/docs/architecture/overview.mdx');
    const label = lineWith(page, 'Store["').match(/Store\["([^"]*)"\]/)?.[1] ?? '';
    const labelled = [...label.matchAll(/\/\[locale\](\S*)/g)].map((m) => m[1]);
    const prose = lineWith(page, 'the customer storefront (');
    const named = [...prose.matchAll(/`\/\[locale\]([^`]*)`/g)].map((m) => m[1]);
    expect(named).toEqual(['', '/product/[slug]', '/cart', '/checkout']);
    // The chart names exactly the routes the prose names, and each is an engine page.
    expect(labelled).toEqual(named);
    expect(labelled.filter((r) => !ENGINE_LOCALE_ROUTES.has(r))).toEqual([]);
  });

  it('gives categories.list the categories:read scope wherever a scope follows its name', () => {
    const SCOPE = /\b[a-z]+:(?:read|write)\b/;
    const named: string[] = [];
    for (const rel of files) {
      for (const line of read(rel).split('\n')) {
        const at = line.indexOf('`categories.list`');
        if (at < 0) continue;
        const scope = line.slice(at).match(SCOPE)?.[0];
        if (scope) named.push(`${rel}: ${scope}`);
      }
    }
    expect(named.length).toBeGreaterThan(0);
    expect(named.filter((n) => !n.endsWith(': categories:read'))).toEqual([]);
  });
});

/**
 * Engine changes merged after v0.64.0 (8b134686) and shipped in v0.65.0 (83700436; each commit
 * checked with `git merge-base --is-ancestor`). Each page says "from v0.65.0" and, beside it, what
 * v0.64.0 does, so both are pinned whole: a dropped marker, a changed release number or a flipped
 * verb turns them red.
 */
describe('the pages date v0.65.0\'s AI model, magic-link and vibe changes beside v0.64.0', () => {
  it('offers Claude Haiku 5.5 from v0.65.0, with Haiku 4.5 kept as the default (engine #706, TREND37-a)', () => {
    // lib/ai/anthropic-models.ts:14-17 lists haiku-4-5, haiku-5-5, sonnet-5-5, opus-5-5 (v0.64.0: the
    // same without haiku-5-5); lib/ai/model-capabilities.ts:56 gives claude-haiku-5-5 tools "all";
    // lib/ai/usage.ts:37 prices it { in: 0.1, out: 0.5 } flat (the >100k-token rate is not modelled);
    // lib/ai/client.ts:31 CHAT_MODEL stays "claude-haiku-4-5". app/api/assistant/chat/route.ts:297
    // resolves the chat model through chatModelResolved("chat"), which reads the saved anthropicModel.
    const model = lineWith(read('content/docs/features/ai-assistant.mdx'), '`/admin/integrations` → AI');
    expect(model).toMatch(/^The model can also be picked without a code change, in `\/admin\/integrations` → AI: on v0\.64\.0 the list offers Claude Haiku 4\.5, Sonnet 5\.5 and Opus 5\.5 \(`lib\/ai\/anthropic-models\.ts`\)\. From v0\.65\.0 it also offers Claude Haiku 5\.5 \(`claude-haiku-5-5`\), with the full admin tool set and metered at \$0\.10 in \/ \$0\.50 out per million tokens; a saved choice and a new shop keep Haiku 4\.5\./);
    expect(model).toMatch(/The meter counts a prompt over 100,000 tokens at that price too, though Anthropic charges five times as much for one on Haiku 5\.5\./);
  });

  it('says a magic link finds an account saved with capitals only from v0.65.0 (engine #701, REG-EMAIL-CASE-c)', () => {
    // lib/auth.ts:60 wraps the adapter in withMagicLinkAccountBinding; :108-119 binds the account
    // (lib/auth/magic-link-account.ts → accountForAddress, the password-reset rule), sends nothing
    // when no account is picked (console.warn, no address), else mails target.identifier with the
    // link naming that spelling. v0.64.0 handed Auth.js's lowercased identifier straight to
    // getUserByEmail, an exact unique-index lookup.
    const magic = lineWith(read('content/docs/features/auth-magiclink.mdx'), 'Auth.js lowercases the address');
    expect(magic).toMatch(/^Auth\.js lowercases the address a customer types\. /);
    expect(magic).toMatch(/On v0\.64\.0 a link therefore signs in to the account spelled exactly that way, so for an account the shop holds as `Ada@Example\.com` the first link makes a second, password-less account `ada@example\.com`, and every later link signs in there, away from the account's orders and password\./);
    expect(magic).toMatch(/From v0\.65\.0 a link picks the account the way a password reset does: the one spelled exactly as given \(lowercased\), else the one a password login with that address signs in to, else the only one there is\./);
    expect(magic).toMatch(/The link names that account's stored spelling and is mailed to the address the account holds, so it signs in to that account and creates none \(`lib\/auth\/magic-link-account\.ts`\)\./);
    expect(magic).toMatch(/Where several accounts differ only in case and the rule cannot pick one, no link is sent, and the page still says to check the inbox\./);
    expect(magic).toMatch(/An address with no account gets its link as before\./);
    expect(magic).toMatch(/A customer whose earlier link already made the lowercased account keeps signing in there: nothing joins the two\./);
  });

  it('dates the empty vibe tab fallback and the Sandbox keeping translations to v0.65.0 (engine #702, #707)', () => {
    // app/api/admin/vibe/translate/route.ts:67-73 writes translations[lang].vibeHtml, not a JSON map
    // in vibeHtml. #702 (4484bab6): app/[locale]/page.tsx:123 → lib/translated-field.ts:125-131
    // localizedVibeHtml returns the per-locale entry only when v.trim() is non-empty (v0.64.0: `??`,
    // so "" won). #707 (88c617f4): app/admin/actions.ts:391-395 strips the per-locale vibe HTML only
    // when normalizeLineEndings(vibeHtml) differs from the stored HTML (:337; v0.64.0: whenever the
    // form had vibeHtml).
    const vibe = lineWith(read('content/docs/features/vibe-coding.mdx'), 'one `vibeHtml` per locale');
    expect(vibe).toMatch(/For a page, the result lands in its `translations` field, one `vibeHtml` per locale next to the base `vibeHtml` \(`translations\.de\.vibeHtml`; `app\/api\/admin\/vibe\/translate\/route\.ts`\)\./);
    expect(vibe).toMatch(/\)\. The homepage renders the active locale's entry and falls back to the base on a miss\. From/);
    expect(read('content/docs/features/vibe-coding.mdx')).not.toMatch(/the field is a JSON map/);
    expect(vibe).toMatch(/From v0\.65\.0 an empty or whitespace-only entry counts as a miss — a Vibe Sandbox save with an empty English tab stores one — where on v0\.64\.0 `\/en` renders an empty container\./);
    expect(vibe).toMatch(/Also from v0\.65\.0, a Sandbox save that leaves the page's HTML as it is \(only the meta title or nav order changed\) keeps the translated vibe HTML; on v0\.64\.0 every Sandbox save drops it, so run the translation again after one\. A save that changes the HTML, even only its spaces, drops it on both; line endings alone \(CRLF against LF\) do not count as a change from v0\.65\.0\./);
  });
});
