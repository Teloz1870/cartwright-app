import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * "When you outgrow it" on the plain-website guide is the engine's recipe,
 * not a summary of it (DRØM31-a, app half). Until 2026-11-28 the page said
 * to carry over `brand.config.ts` and your design folder and that "a pack
 * written for `site` renders unchanged" in the default profile — false for
 * `saas-dark`, `corporate-baseline` and `stack`, which the light profile
 * prunes, and silent on the first-run welcome canvas that hides the copied
 * homepage until a design is named. The engine's `docs/simple-site.md`
 * (engine PR #807) carries six steps; this page must carry the same six,
 * with the same commands and file names.
 */
const WEB = join(__dirname, '..');
const CLI = join(__dirname, '..', '..', 'cli');
const page = readFileSync(join(WEB, 'content/docs/getting-started/plain-website.mdx'), 'utf8');

function section(src: string, heading: string): string {
  const start = src.indexOf(`## ${heading}\n`);
  expect(start, `no "## ${heading}" heading`).toBeGreaterThanOrEqual(0);
  const rest = src.slice(start + heading.length + 4);
  const end = rest.search(/\n## |\n<Cards>/);
  return end === -1 ? rest : rest.slice(0, end);
}

const outgrow = section(page, 'When you outgrow it');

describe('plain-website guide: "When you outgrow it" carries the engine recipe', () => {
  it('never claims a site pack renders unchanged in the default profile', () => {
    expect(page).not.toMatch(/renders unchanged/i);
  });

  it('has the engine’s six steps, in its order', () => {
    const steps = [...outgrow.matchAll(/^(\d+)\. \*\*([^*]+)\*\*/gm)].map((m) => [Number(m[1]), m[2]]);
    expect(steps).toEqual([
      [1, 'Scaffold the new project'],
      [2, 'Copy what is only yours, as it is:'],
      [3, 'Merge `brand.config.ts` and `messages/` — do not overwrite them.'],
      [4, 'Leave everything else in the new project as it is.'],
      [5, 'Old inquiries stay in your mail.'],
      [6, 'Deploy it where the old site ran.'],
    ]);
  });

  it('names the commands, flags and files the engine section names', () => {
    for (const literal of [
      '`npx create-cartwright@latest my-site`',
      '`--profile full`',
      '`--template generic`',
      '`npx create-cartwright design install <slug>`',
      '`designs/index.ts`',
      '`designs/options.ts`',
      '`emails.admin`',
      '`designSlug`',
      '`aurora-site`',
      '`/admin/setup`',
      '`scaffold/manifest.json`',
      '`seams`',
      '`app/api/inquiries/route.ts`',
      '`/admin/leads`',
      '`AUTH_SECRET`',
      '`DEPLOY.md`',
    ]) {
      expect(outgrow, literal).toContain(literal);
    }
    // The registration files are merged, never replaced (each profile registers a different set).
    expect(outgrow).toMatch(/Do not replace those two files/);
    // The first-run trap: the copied homepage is hidden until a design is named or setup is done.
    expect(outgrow).toMatch(/first-run welcome page instead of yours/);
  });

  it('every pack it says light lacks is in the CLI’s light prune list', () => {
    const named = /((?:`[a-z0-9-]+`(?:, | and )?)+) ship in `site` but not in `light`/.exec(outgrow);
    expect(named, 'the sentence naming the packs light prunes').not.toBeNull();
    const slugs = [...named![1].matchAll(/`([a-z0-9-]+)`/g)].map((m) => m[1]);
    expect(slugs).toEqual(['saas-dark', 'corporate-baseline', 'stack']);

    const src = readFileSync(join(CLI, 'src/profile-light.ts'), 'utf8');
    const block = /export const LIGHT_PRUNED_DESIGNS[^=]*=\s*\[([\s\S]*?)\n\];/.exec(src);
    expect(block, 'LIGHT_PRUNED_DESIGNS in apps/cli/src/profile-light.ts').not.toBeNull();
    const pruned = [...block![1].matchAll(/slug: "([a-z0-9-]+)"/g)].map((m) => m[1]);
    for (const slug of slugs) expect(pruned, slug).toContain(slug);
  });

  it('`--profile full` starting as a webshop is what the CLI does', () => {
    expect(outgrow).toMatch(/`--profile full`, which starts as a webshop \(`--template generic`\) by default/);
    const index = readFileSync(join(CLI, 'src/index.ts'), 'utf8');
    expect(index).toMatch(/profile === "full" \? "generic" : "website-corporate"/);
  });

  it('its in-page links land on headings this page has', () => {
    for (const [anchor, heading] of [['#when-you-outgrow-it', '## When you outgrow it']]) {
      expect(page).toContain(`(${anchor})`);
      expect(page).toContain(`\n${heading}\n`);
    }
  });

  it('every link in the section lands on a section that states what it is cited for', () => {
    // A heading that exists is not enough: R1 caught a "see … above" that
    // pointed at a section silent on the claim. Each link the section carries
    // is listed with the fact its target must state; a new link must be added here.
    const cited: Record<string, RegExp> = {
      '/docs/features/industry-templates#generic': /Webshop mode/,
    };
    const links = [...outgrow.matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1]);
    expect(links.sort()).toEqual(Object.keys(cited).sort());
    for (const link of links) {
      const [path, anchor] = link.split('#');
      const src = path ? readFileSync(join(WEB, 'content', `${path}.mdx`), 'utf8') : page;
      const heading = [...src.matchAll(/^## (.+)$/gm)]
        .map((m) => m[1])
        .find((h) => h.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/ /g, '-') === anchor);
      expect(heading, `${link}: no heading for #${anchor}`).toBeDefined();
      expect(section(src, heading!), link).toMatch(cited[link]);
    }
  });
});
