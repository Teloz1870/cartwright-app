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
    expect(() => renderEngineFacts('<EngineFact />')).toThrow(/needs a literal k/);
    // Inherited names are not facts.
    expect(() => renderEngineFacts('<EngineFact k="toString" />')).toThrow(/no such fact/);
  });

  it('matches every spelling MDX accepts, and leaves code fences and inline code alone', () => {
    const v = String(ENGINE_FACTS.siteRuntimeDeps);
    expect(renderEngineFacts('<EngineFact k={"siteRuntimeDeps"} />')).toBe(v);
    expect(renderEngineFacts("<EngineFact k={'siteRuntimeDeps'} />")).toBe(v);
    expect(renderEngineFacts('<EngineFact k="siteRuntimeDeps"></EngineFact>')).toBe(v);
    expect(renderEngineFacts('<EngineFact className="x" k="siteRuntimeDeps"/>')).toBe(v);
    const example = 'Cite a fact: `<EngineFact k="toolCount" />` — like this:\n\n```tsx\n<EngineFact k="noSuchFact" />\n```\n\nDeps: <EngineFact k="siteRuntimeDeps" />';
    const out = renderEngineFacts(example);
    expect(out).toContain('`<EngineFact k="toolCount" />`');
    expect(out).toContain('```tsx\n<EngineFact k="noSuchFact" />\n```');
    expect(out).toContain(`Deps: ${v}`);
  });

  it('an escaped backtick still closes an inline span — the line that leaked on the built site', () => {
    // Verbatim shape from the processed text of plain-website.mdx: the span
    // opens with a literal backtick and closes with the entity. Counting only
    // literal backticks shifted parity, so the tag after it was treated as
    // code and shipped raw.
    const line = 'repo with `llms.txt&#x60;, and **<EngineFact k="siteRuntimeDeps" /> runtime dependencies** and `next build` after.';
    const out = renderEngineFacts(line);
    expect(out).not.toMatch(/<EngineFact/);
    expect(out).toContain(`**${ENGINE_FACTS.siteRuntimeDeps} runtime dependencies**`);
    // The entity is restored byte-for-byte, and real code is still untouched.
    expect(out).toContain('`llms.txt&#x60;');
    expect(out).toContain('`next build`');
  });

  it('leaves indented code blocks alone', () => {
    const md = 'Prose:\n\n    <EngineFact k="noSuchFact" />\n\nDeps: <EngineFact k="siteRuntimeDeps" />';
    const out = renderEngineFacts(md);
    expect(out).toContain('    <EngineFact k="noSuchFact" />');
    expect(out).toContain(`Deps: ${ENGINE_FACTS.siteRuntimeDeps}`);
  });

  it('a computed key throws instead of shipping the tag', () => {
    expect(() => renderEngineFacts('Deps: <EngineFact k={someVar} />')).toThrow(/needs a literal k/);
  });

  it('the one spelling it cannot see is a key written with backticks — and no page uses it', () => {
    // Backticks read as an inline code span, so such a tag is treated as code
    // and left verbatim rather than throwing. The heuristic cannot tell a JSX
    // template literal from a code span, so the guard is the corpus itself.
    const md = 'Deps: <EngineFact k={`toolCount`} />';
    expect(renderEngineFacts(md)).toBe(md);
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
    for (const f of files) {
      for (const m of readFileSync(f, 'utf8').matchAll(/<EngineFact\b[\s\S]*?\/>/g)) {
        expect(m[0], `${f}: an EngineFact tag with a backtick would be treated as code`).not.toContain('`');
      }
    }
  });

  it('an attribute containing > does not break the parse', () => {
    expect(renderEngineFacts('<EngineFact title="a>b" k="siteRuntimeDeps" />')).toBe(String(ENGINE_FACTS.siteRuntimeDeps));
  });

  it('every fact is a scalar that survives String() and a Markdown table cell', () => {
    for (const [k, v] of Object.entries(ENGINE_FACTS)) {
      expect(['string', 'number'].includes(typeof v), `${k} is ${typeof v}`).toBe(true);
      expect(String(v), k).not.toMatch(/[|\n]/);
    }
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
