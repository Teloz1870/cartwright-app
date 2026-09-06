import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { FRONT_DOOR } from './home-copy';
import { Hero } from '@/components/landing/hero';
import { ThreeDoors } from '@/components/landing/three-doors';

/**
 * Render-level, not source-level: a `{FRONT_DOOR}` left inside a JSX comment
 * kept the source grep green (falsifier on #346). The rendered HTML escapes
 * apostrophes and dashes, so the assertion uses the sentence's opening clause.
 */
const OPENING = 'You own the front';
const CLAUSE = 'pick one of the shipped design packs, start from the blank canvas';

describe('the front door is in the rendered HTML', () => {
  it('hero renders the sentence once, with the choose-your-path link', () => {
    const html = renderToStaticMarkup(<Hero />);
    expect(html).toContain('Either door, the same rule:');
    expect(html).toContain(OPENING);
    expect(html).toContain(CLAUSE);
    expect(html).toContain('/docs/getting-started/choose-your-path');
    expect(html.split(OPENING).length - 1).toBe(1);
  });

  it('three doors renders it in the closing paragraph', () => {
    const html = renderToStaticMarkup(<ThreeDoors />);
    expect(html).toContain(CLAUSE);
    expect(html).toContain('--profile site');
  });

  it('the constant itself is what renders (no retyped copy)', () => {
    expect(FRONT_DOOR).toContain(CLAUSE);
  });
});
