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

  /**
   * The published pair, checked offline. The shape regexes above match `2.9.3`
   * and `v0.56.1` forever, so a receipt could name a release npm stopped
   * serving while every gate stayed green (the docs door said 2.9.3 / v0.56.1
   * while the registry served 2.9.4 / v0.56.2).
   *
   * A receipt is a measurement of what npm SERVES, so it can only exist after
   * a publish. Demanding the version being cut made every bump PR red by
   * construction — measured 2026-09-14: 2.9.5 shipped while the receipt still
   * said 2.9.4, and `main` stayed red for a day, blocking every PR. So,
   * mirroring the engine's readme-site-door test, the receipt may lag by ONE
   * released CLI version (a `## x.y.z` heading in apps/cli/CHANGELOG.md —
   * changesets writes the heading and the version bump in the same PR), and
   * its engine ref must be DEFAULT_REF or a ref one of those two releases
   * actually shipped. Several engine refs can ship inside one CLI release
   * (three on 2026-09-06), so "one engine bump behind DEFAULT_REF" would go
   * red on a receipt that is exactly one release behind. The ref a release
   * shipped is the newest bump-template-ref line from its heading down: older
   * sections only carry older refs. Two releases behind, an unreleased
   * version, or a pair no release served → red.
   */
  function receiptIsCurrent(input: { changelog: string; defaultRef: string; provenance: string }) {
    const released = [...input.changelog.matchAll(/^## (\d+\.\d+\.\d+)\s*$/gm)].map((m) => m[1]);
    const parts = (v: string) => v.replace(/^v/, '').split('.').map(Number);
    const compare = (a: string, b: string) => {
      const [x, y] = [parts(a), parts(b)];
      for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
      return 0;
    };
    // The ref a release shipped: the first section at or below its heading
    // that carries a bump line (document order — changesets prepends, so the
    // nearest section is the latest bump, and a later downgrade is not hidden
    // by an older, higher number further down); within that one section a
    // release ends on its highest bump.
    const sections = input.changelog.split(/^(?=## \d+\.\d+\.\d+\s*$)/m);
    const shippedRef = (v: string) => {
      const from = sections.findIndex((s) => new RegExp(`^## ${v.replace(/\./g, '\\.')}\\s*$`, 'm').test(s));
      if (from < 0) return undefined;
      for (const s of sections.slice(from)) {
        const bumps = [...s.matchAll(/template ref to (v\d+\.\d+\.\d+)\b/g)].map((m) => m[1]);
        if (bumps.length) return bumps.sort((a, b) => compare(b, a))[0];
      }
      return undefined;
    };
    // A receipt is a PAIR the gate measured with ref=stable: a released CLI and
    // the ref that release shipped. The two halves are not judged separately,
    // so "2.9.5 with v0.57.0" — a pair npm never served — is red even when
    // each half is current on its own.
    const pairs = released.slice(0, 2).map((r) => [r, shippedRef(r)] as const);
    const cli = /create-cartwright@(\d+\.\d+\.\d+)/.exec(input.provenance)?.[1];
    const ref = /engine (v\d+\.\d+\.\d+)\b/.exec(input.provenance)?.[1];
    if (!cli || !ref) return { ok: false, reason: 'the provenance names no CLI version or no engine ref' };
    if (!pairs.some(([r]) => r === cli)) {
      return { ok: false, reason: `cites create-cartwright@${cli}; the newest released CLI is ${released[0]} and the one before it is ${released[1] ?? 'none'}` };
    }
    if (!pairs.some(([r, shipped]) => r === cli && shipped === ref)) {
      return { ok: false, reason: `cites create-cartwright@${cli} with engine ${ref}, but that release shipped ${pairs.find(([r]) => r === cli)?.[1] ?? 'no recorded ref'} (DEFAULT_REF is ${input.defaultRef})` };
    }
    return { ok: true as const };
  }

  // Fixtures shaped like apps/cli/CHANGELOG.md: changesets headings, and the
  // bump-template-ref line exactly as bump-template-ref.yml writes it.
  const log = (...sections: Array<[string, string[]]>) =>
    sections.map(([v, lines]) => `## ${v}\n\n${lines.map((l) => `- ${l}`).join('\n')}\n`).join('\n');
  const bump = (to: string, was: string) => `abc1234: Bump default template ref to ${to} (was ${was}).`;
  const prov = (cli: string, ref: string) =>
    `Measured cold run, 2026-09-06, GitHub-hosted ubuntu-latest, create-cartwright@${cli}, engine ${ref} (a1bbe1f), --profile=site --ref=stable --yes --pm=pnpm — release scaffold gate run 34045315774`;
  const today = log(['2.9.5', ['prose only — engine v0.52.0 fixed those strings upstream']], ['2.9.4', [bump('v0.56.2', 'v0.56.1')]], ['2.9.3', [bump('v0.56.1', 'v0.55.0')]]);
  const afterRelease = log(['2.10.0', [bump('v0.57.0', 'v0.56.2')]], ['2.9.5', ['prose only']], ['2.9.4', [bump('v0.56.2', 'v0.56.1')]]);
  const twoBumpsInOneRelease = log(['2.10.0', [bump('v0.57.0', 'v0.56.2'), bump('v0.57.1', 'v0.57.0')]], ['2.9.5', ['prose only']], ['2.9.4', [bump('v0.56.2', 'v0.56.1')]]);
  const sixthOfSeptember = log(['2.9.3', [bump('v0.56.1', 'v0.55.0')]], ['2.9.2', [bump('v0.55.0', 'v0.54.0')]]);
  const downgrade = log(['2.10.1', [bump('v0.56.2', 'v0.57.0')]], ['2.10.0', [bump('v0.57.0', 'v0.56.2')]], ['2.9.5', ['prose only']]);

  it.each([
    ['a phantom pair: the previous CLI with the new engine ref', afterRelease, 'v0.57.0', prov('2.9.5', 'v0.57.0'), false],
    ['a phantom pair: the new CLI with the previous engine ref', afterRelease, 'v0.57.0', prov('2.10.0', 'v0.56.2'), false],
    ['a downgrade release: the receipt follows what it shipped, not the highest number', downgrade, 'v0.56.2', prov('2.10.1', 'v0.56.2'), true],
    ['a downgrade release: the ref it reverted from is no longer served by it', downgrade, 'v0.56.2', prov('2.10.1', 'v0.57.0'), false],
    ['a downgrade release: the release before it still pairs with its own ref', downgrade, 'v0.56.2', prov('2.10.0', 'v0.57.0'), true],
    ['the current pair', today, 'v0.56.2', prov('2.9.5', 'v0.56.2'), true],
    ['one CLI release behind (today: 2.9.4 while 2.9.5 is out)', today, 'v0.56.2', prov('2.9.4', 'v0.56.2'), true],
    ['the bump PR: DEFAULT_REF moves, changelog and receipt unchanged', today, 'v0.57.0', prov('2.9.4', 'v0.56.2'), true],
    ['the release PR with a receipt two releases behind', afterRelease, 'v0.57.0', prov('2.9.4', 'v0.56.2'), false],
    ['the release PR with a receipt one release behind', afterRelease, 'v0.57.0', prov('2.9.5', 'v0.56.2'), true],
    ['after the publish, re-measured', afterRelease, 'v0.57.0', prov('2.10.0', 'v0.57.0'), true],
    ['the next bump PR, receipt current', afterRelease, 'v0.58.0', prov('2.10.0', 'v0.57.0'), true],
    ['the next bump PR while the receipt is one release behind', afterRelease, 'v0.58.0', prov('2.9.5', 'v0.56.2'), true],
    ['two engine bumps in one release, receipt one release behind', twoBumpsInOneRelease, 'v0.57.1', prov('2.9.5', 'v0.56.2'), true],
    ['two engine bumps in one release, receipt cites the ref that release ended on', twoBumpsInOneRelease, 'v0.57.1', prov('2.10.0', 'v0.57.1'), true],
    ['two engine bumps in one release, receipt cites a ref no release served as stable', twoBumpsInOneRelease, 'v0.57.1', prov('2.10.0', 'v0.57.0'), false],
    ['2026-09-06 replayed: engine v0.56.2 tagged, its bump PR open, receipt one CLI release behind', sixthOfSeptember, 'v0.56.2', prov('2.9.2', 'v0.55.0'), true],
    ['two CLI releases behind', today, 'v0.56.2', prov('2.9.3', 'v0.56.1'), false],
    ['an unreleased CLI version (a hand-bumped package.json with a typed receipt)', today, 'v0.56.2', prov('9.9.9', 'v0.56.2'), false],
    ['an engine ref no release shipped', today, 'v0.56.2', prov('2.9.5', 'v0.99.0'), false],
    ['a pair no release served (2.9.4 shipped v0.56.2, not v0.56.1)', today, 'v0.56.2', prov('2.9.4', 'v0.56.1'), false],
    ['a provenance without an engine ref', today, 'v0.56.2', 'Measured cold run, create-cartwright@2.9.5, run 123456', false],
  ])('the currency rule — %s', (_name, changelog, defaultRef, provenance, expected) => {
    expect(receiptIsCurrent({ changelog, defaultRef, provenance }).ok).toBe(expected);
  });

  it('is a receipt for the version customers actually get — at most one release behind', () => {
    const cliDir = join(__dirname, '..', '..', 'cli');
    const changelog = readFileSync(join(cliDir, 'CHANGELOG.md'), 'utf8');
    const refs = readFileSync(join(cliDir, 'src', 'refs.ts'), 'utf8');
    const defaultRef = /DEFAULT_REF\s*=\s*["'`](v\d+\.\d+\.\d+)["'`]/.exec(refs)?.[1];
    expect(defaultRef, 'could not read DEFAULT_REF from apps/cli/src/refs.ts').toBeTruthy();
    const verdict = receiptIsCurrent({ changelog, defaultRef: defaultRef!, provenance: SITE_COLD_RUN.provenance });
    expect(
      verdict.ok,
      `the receipt ${verdict.ok ? '' : verdict.reason} — re-measure with the scaffold gate (ref=stable, cli=latest) and paste the new receipt`,
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
