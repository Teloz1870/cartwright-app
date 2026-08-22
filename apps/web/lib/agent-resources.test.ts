import { describe, expect, it } from 'vitest';
import {
  AGENT_RESOURCES,
  RECOVERY_RESOURCES,
  SITE_URL,
  recoveryMarkdown,
} from './agent-resources';
import { routeExists } from './route-exists';

/**
 * The pointer lists, checked against the filesystem.
 *
 * Every finding this branch addresses is a variation on "an agent followed a
 * signal and got nothing", so the one unacceptable outcome is shipping a
 * recovery message that points at a 404. These tests are cheap insurance
 * against exactly that.
 */

describe('AGENT_RESOURCES', () => {
  it('points only at paths that exist in this repo', () => {
    const missing = AGENT_RESOURCES.filter((r) => !routeExists(r.path));
    expect(missing.map((r) => r.path)).toEqual([]);
  });

  it('is non-empty and free of duplicate paths', () => {
    expect(AGENT_RESOURCES.length).toBeGreaterThan(0);
    const paths = AGENT_RESOURCES.map((r) => r.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('leads with llms.txt, the only entry that explains the others', () => {
    expect(AGENT_RESOURCES[0].path).toBe('/llms.txt');
  });

  it('gives every entry a title, a description and a content type', () => {
    for (const r of AGENT_RESOURCES) {
      expect(r.title.length, r.path).toBeGreaterThan(0);
      // A one-word description is not guidance; require a real sentence.
      expect(r.description.length, r.path).toBeGreaterThan(20);
      expect(r.contentType, r.path).toMatch(/^[a-z]+\/[a-z0-9.+-]+$/);
    }
  });

  it('uses absolute-from-root paths, never a full URL', () => {
    // They are concatenated onto SITE_URL in three places; a stray absolute URL
    // would produce `https://cartwright.apphttps://…`.
    for (const r of AGENT_RESOURCES) expect(r.path.startsWith('/')).toBe(true);
  });
});

describe('RECOVERY_RESOURCES', () => {
  it('is a real subset — short enough to read, not the whole list again', () => {
    expect(RECOVERY_RESOURCES.length).toBeGreaterThan(0);
    expect(RECOVERY_RESOURCES.length).toBeLessThan(AGENT_RESOURCES.length);
    for (const r of RECOVERY_RESOURCES) expect(AGENT_RESOURCES).toContain(r);
  });
});

describe('recoveryMarkdown', () => {
  const body = recoveryMarkdown('/some/missing/page');

  it('names the path that was missed, so the reader knows which link was bad', () => {
    expect(body).toContain('/some/missing/page');
  });

  it('is Markdown with a heading and absolute links', () => {
    expect(body.startsWith('# ')).toBe(true);
    for (const r of RECOVERY_RESOURCES) {
      expect(body).toContain(`(${SITE_URL}${r.path})`);
    }
  });

  it('states that the 404 is real — the fact that makes a 200 here trustworthy', () => {
    expect(body).toMatch(/real 404/i);
  });

  it('cannot be broken out of by the path it echoes', () => {
    // The path comes from the URL, so it is attacker-controlled. The route
    // handler strips backticks and newlines before calling this; that stripping
    // is asserted here as a property of the pair.
    const hostile = '/x`\n\n# Injected heading\n\n[click](https://evil.example)';
    const sanitised = hostile.replace(/[`\r\n]/g, '').slice(0, 200);
    const rendered = recoveryMarkdown(sanitised);

    // Only our own headings survive — nothing the caller supplied became one.
    const headings = rendered.split('\n').filter((line) => line.startsWith('#'));
    expect(headings).toEqual(['# 404 — no such page', '## Where to look next', '## Search']);

    // And the whole hostile string stays inside the code span on one line, so
    // its `[click](…)` renders as literal text rather than as a link.
    const echoLine = rendered
      .split('\n')
      .find((line) => line.includes('evil.example'));
    expect(echoLine).toBeDefined();
    expect(echoLine).toMatch(/^`[^`]*`\s/);
  });
});
