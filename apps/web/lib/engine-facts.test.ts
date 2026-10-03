import { describe, expect, it, vi } from 'vitest';
import manifest from './marketplace-manifest.json';
import { ENGINE_FACTS } from './engine-facts';

/**
 * PAR1-a: the four engine counts the site states are read from the vendored
 * manifest's `engineFacts` (derived and test-pinned in the engine), never
 * typed here. A manifest without them must fail the build, not fall back.
 */
describe('ENGINE_FACTS reads the engine counts from the manifest', () => {
  it('states exactly what the vendored manifest derived', () => {
    expect(ENGINE_FACTS.toolCount).toBe(manifest.engineFacts.toolCount);
    expect(ENGINE_FACTS.scopeCount).toBe(manifest.engineFacts.scopeCount);
    expect(ENGINE_FACTS.adminToolCount).toBe(manifest.engineFacts.adminToolCount);
    expect(ENGINE_FACTS.confirmGatedCount).toBe(manifest.engineFacts.confirmGatedCount);
    // Well-formed: confirm-gated ⊆ admin-allowlisted ⊆ registered.
    expect(ENGINE_FACTS.confirmGatedCount).toBeLessThanOrEqual(ENGINE_FACTS.adminToolCount);
    expect(ENGINE_FACTS.adminToolCount).toBeLessThanOrEqual(ENGINE_FACTS.toolCount);
  });

  it('fails the build, naming the field, when the manifest has no engineFacts', async () => {
    vi.resetModules();
    const { engineFacts: _dropped, ...withoutFacts } = manifest;
    vi.doMock('./marketplace-manifest.json', () => ({ default: withoutFacts }));
    await expect(import('./marketplace')).rejects.toThrow(/engineFacts.*missing/);
    vi.doUnmock('./marketplace-manifest.json');
    vi.resetModules();
  });

  it('fails the build when a fact is not a positive integer', async () => {
    vi.resetModules();
    vi.doMock('./marketplace-manifest.json', () => ({
      default: { ...manifest, engineFacts: { ...manifest.engineFacts, toolCount: 0 } },
    }));
    await expect(import('./marketplace')).rejects.toThrow(/engineFacts\.toolCount is 0/);
    vi.doUnmock('./marketplace-manifest.json');
    vi.resetModules();
  });
});
