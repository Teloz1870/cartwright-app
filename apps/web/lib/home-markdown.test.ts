import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { GET } from '../app/llms.mdx/home/route';
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
    const body = await GET().text();
    const command = hero.match(/command="([^"]+)"/)?.[1];
    expect(command, 'hero.tsx no longer renders a CopyCommand').toBeTruthy();
    expect(body).toContain(command!);
  });

  it('states the same headline claim the React homepage renders', async () => {
    const body = await GET().text();
    // The h1 is split across two spans for the rise animation; rejoin it the
    // way a reader sees it.
    const spans = [...hero.matchAll(/<span className="cw-rise[^"]*">([^<]+)<\/span>/g)].map(
      (m) => m[1],
    );
    expect(spans.length, 'hero.tsx h1 structure changed').toBe(2);
    expect(body).toContain(spans.join(' '));
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
