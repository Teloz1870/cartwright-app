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
  'Cartwright is an AI-native commerce engine built for trusted operation. The model proposes, the shop shows you exactly what would change, and nothing is written until you release it.';

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
