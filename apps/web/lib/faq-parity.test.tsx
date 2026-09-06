// @vitest-environment node
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/link', () => ({ default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }));

/**
 * FAQPage JSON-LD is built from each item's `plain`; Google requires it to
 * mirror the visible answer. A falsifier removed a sentence from one `plain`
 * and nothing went red — so: the visible answer, rendered and stripped of
 * tags, must be a prefix of `plain`, and only a trailing URL may follow it.
 */
describe('home FAQ: every plain twin mirrors its visible answer', async () => {
  const { FAQ_ITEMS } = await import('@/components/landing/faq');
  const visibleText = (node: React.ReactNode) =>
    renderToStaticMarkup(<>{node}</>)
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();

  it.each(FAQ_ITEMS.map((item) => [item.q, item] as const))('%s', (_q, item) => {
    const visible = visibleText(item.a);
    const plain = item.plain.replace(/\s+/g, ' ').trim();
    expect(plain.startsWith(visible), `plain does not start with the visible answer:\n  visible: ${visible}\n  plain:   ${plain}`).toBe(true);
    expect(plain.slice(visible.length)).toMatch(/^( \S+)?$/);
  });
});
