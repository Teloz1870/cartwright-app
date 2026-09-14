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

  it('is a receipt for the version customers actually get — at most one release behind', () => {
    // The shape regexes above match `2.9.3` and `v0.56.1` forever, so the
    // provenance could name a release that npm stopped serving hours ago while
    // every gate stayed green (the docs door said 2.9.3 / v0.56.1 while the
    // registry served 2.9.4 / v0.56.2). Both sides of the published pair live
    // in this repo, so the currency is checkable offline.
    //
    // "The version this repo publishes" cannot mean the one being cut: a
    // receipt only exists AFTER publish, because the scaffold gate measures the
    // PUBLISHED pair. Demanding the new version made every bump PR red by
    // construction — measured 2026-09-14: 2.9.5 shipped while the receipt
    // still said 2.9.4, and `main` stayed red for a day, blocking every PR.
    // So, mirroring the engine's readme-site-door test: the receipt must cite
    // a RELEASED CLI version that is the current one or the one immediately
    // before it, and an engine ref that is DEFAULT_REF or the newest ref the
    // CLI shipped before it. Two releases behind is still red.
    const cliDir = join(__dirname, '..', '..', 'cli');
    const cliPkg = JSON.parse(readFileSync(join(cliDir, 'package.json'), 'utf8')) as { version: string };
    const cliChangelog = readFileSync(join(cliDir, 'CHANGELOG.md'), 'utf8');
    const released = [...cliChangelog.matchAll(/^## (\d+\.\d+\.\d+)$/gm)].map((m) => m[1]);
    expect(released.length, 'apps/cli/CHANGELOG.md lists the released versions').toBeGreaterThan(1);
    const allowedCli = new Set([cliPkg.version, ...released.slice(0, 2)]);
    const citedCli = /create-cartwright@(\d+\.\d+\.\d+)/.exec(SITE_COLD_RUN.provenance)?.[1];
    expect(citedCli, 'provenance names a CLI version').toBeTruthy();
    expect(
      allowedCli.has(citedCli!),
      `provenance cites create-cartwright@${citedCli}; this repo publishes ${cliPkg.version} and the release before it is ${released[1]} — re-measure with the scaffold gate (ref=stable, cli=latest) and paste the new receipt`,
    ).toBe(true);

    const refs = readFileSync(join(cliDir, 'src', 'refs.ts'), 'utf8');
    const defaultRef = /DEFAULT_REF\s*=\s*["'`](v\d+\.\d+\.\d+)["'`]/.exec(refs)?.[1];
    expect(defaultRef, 'could not read DEFAULT_REF from apps/cli/src/refs.ts').toBeTruthy();
    const parts = (v: string) => v.replace(/^v/, '').split('.').map(Number);
    const isOlder = (a: string, b: string) => {
      const [x, y] = [parts(a), parts(b)];
      for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] < y[i];
      return false;
    };
    // Every engine ref the CLI has shipped is named in its changelog (the
    // bump-template-ref changesets); the newest one below DEFAULT_REF is the
    // previous default.
    const previousRef = [...new Set([...cliChangelog.matchAll(/\bv\d+\.\d+\.\d+\b/g)].map((m) => m[0]))]
      .filter((r) => isOlder(r, defaultRef!))
      .sort((a, b) => (isOlder(a, b) ? 1 : -1))[0];
    const allowedRef = new Set([defaultRef!, ...(previousRef ? [previousRef] : [])]);
    const citedRef = /engine (v\d+\.\d+\.\d+) /.exec(SITE_COLD_RUN.provenance)?.[1];
    expect(citedRef, 'provenance names an engine ref').toBeTruthy();
    expect(
      allowedRef.has(citedRef!),
      `provenance cites engine ${citedRef}; the CLI's DEFAULT_REF is ${defaultRef} and the ref it shipped before that is ${previousRef ?? 'unknown'}`,
    ).toBe(true);
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
