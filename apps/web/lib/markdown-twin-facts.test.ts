import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ENGINE_FACTS, renderEngineFacts } from '@/lib/engine-facts';
import { SITE_COLD_RUN } from '@/lib/home-copy';

/**
 * A docs page's Markdown twin must carry the NUMBERS, not the component tags
 * that produce them in HTML. Measured live 2026-09-06 on the plain-website
 * runbook: eight raw `<EngineFact …/>` tags, zero numbers — for the AI reader
 * the whole program targets. `renderEngineFacts` runs inside `getLLMText`, the
 * one path the `.md` twin and `/llms-full.txt` share.
 */
describe('renderEngineFacts', () => {
  it('replaces every tag with its value, in either quote style, and leaves prose alone', () => {
    const md = `Measured: <EngineFact k="siteColdRunScaffold" /> to scaffold, <EngineFact k='siteRuntimeDeps'/> deps.`;
    expect(renderEngineFacts(md)).toBe(`Measured: ${SITE_COLD_RUN.scaffold} to scaffold, ${ENGINE_FACTS.siteRuntimeDeps} deps.`);
    expect(renderEngineFacts('no tags here')).toBe('no tags here');
  });

  it('throws on a fact that does not exist — a typo must fail the build, not ship as a tag', () => {
    expect(() => renderEngineFacts('<EngineFact k="noSuchFact" />')).toThrow(/no such fact/);
  });

  it('every <EngineFact k> cited anywhere in content/docs names a real fact', () => {
    const root = join(__dirname, '..', 'content', 'docs');
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) walk(full);
        else if (name.endsWith('.mdx')) files.push(full);
      }
    };
    walk(root);
    const keys = new Set<string>();
    for (const f of files) {
      for (const m of readFileSync(f, 'utf8').matchAll(/<EngineFact\s+k=["']([A-Za-z0-9_]+)["']\s*\/>/g)) keys.add(m[1]);
    }
    expect(keys.size).toBeGreaterThan(5);
    for (const k of keys) expect(k in ENGINE_FACTS, `<EngineFact k="${k}" /> has no fact`).toBe(true);
    // And rendering the whole corpus leaves no tag behind.
    for (const f of files) expect(renderEngineFacts(readFileSync(f, 'utf8'))).not.toMatch(/<EngineFact/);
  });
});
