import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Engine #641 (URL5-a2, shipped in v0.63.0): the header's and the mobile menu's
 * category navigation and the category page's "Explore more" list link a
 * stored permalink once `urls.permalinks` is on (components/Header.tsx,
 * components/MobileMenu.tsx, app/[locale]/category/[slug]/page.tsx). The URL
 * options page still listed all three as "Still on the pattern", which
 * contradicted the WooCommerce page.
 *
 * No "Still on the pattern:" list may name them again; the URL options page
 * says from which release they follow. The rule walks every surface. The
 * changelog is history and keeps what v0.62.0 said.
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

const URLS_PAGE = 'content/docs/configuration/urls.mdx';
const PATTERN_LIST = /still on the pattern:([^.]*)/gi;
const FOLLOWS_NOW = /header|mobile.menu|explore more/i;

describe('the permalink pages say the header, mobile menu and "Explore more" follow it', () => {
  const files = surfaces();

  it('walks the docs, including the URL options page', () => {
    expect(files).toContain(URLS_PAGE);
    expect(files.some((f) => f.startsWith('app/changelog/'))).toBe(false);
  });

  it('finds the list of links still on the pattern, so the rule below is not vacuous', () => {
    const page = readFileSync(join(ROOT, URLS_PAGE), 'utf8');
    expect([...page.matchAll(PATTERN_LIST)].length).toBeGreaterThan(0);
  });

  it('names none of the three in a list of links still on the pattern', () => {
    const offenders: string[] = [];
    for (const rel of files) {
      for (const [, list] of readFileSync(join(ROOT, rel), 'utf8').matchAll(PATTERN_LIST)) {
        if (FOLLOWS_NOW.test(list)) offenders.push(`${rel}: "${list.trim().slice(0, 80)}…"`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('says on the URL options page from which release the three follow a permalink', () => {
    const page = readFileSync(join(ROOT, URLS_PAGE), 'utf8');
    const sentence = page.split(/(?<=\.)\s/).find((s) => s.startsWith('From v0.63.0'));
    expect(sentence).toBeDefined();
    expect(sentence).toMatch(/header/);
    expect(sentence).toMatch(/mobile-menu/);
    expect(sentence).toMatch(/"Explore more"/);
  });
});

/**
 * Engine v0.63.0 (URL5-b): with `urls.permalinks` on, `proxy.ts` serves a stored
 * permalink at its own address (lib/permalinks/resolve-request.ts), and the
 * CHANGELOG's Upgrading note says the advice to keep the option off on a live
 * shop no longer holds. A page may still say what v0.62.0 does, but never in the
 * present tense that the permalink is "not yet served".
 */
describe('the permalink pages say a stored permalink is served from v0.63.0', () => {
  const files = surfaces();

  it('says so on the URL options page and the WooCommerce page', () => {
    const urls = readFileSync(join(ROOT, URLS_PAGE), 'utf8');
    expect(urls).toMatch(/From v0\.63\.0 a stored permalink is also \*served\* at its address once `permalinks` is on/);
    expect(urls).toMatch(/On v0\.62\.0 a stored permalink is not served/);
    const woo = readFileSync(join(ROOT, 'content/docs/migrate/woocommerce.mdx'), 'utf8');
    expect(woo).toMatch(/From v0\.63\.0 the shop also answers at a stored permalink once the option is on/);
  });

  it('leaves no surface saying a stored permalink is not yet served', () => {
    const offenders: string[] = [];
    for (const rel of files) {
      for (const line of readFileSync(join(ROOT, rel), 'utf8').split('\n')) {
        if (/not yet \*?served|stored and linked, not yet served/i.test(line)) offenders.push(`${rel}: "${line.trim().slice(0, 80)}…"`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
