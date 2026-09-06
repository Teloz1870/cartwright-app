// @vitest-environment node
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

/**
 * The home FAQ renders FAQPage JSON-LD from each item's `plain` string, and
 * Google requires that text to match the answer a visitor reads. A falsifier
 * deleted a sentence from one `plain` and nothing went red — the only guard
 * was a start-of-string check on the source file.
 *
 * The rule here is URL-insensitive sentence containment: every sentence of the
 * rendered answer must appear in `plain` once links are stripped, because the
 * house convention spells a link out in the plain twin ("cartwright-template"
 * → "cartwright-template (github.com/…)").
 *
 * Six items predate the rule and paraphrase instead of mirroring (reordered
 * clauses, added or dropped words). They are listed below and tracked in the
 * backlog as W11 — a RATCHET, not an exemption: when one of them is rewritten
 * to mirror its answer, this test fails until it is removed from the list, and
 * a new item can never join it.
 */
const LEGACY_PARAPHRASE = new Set([
  'Is cartwright open source?',
  'Will it cost me anything to run?',
  'What does the AI actually do?',
  'Can AI agents actually use a Cartwright store?',
  'Where do I get support?',
]);

/** Links are spelled out in the plain twin; compare the prose, not the URLs. */
const URLISH = /\(?\b(?:https?:\/\/)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:app|com|dev|org|io|net|sh|tech)(?:\/[^\s)]*)?\)?/gi;
const norm = (s: string) =>
  s.replace(URLISH, ' ').replace(/[«»"'`]/g, '').replace(/\s+/g, ' ').replace(/\s+([.,;:—-])/g, '$1').trim();

const visibleOf = (node: React.ReactNode) =>
  renderToStaticMarkup(<>{node}</>)
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

/** Sentences of the visible answer that the plain twin does not carry. */
function missingSentences(item: { a: React.ReactNode; plain: string }): string[] {
  const visible = norm(visibleOf(item.a));
  const plain = norm(item.plain);
  return visible
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 12 && !plain.includes(s));
}

describe('home FAQ: the JSON-LD twin says what the visitor reads', async () => {
  const { FAQ_ITEMS } = await import('@/components/landing/faq');

  it.each(FAQ_ITEMS.map((item) => [item.q, item] as const))('%s', (q, item) => {
    const missing = missingSentences(item);
    if (LEGACY_PARAPHRASE.has(q)) {
      expect(
        missing.length,
        `"${q}" now mirrors its visible answer — remove it from LEGACY_PARAPHRASE (the ratchet only tightens).`,
      ).toBeGreaterThan(0);
      return;
    }
    expect(missing, `"${q}": the FAQPage twin drops what the page shows`).toEqual([]);
  });

  it('every listed legacy question still exists — a rename must not silence the ratchet', () => {
    const questions = new Set(FAQ_ITEMS.map((i) => i.q));
    for (const q of LEGACY_PARAPHRASE) expect(questions.has(q), `LEGACY_PARAPHRASE lists a question that is gone: "${q}"`).toBe(true);
  });
});
