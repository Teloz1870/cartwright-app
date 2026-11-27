import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The docs' agent runbooks start the dev server the way the scaffold's own
 * rules files do.
 *
 * Four doors tell an AI how to run a fresh scaffold: the CLI's "Next steps"
 * agent block, the scaffold's AGENTS.md / .claude/CLAUDE.md ("Start the dev
 * server (agents)"), the engine README, and this site's AI quick start. Until
 * 2026-11-28 the quick start said `pnpm dev &   # assumes :3000 is free` and
 * curled `http://localhost:3000` in every later step — while the other three
 * say never assume port 3000 (Next moves to 3001, 3002, … when it is taken),
 * run `pnpm dev:agent`, and read the URL it chose from `.cartwright/dev-url`.
 * An agent that obeyed the page polled a port its server was not on, or a
 * server that was someone else's.
 *
 * Human lines ("open http://localhost:3000") are not policed here; only the
 * shell blocks of the runbooks an agent executes are.
 */
const WEB = join(__dirname, '..');
const read = (rel: string) => readFileSync(join(WEB, rel), 'utf8');

const QUICK_START = 'content/docs/getting-started/ai-quick-start.mdx';
const AGENT_RUNBOOKS = [QUICK_START, 'content/docs/getting-started/plain-website.mdx'];

/** The CLI's own constants — the agent block the scaffold prints uses them. */
function cliConstant(name: string): string {
  const src = readFileSync(join(WEB, '..', 'cli', 'src', 'next-steps.ts'), 'utf8');
  const m = new RegExp(`export const ${name} = "([^"]+)";`).exec(src);
  if (!m) throw new Error(`apps/cli/src/next-steps.ts no longer exports ${name}`);
  return m[1];
}

/** The lines of every ```bash / ```sh fence, indented fences (inside <Steps>) included. */
function shellLines(mdx: string): string[] {
  const out: string[] = [];
  for (const m of mdx.matchAll(/^[ \t]*```(\w*)[^\n]*\n([\s\S]*?)^[ \t]*```/gm)) {
    if (m[1] === 'bash' || m[1] === 'sh' || m[1] === 'shell') out.push(...m[2].split('\n'));
  }
  return out;
}

describe('agent runbooks start the dev server like the rules files', () => {
  it.each(AGENT_RUNBOOKS)('%s: no shell step assumes port 3000 or a bare `pnpm dev`', (rel) => {
    const lines = shellLines(read(rel));
    expect(lines.length, `${rel} has shell blocks`).toBeGreaterThan(0);
    for (const line of lines) {
      expect(line, `${rel}: an agent step hardcodes the port`).not.toMatch(/localhost:3000|127\.0\.0\.1:3000|:3000 is free/);
      // `pnpm dev`, `pnpm dev &` — but not `pnpm dev:agent`.
      expect(line, `${rel}: an agent step starts \`pnpm dev\` instead of dev:agent`).not.toMatch(/\bpnpm dev(?![:\w-])/);
      if (/\bcurl\b/.test(line)) {
        expect(line, `${rel}: a curl that does not target $BASE (or the deploy/poll $URL)`).toMatch(/"\$(BASE|URL)\b/);
      }
    }
  });

  it('the quick start never gives a port-3000 URL as a fact, anywhere on the page', () => {
    // "Never assume `localhost:3000`" (the rules files' own words) may stay; a URL may not.
    expect(read(QUICK_START)).not.toMatch(/https?:\/\/(localhost|127\.0\.0\.1):3000/);
  });

  it('the quick start names the same script, file and rules section as the CLI agent block', () => {
    const page = read(QUICK_START);
    expect(page).toContain(`pnpm ${cliConstant('DEV_AGENT_SCRIPT')}`);
    expect(page).toContain(cliConstant('DEV_URL_FILE'));
    expect(page).toContain(cliConstant('AGENT_RULES_SECTION'));
  });

  it("the quick start's start block is the engine's: PID reuse, a bounded poll, BASE from dev-url before its first use", () => {
    const shell = shellLines(read(QUICK_START)).join('\n');
    expect(shell).toContain('pnpm dev:agent > /tmp/cartwright-dev.log 2>&1 &');
    // One `next dev` per project: reuse a live server, never start a second one.
    expect(shell).toContain('kill -0 "$SERVER_PID"');
    expect(shell).toContain('.cartwright/dev-pid');
    // Bounded — an agent must never wait forever on a server that died.
    expect(shell).toMatch(/for i in \$\(seq \d+\); do/);
    const define = shell.indexOf("BASE=$(sed -E 's#^(https?://[^/]+).*#\\1#' .cartwright/dev-url");
    expect(define, 'BASE is derived from .cartwright/dev-url').toBeGreaterThan(-1);
    expect(define, 'BASE is defined before the first step uses it').toBeLessThan(shell.indexOf('"$BASE'));
  });

  it('a quoted timing says which release it was measured on', () => {
    // The ~99 s Path B run was measured once, on engine v0.35.0 (June 2026),
    // before dev:agent existed (apps/web/app/changelog/page.tsx, v0.35.0 entry).
    // An undated figure reads as a promise about today's release.
    const page = read(QUICK_START);
    const timed = page.split('\n').filter((l) => /\b99(\s|-)?(s\b|sec|second)/.test(l));
    expect(timed.length, 'the page still quotes the run').toBeGreaterThan(0);
    for (const line of timed) expect(line, 'an undated ~99 s claim').toContain('v0.35.0');
  });
});
