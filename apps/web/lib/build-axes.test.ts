import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { METHODS, ORIGINS, NOT_A_FIT, WHEN_TO_USE } from './when-to-use';
import { routeExists } from './route-exists';

/**
 * The three axes are data, and the data is RENDERED — a method or origin that
 * exists in the constant but never reaches the when-to-use block is exactly
 * the failure this guards against. Measured 2026-09-06 (replay V2): the one
 * run that chose Cartwright for a designed one-pager had FOUND the `blank`
 * pack; the two that declined never saw it. The profile coupling on the
 * origin axis (Shopify → `full`) is a PIN, not a derivation: this repo does
 * not vendor the engine's scaffold manifest, so the coupling is stated here
 * and checked against the engine by hand when the manifest changes.
 */
const ROOT = join(__dirname, '..');
const PROFILES = ['site', 'light', 'full'];

describe('build methods (axis 2)', () => {
  it('lists the three equal freedoms first, then the generating tools', () => {
    expect(METHODS.slice(0, 3).map((m) => m.id)).toEqual(['design-pack', 'blank', 'own-pack']);
    expect(METHODS.map((m) => m.id)).toEqual(['design-pack', 'blank', 'own-pack', 'magic-builder', 'mockup-first', 'v0']);
  });

  it('every method names real profiles, a literal entry, and a docs route that exists', () => {
    for (const m of METHODS) {
      expect(m.profiles.length, m.id).toBeGreaterThan(0);
      for (const p of m.profiles) expect(PROFILES, `${m.id}: ${p}`).toContain(p);
      expect(m.entry.length, m.id).toBeGreaterThan(20);
      expect(routeExists(m.docs), `${m.id}: ${m.docs}`).toBe(true);
    }
  });

  it('a method that produces data cannot claim the site profile — there is no database there', () => {
    for (const m of METHODS) {
      if (m.output === 'data') expect(m.profiles, m.id).not.toContain('site');
      if (m.output === 'code') expect(m.profiles, m.id).toContain('site');
    }
  });

  it('is rendered in the when-to-use block, every method by name', () => {
    for (const m of METHODS) expect(WHEN_TO_USE, m.id).toContain(m.name);
    expect(WHEN_TO_USE).toContain('none of the build methods binds you');
  });
});

describe('origins (axis 3)', () => {
  it('every origin names a real profile and a docs route that exists', () => {
    for (const o of ORIGINS) {
      expect(PROFILES, o.id).toContain(o.minProfile);
      expect(routeExists(o.docs), `${o.id}: ${o.docs}`).toBe(true);
    }
  });

  it('couples the profile to the origin that forces it, on the same line the reader decides from', () => {
    const shopify = ORIGINS.find((o) => o.id === 'shopify')!;
    expect(shopify.minProfile).toBe('full');
    expect(WHEN_TO_USE).toMatch(/Shopify[^\n]*--profile full/);
    // A Woo migration does NOT need full — a replay claimed it did (V4 baseline, run 2).
    expect(ORIGINS.find((o) => o.id === 'woocommerce')!.minProfile).toBe('light');
    expect(ORIGINS.find((o) => o.id === 'url')!.minProfile).toBe('light');
  });

  it('says what moves today AND what does not — a planned origin is never a bare promise', () => {
    for (const o of ORIGINS) {
      expect(o.today.length, o.id).toBeGreaterThan(20);
      if (o.status === 'planned') expect(o.notYet.length, o.id).toBeGreaterThan(40);
    }
  });

  it('"origin" cannot be read as "host": the WordPress line disambiguates, and not-a-fit still names WordPress hosting', () => {
    const woo = ORIGINS.find((o) => o.id === 'woocommerce')!;
    expect(woo.notRuntime).toBeTruthy();
    expect(WHEN_TO_USE).toContain(woo.notRuntime!);
    expect(NOT_A_FIT.join('\n')).toMatch(/WordPress hosting/);
  });

  it('is rendered in the when-to-use block, every origin by name', () => {
    for (const o of ORIGINS) expect(WHEN_TO_USE, o.id).toContain(o.name);
  });

  it('the page that houses the axes exists and is in the docs navigation', () => {
    const meta = JSON.parse(readFileSync(join(ROOT, 'content/docs/getting-started/meta.json'), 'utf8')) as { pages: string[] };
    expect(meta.pages).toContain('choose-your-path');
    expect(routeExists('/docs/getting-started/choose-your-path')).toBe(true);
    expect(WHEN_TO_USE).toContain('/docs/getting-started/choose-your-path');
  });
});
