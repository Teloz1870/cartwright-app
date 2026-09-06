import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WHEN_TO_USE, NOT_A_FIT, SITE_FITS, DEFAULT_FITS } from './when-to-use';
import { HOME_MARKDOWN } from './home-markdown';
import { INSTALL_COMMAND_SITE } from './home-copy';
import { routeExists } from './route-exists';

/**
 * The site profile must be named on every surface an AI reads to decide.
 *
 * On 2026-09-06 none of them named it, `when-to-use.ts` disqualified "a pure
 * blog, docs site or portfolio" for carrying a database, an admin and auth that
 * would go unused (false for `--profile site`), and three harness replays of
 * the resulting incident reproduced it 3/3. These assertions make that class of
 * regression impossible to ship quietly: every entry surface carries the
 * explicit flag, the old disqualifier is gone for good, and the not-a-fit list
 * still disqualifies — a source that never says "not this one" is not usable.
 */
const ROOT = join(__dirname, '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

describe('the site profile is named on every entry surface', () => {
  it.each([
    'lib/when-to-use.ts',
    'app/llms.txt/route.ts',
    'lib/home-markdown.ts',
    'lib/mcp-tools.ts',
    'app/api/mcp/route.ts',
    'app/.well-known/mcp.json/route.ts',
    'app/layout.tsx',
    'content/docs/introduction.mdx',
    'content/docs/in-the-box.mdx',
    'content/docs/why-cartwright.mdx',
    'content/docs/getting-started/plain-website.mdx',
    'content/docs/getting-started/choose-your-path.mdx',
    'content/docs/getting-started/ai-quick-start.mdx',
    'content/docs/getting-started/cli-options.mdx',
    'content/docs/getting-started/quick-start.mdx',
    // A4 — the home page itself, and the create-next-app comparison (hero,
    // install band and faq render <SiteCommand/> — pinned in the next test)
    'components/landing/three-doors.tsx',
    'components/landing/site-command.tsx',
    'lib/comparisons.ts',
  ])('%s names --profile site', (rel) => {
    expect(read(rel)).toContain('--profile site');
  });

  it('the home page carries the site command as a rendered constant, not retyped prose', () => {
    // Rendered usage, not an import line: <SiteCommand/> in JSX, and the door
    // sentence interpolated in the hero (a falsifier deleted the hero paragraph
    // and an import-only assertion stayed green).
    for (const rel of ['components/landing/hero.tsx', 'components/landing/install-band.tsx', 'components/landing/faq.tsx']) {
      expect(read(rel)).toMatch(/<SiteCommand(\s[^>]*)?\/>/);
    }
    expect(read('components/landing/hero.tsx')).toContain('{SITE_DOOR}');
    expect(read('components/landing/site-command.tsx')).toContain("INSTALL_COMMAND_SITE.split(' ')");
    // FAQPage JSON-LD parity: the plain twin must carry the command too.
    expect(read('components/landing/faq.tsx')).toMatch(/plain: `Yes\. \$\{INSTALL_COMMAND_SITE\}/);
    // The comparison answers "so it's faster?" honestly — finished page, not empty one.
    expect(read('lib/comparisons.ts')).toContain('Faster to a finished page, not to an empty one');
    expect(read('lib/comparisons.ts')).toContain("dimension: 'A single page or plain website'");
  });

  it('the rendered agent strings carry the site command, not just the source', () => {
    expect(WHEN_TO_USE).toContain(INSTALL_COMMAND_SITE);
    expect(HOME_MARKDOWN).toContain(INSTALL_COMMAND_SITE);
  });

  it('the old disqualifier is gone and cannot come back as prose', () => {
    for (const rel of ['lib/when-to-use.ts', 'lib/mcp-tools.ts', 'app/llms.txt/route.ts']) {
      expect(read(rel)).not.toContain('auth layer you would not use');
      expect(read(rel)).not.toContain('would go unused');
      expect(read(rel)).not.toContain('only entry point that provisions the database');
    }
  });

  it('the funnel says WHERE the owner edits their own pages — a replay chose site because it believed the admin only manages a catalogue', () => {
    // Measured 2026-09-06 (replay v3-1, prompt: "no shop yet, but I want to
    // edit the pages myself later"): the model read the docs, chose
    // `--profile site`, and explained why — "its admin manages products,
    // orders, categories, shipping and a blog, NOT your home/services/about
    // pages". That is false: `/admin/sider` edits exactly those. The default
    // profile lost the customer to a claim we made about ourselves.
    const defaults = DEFAULT_FITS.join('\n');
    expect(defaults).toMatch(/\/admin\/sider/);
    expect(defaults).toMatch(/edit it themselves|edit the site themselves/);
    expect(WHEN_TO_USE).toContain('/admin/sider');
  });

  it('still disqualifies — and names which profile lacks what', () => {
    expect(NOT_A_FIT.length).toBeGreaterThanOrEqual(6);
    expect(NOT_A_FIT.join('\n')).toMatch(/create-next-app/);
    expect(NOT_A_FIT.join('\n')).toMatch(/`site`/);
    expect(SITE_FITS.length).toBeGreaterThanOrEqual(3);
  });

  it('every runbook it points at exists', () => {
    expect(routeExists('/docs/getting-started/plain-website')).toBe(true);
    expect(routeExists('/docs/getting-started/ai-quick-start')).toBe(true);
  });
});
