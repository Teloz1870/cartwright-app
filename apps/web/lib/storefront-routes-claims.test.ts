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
    expect(label).toBe('Storefront /[locale] /[locale]/product /[locale]/cart /[locale]/checkout');
    const prose = lineWith(page, 'the customer storefront (');
    const named = [...prose.matchAll(/`\/\[locale\]([^`]*)`/g)].map((m) => m[1]);
    expect(named).toEqual(['', '/product/[slug]', '/cart', '/checkout']);
    expect(named.filter((r) => !ENGINE_LOCALE_ROUTES.has(r))).toEqual([]);
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
