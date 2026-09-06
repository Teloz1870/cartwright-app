/**
 * The two facts the homepage and its Markdown twin must never disagree about.
 *
 * They lived in three places: rendered in `hero.tsx`, retyped in the Markdown
 * route, and *grepped out of hero.tsx's source* by `home-markdown.test.ts`. That
 * last one is the problem — the test matched
 * `<span className="cw-rise…">([^<]+)</span>` and asserted exactly two hits, so
 * any restyle of the h1 failed the suite with **"hero.tsx h1 structure
 * changed"**. Accurate about the trigger, wrong about the cause, and it invites
 * the next person to edit the Markdown to make a styling change compile.
 *
 * Now all three import from here. The h1 cannot drift from the Markdown because
 * neither one owns the words, and restyling the hero is just restyling.
 */

/**
 * The headline, one array entry per rendered line.
 *
 * Two entries, two colours. On render they MUST be joined by an explicit
 * `{' '}` — JSX drops whitespace-only nodes between elements, and without it the
 * h1's text content is the run-together "AI runs the shop.You keep the keys."
 * That string is what a crawler, a screen reader and an AI summariser all read,
 * and it shipped that way until an agent-readiness audit found it.
 */
export const HOME_H1_LINES = ['AI runs the shop.', 'You keep the keys.'] as const;

/** The h1 as one sentence — for the Markdown twin, `<title>`, and assertions. */
export const HOME_H1_TEXT = HOME_H1_LINES.join(' ');

/** The one command the whole page is arguing towards. */
export const INSTALL_COMMAND = 'npx create-cartwright@latest my-shop';

/**
 * The lead paragraph. Names the product in its first three words: an answer
 * engine quoting this sentence alone still says what Cartwright is.
 */
export const HOME_LEDE =
  'Cartwright is an open-source Next.js engine that builds a real website in one command — a plain site with no database, or a shop with an AI-native admin built for trusted operation: the model proposes, the shop shows you exactly what would change, and nothing is written until you release it.';

/**
 * The second door. Always with the explicit flag, so it stays correct whether
 * or not the CLI default ever flips.
 */
export const INSTALL_COMMAND_SITE = 'npx create-cartwright@latest my-site --profile site';

/** The one-line invitation that sits beside the site command wherever it appears. */
export const SITE_DOOR = 'Just a page or a plain website? No database, no login, nothing to configure:';

/**
 * The front is yours — said once, rendered everywhere an AI decides.
 *
 * Measured 2026-09-06 (replay V2, a designed one-pager): the only run that
 * chose Cartwright had found the `blank` pack and quoted its promise ("own
 * homepage + chrome, everything else keeps working — no fighting the
 * framework"); the two that declined never saw it and argued against "a
 * website *system*". A system is only oppressive when you cannot see which
 * part is yours. The owner's rule is that the build method binds nobody — a
 * shipped pack, the blank canvas and your own pack are three EQUAL freedoms —
 * so this sentence names all three and ranks none. The plan called it
 * BLANK_DOOR; it is wider than blank. Profile-honest on purpose: what keeps
 * working in every profile comes first, the database-backed extras last.
 */
export const FRONT_DOOR =
  'You own the front — pick one of the shipped design packs, start from the blank canvas and rewrite its homepage, header and footer freely, or write your own pack; SEO, the sitemap, share cards and locale routing keep working around whatever you render, and in the default profile so do the database, the admin and the AI tools.';

/**
 * The site profile's measured cold run — copied, never typed, from the
 * release scaffold gate's `timings-site.json` artifact (cartwright-app
 * `.github/workflows/release-scaffold-gate.yml`), which scaffolds every
 * profile exactly like a customer and records each step with its provenance.
 * Replace the WHOLE object from a newer complete record; never edit one field.
 * `provenance` must carry the date, the CLI version and the engine ref — a
 * unit test enforces that shape. The gate's full invocation (in the workflow
 * file, keyed by the run id) also passes `--db=sqlite --no-ai --no-git
 * --no-start`; the site profile has no database and ignores `--db`, so the
 * rendered provenance names only the flags that shape a site scaffold.
 */
export const SITE_COLD_RUN = {
  provenance:
    'Measured cold run, 2026-09-06, GitHub-hosted ubuntu-latest, create-cartwright@2.9.4, engine v0.56.2 (a1bbe1f), --profile=site --ref=stable --yes --pm=pnpm — release scaffold gate run 34045315774',
  scaffold: '~24 s',
  build: '~30 s',
  boot: '~2 s',
  runtimeDependencies: 20,
  devDependencies: 16,
} as const;

/**
 * Measured, not estimated — and always rendered with the tilde and the
 * provenance. `llms.txt` and the AI quick-start doc quote the same two figures
 * as a *measured cold run*; bare numbers under a heading reading "Every claim
 * has a receipt" would read as a guarantee.
 */
export const COLD_RUN = {
  provenance: 'Measured cold run',
  running: '~27 s to running',
  designed: '~99 s to designed',
} as const;
