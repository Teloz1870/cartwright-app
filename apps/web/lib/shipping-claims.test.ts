import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Shipping zones are stored, not charged — and every page here says so.
 *
 * Engine SHIP0-a (engine #619): zones and rates can be set up in
 * /admin/shipping, but nothing in cart, checkout or order creation calls the
 * zone resolver (lib/shipping/zones.ts resolveShipping has no production
 * caller), so every order pays the flat rate (lib/pricing calcShipping). Until
 * 2026-10-10 this site listed "shipping zones" beside Stripe checkout and VAT
 * in five comparison rows, the Lovable page, why-cartwright and in-the-box.
 *
 * The rule walks every surface instead of naming files, so a new page that
 * sells zone shipping goes red without anyone remembering this list. When the
 * engine charges zones (SHIP0-b), relax the qualifier in the same PR as the
 * copy. The changelog is history and keeps what each release said.
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

const MENTION = /shipping[- ]zones?|shippingZones|zone\/weight|zone- and weight|zone-based|\/admin\/shipping/gi;
// "Off = a single flat rate" is not a qualifier: it describes the fallback and
// still promises zones are charged when the flag is on (the old in-the-box line).
const QUALIFIER = /not charged|(?:does not|doesn't|do not|don't) (?:use|charge)/i;

describe('shipping-zone claims stay honest', () => {
  const files = surfaces();

  it('walks the docs and the marketing pages', () => {
    expect(files).toContain('content/docs/in-the-box.mdx');
    expect(files).toContain('lib/comparisons.ts');
    expect(files.some((f) => f.startsWith('app/changelog/'))).toBe(false);
  });

  it('says beside every zone-shipping mention that checkout does not charge zones', () => {
    const offenders: string[] = [];
    for (const rel of files) {
      const src = readFileSync(join(ROOT, rel), 'utf8');
      for (const m of src.matchAll(MENTION)) {
        const window = src.slice(Math.max(0, m.index! - 300), m.index! + 300);
        if (!QUALIFIER.test(window)) {
          offenders.push(`${rel} @${m.index}: "${src.slice(m.index!, m.index! + 60)}"`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
