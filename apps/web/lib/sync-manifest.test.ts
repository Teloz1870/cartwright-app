import { describe, expect, it } from 'vitest';
import manifest from './marketplace-manifest.json';
import { isAcceptableManifest, manifestRejection } from '../scripts/manifest-acceptance.mjs';

/**
 * Fold-in R1 (PR #374): `pnpm sync:manifest` must refuse an upstream manifest
 * that lib/marketplace.ts would reject at build time. The mirror's main served
 * engine v0.58.2 WITHOUT `engineFacts` while this site already required the
 * field, so a manual refresh would have overwritten the vendored copy with one
 * the loader throws on — and the next build would have failed.
 */
describe('sync:manifest acceptance (scripts/manifest-acceptance.mjs)', () => {
  it('accepts a v3 manifest with engineFacts — the vendored copy itself', () => {
    expect(manifestRejection(manifest)).toBeNull();
    expect(isAcceptableManifest(manifest)).toBe(true);
  });

  it('rejects a v3 manifest without engineFacts, naming the field and the engine version that adds it', () => {
    const { engineFacts: _dropped, ...withoutFacts } = manifest;
    expect(isAcceptableManifest(withoutFacts)).toBe(false);
    const reason = manifestRejection(withoutFacts);
    expect(reason).toMatch(/"engineFacts" is missing/);
    expect(reason).toContain('v0.59.0+');
    expect(reason).toContain(`still serves v${manifest.version}`);
    expect(reason).toMatch(/next engine tag/);
  });

  it('rejects engineFacts that is not an object, or a fact that is not a finite number >= 0', () => {
    expect(manifestRejection({ ...manifest, engineFacts: 'yes' })).toMatch(/"engineFacts" is missing/);
    for (const bad of [-1, Infinity, NaN, '88', null, undefined]) {
      const m = { ...manifest, engineFacts: { ...manifest.engineFacts, toolCount: bad } };
      expect(isAcceptableManifest(m)).toBe(false);
      expect(manifestRejection(m)).toMatch(/engineFacts\.toolCount/);
    }
  });

  it('rejects a wrong $schema before it looks at engineFacts', () => {
    const v4 = { ...manifest, $schema: 'cartwright-marketplace-manifest-v4' };
    expect(isAcceptableManifest(v4)).toBe(false);
    expect(manifestRejection(v4)).toMatch(/\$schema .* expected "cartwright-marketplace-manifest-v3"/);
    expect(manifestRejection(null)).toMatch(/\$schema/);
    expect(manifestRejection(undefined)).toMatch(/\$schema/);
  });
});
