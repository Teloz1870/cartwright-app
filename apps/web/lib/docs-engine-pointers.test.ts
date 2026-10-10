import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Two docs pointers that sent a reader somewhere the engine is not, found by
 * the 2026-10-10 falsifier pass and checked against engine origin/main:
 *
 *  - pulling-models linked `github.com/cartwright/cartwright`, a repository
 *    that does not exist (the GitHub API answers 404). The engine's public
 *    source is Teloz1870/cartwright-template, which every other docs link
 *    uses. A link into that dead org on any page goes red here.
 *  - in-the-box said an order's lines are routed to suppliers "from the order
 *    page". The Fulfillment card that does it renders only when the
 *    `fulfillmentPdf` flag is on (app/admin/ordrer/[id]/page.tsx), and the
 *    order page shows it only in the `orderWorkspace` view. A paragraph that
 *    promises order-page routing must name the flag.
 *
 * Both rules walk every surface instead of naming files, so a new page with
 * the same mistake goes red without anyone remembering this list. The
 * changelog is history and keeps what each release said.
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

const DEAD_REPO = /github\.com\/cartwright\//i;
const ORDER_PAGE_ROUTING = /route[sd]? (?:an |the )?order(?:'s)? lines|from the order page/i;

describe('docs point at the engine that exists', () => {
  const files = surfaces();

  it('walks the docs and the marketing pages', () => {
    expect(files).toContain('content/docs/in-the-box.mdx');
    expect(files).toContain('content/docs/ai/local-ai/pulling-models.mdx');
    expect(files.some((f) => f.startsWith('app/changelog/'))).toBe(false);
  });

  it('links no page into the github.com/cartwright org, which does not exist', () => {
    const offenders = files.filter((rel) => DEAD_REPO.test(readFileSync(join(ROOT, rel), 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('names fulfillmentPdf wherever it promises supplier routing from the order page', () => {
    const offenders: string[] = [];
    for (const rel of files) {
      const paragraphs = readFileSync(join(ROOT, rel), 'utf8').split(/\n\s*\n/);
      for (const p of paragraphs) {
        if (ORDER_PAGE_ROUTING.test(p) && !p.includes('fulfillmentPdf')) {
          offenders.push(`${rel}: "${p.slice(0, 80)}…"`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
