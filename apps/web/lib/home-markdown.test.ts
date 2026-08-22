import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { GET } from '../app/llms.mdx/home/route';
import { HOME_H1_TEXT, INSTALL_COMMAND } from './home-copy';
import { GET as NOT_FOUND_GET } from '../app/llms.mdx/not-found/route';
import { MARKDOWN_CONTENT_TYPE } from './content-negotiation';

/**
 * The Markdown representations.
 *
 * The homepage one is authored rather than converted from the DOM, which buys
 * an agent a clean document and costs a drift risk: the React page can change
 * its claim or its install command and this file would happily keep serving the
 * old one. So the two facts that would actually mislead someone — the headline
 * claim and the command they are told to run — are asserted against the React
 * source, not against a copy of themselves.
 */

const WEB_ROOT = path.dirname(fileURLToPath(new URL('.', import.meta.url)));
const hero = readFileSync(path.join(WEB_ROOT, 'components/landing/hero.tsx'), 'utf8');

describe('GET /llms.mdx/home', () => {
  it('is Markdown with the charset stated', () => {
    expect(GET().headers.get('content-type')).toBe(MARKDOWN_CONTENT_TYPE);
  });

  it('varies on Accept, because `/` has two representations', () => {
    // Without this a shared cache serves whichever variant it saw first to
    // everyone — the exact failure the audit flagged.
    expect(GET().headers.get('vary')).toBe('Accept');
  });

  it('leads with a single h1 and is substantial enough to be worth fetching', async () => {
    const body = await GET().text();
    const h1s = body.split('\n').filter((line) => /^# /.test(line));
    expect(h1s).toHaveLength(1);
    expect(body.length).toBeGreaterThan(1000);
  });

  it('has a real heading hierarchy, not a flat wall', async () => {
    const body = await GET().text();
    expect(body.split('\n').filter((line) => /^## /.test(line)).length).toBeGreaterThanOrEqual(4);
  });

  it('states the same install command the React homepage renders', async () => {
    // Both read `INSTALL_COMMAND`. This used to grep `command="…"` out of
    // hero.tsx's source, which made every restyle of the hero a failing
    // Markdown test — accurate about the trigger, wrong about the cause.
    expect(await GET().text()).toContain(INSTALL_COMMAND);
    expect(hero).toContain('INSTALL_COMMAND');
  });

  it('states the same headline claim the React homepage renders', async () => {
    // Same story: the old assertion matched `<span className="cw-rise…">` and
    // required exactly two, so restyling the h1 failed with "hero.tsx h1
    // structure changed" and invited someone to edit the Markdown instead.
    expect(await GET().text()).toContain(HOME_H1_TEXT);
    expect(hero).toContain('HOME_H1_LINES');
  });

  it('renders the h1 from the shared lines, joined by an explicit space', () => {
    // The one thing the hero must still do in markup: JSX drops whitespace-only
    // nodes between elements, so without `{' '}` the h1's text content is the
    // run-together "AI runs the shop.You keep the keys."
    expect(hero).toContain("{' '}");
    expect(HOME_H1_TEXT).toBe('AI runs the shop. You keep the keys.');
  });

  it('carries the when-to-use guidance, not just a description', async () => {
    const body = await GET().text();
    expect(body).toMatch(/## When to use Cartwright/);
    expect(body).toMatch(/not a fit/i);
  });
});

describe('GET /llms.mdx/not-found', () => {
  const call = (url: string) => NOT_FOUND_GET(new Request(`https://cartwright.app${url}`));

  it('is a real 404, not a soft one', () => {
    // A recovery body served as 200 is the worst outcome for a crawler: it
    // makes every guessed URL look real.
    expect(call('/llms.mdx/not-found?path=/nope').status).toBe(404);
  });

  it('is Markdown, uncacheable and not indexable', () => {
    const res = call('/llms.mdx/not-found?path=/nope');
    expect(res.headers.get('content-type')).toBe(MARKDOWN_CONTENT_TYPE);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('x-robots-tag')).toBe('noindex');
  });

  it('echoes the missed path so the caller knows which link was bad', async () => {
    expect(await call('/llms.mdx/not-found?path=/pricing-old').text()).toContain(
      '/pricing-old',
    );
  });

  it('strips backticks and newlines from the echoed path', async () => {
    const body = await call(
      '/llms.mdx/not-found?path=' + encodeURIComponent('/x`\n# Injected'),
    ).text();

    const headings = body.split('\n').filter((line) => line.startsWith('#'));
    expect(headings).toEqual([
      '# 404 — no such page',
      '## Where to look next',
      '## Search',
    ]);
  });

  it('bounds the echoed path so a long URL cannot pad the response', async () => {
    const body = await call(`/llms.mdx/not-found?path=/${'a'.repeat(5000)}`).text();
    expect(body.length).toBeLessThan(3000);
  });

  it('defaults to / when no path is supplied', async () => {
    expect(await call('/llms.mdx/not-found').text()).toContain('`/`');
  });
});
