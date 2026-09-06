import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SITE_COLD_RUN, INSTALL_COMMAND_SITE } from './home-copy';
import { ENGINE_FACTS } from './engine-facts';

/**
 * The site profile's numbers are copied from the scaffold gate's timings
 * artifact, never typed — and the site's own rule is that a quoted number
 * carries its date, CLI version and engine ref. This pins that shape, so a
 * stale or hand-edited record cannot ship quietly.
 */
describe('SITE_COLD_RUN — measured, with provenance', () => {
  it('carries a date, a CLI version, an engine ref and a run id', () => {
    expect(SITE_COLD_RUN.provenance).toMatch(/\b\d{4}-\d{2}-\d{2}\b/);
    expect(SITE_COLD_RUN.provenance).toMatch(/create-cartwright@\d+\.\d+\.\d+/);
    expect(SITE_COLD_RUN.provenance).toMatch(/engine v\d+\.\d+\.\d+/);
    expect(SITE_COLD_RUN.provenance).toMatch(/run \d{6,}/);
  });

  it('renders every timing with the tilde — measured, not guaranteed', () => {
    for (const v of [SITE_COLD_RUN.scaffold, SITE_COLD_RUN.build, SITE_COLD_RUN.boot]) {
      // Bare durations: every surface supplies its own label, so a fact can never
      // read "~24 s scaffold + install to scaffold and install" (Gemini R2).
      expect(v).toMatch(/^~\d+ s$/);
    }
  });

  it('feeds the engine facts the docs cite', () => {
    expect(ENGINE_FACTS.siteRuntimeDeps).toBe(SITE_COLD_RUN.runtimeDependencies);
    expect(ENGINE_FACTS.siteColdRunProvenance).toBe(SITE_COLD_RUN.provenance);
    expect(ENGINE_FACTS.siteEnvVarsToBoot).toBe(0);
    // Pinned, not bounded: the count is copied from a real materialization and
    // must move together with its authority comment (17 → 8 with engine v0.56.0).
    expect(ENGINE_FACTS.siteDesignPacks).toBe(8);
  });

  it('names the site profile on every docs surface this program touches, with the explicit flag', () => {
    const root = join(__dirname, '..');
    const surfaces = [
      'content/docs/introduction.mdx',
      'content/docs/in-the-box.mdx',
      'content/docs/why-cartwright.mdx',
      'content/docs/getting-started/plain-website.mdx',
      'content/docs/getting-started/ai-quick-start.mdx',
      'content/docs/getting-started/cli-options.mdx',
      'content/docs/getting-started/quick-start.mdx',
    ];
    for (const rel of surfaces) {
      const p = join(root, rel);
      expect(existsSync(p), `${rel} exists`).toBe(true);
      expect(readFileSync(p, 'utf8'), `${rel} names --profile site`).toContain('--profile site');
    }
    expect(INSTALL_COMMAND_SITE).toContain('--profile site');
    // The steer-away callout is gone for good.
    expect(readFileSync(join(root, 'content/docs/getting-started/ai-quick-start.mdx'), 'utf8')).not.toContain(
      'intentionally has none of those surfaces',
    );
  });
});
