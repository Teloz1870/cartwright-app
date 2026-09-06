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

  it('is a receipt for the version customers actually get — not an older one', () => {
    // The shape regexes below match `2.9.3` and `v0.56.1` forever, so the
    // provenance could name a release that npm stopped serving hours ago while
    // every gate stayed green (the docs door said 2.9.3 / v0.56.1 while the
    // registry served 2.9.4 / v0.56.2). Both sides of the published pair live
    // in this repo, so the currency is checkable offline.
    const cliPkg = JSON.parse(readFileSync(join(__dirname, '..', '..', 'cli', 'package.json'), 'utf8')) as { version: string };
    const refs = readFileSync(join(__dirname, '..', '..', 'cli', 'src', 'refs.ts'), 'utf8');
    const defaultRef = /DEFAULT_REF\s*=\s*["'`](v\d+\.\d+\.\d+)["'`]/.exec(refs)?.[1];
    expect(defaultRef, 'could not read DEFAULT_REF from apps/cli/src/refs.ts').toBeTruthy();
    expect(
      SITE_COLD_RUN.provenance,
      `provenance cites a CLI other than the one this repo publishes (${cliPkg.version})`,
    ).toContain(`create-cartwright@${cliPkg.version}`);
    expect(
      SITE_COLD_RUN.provenance,
      `provenance cites an engine other than the CLI's DEFAULT_REF (${defaultRef})`,
    ).toContain(`engine ${defaultRef} `);
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
