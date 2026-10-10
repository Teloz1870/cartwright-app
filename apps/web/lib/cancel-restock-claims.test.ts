import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Engine #626: Stripe's `payment_intent.canceled` webhook cancels an order
 * only while it is still `pending_payment`, and returns its stock in the same
 * transaction (lib/orders/cancel-unpaid.ts). It no longer overwrites a paid,
 * flagged, shipped or refunded order. The checkout docs said
 * "`payment_intent.canceled` → order set to `cancelled`" — unconditional, and
 * silent on stock — which is what engines up to v0.60.0 did.
 *
 * Any event-dispatch line for that webhook ("`payment_intent.canceled` → …")
 * must name the `pending_payment` condition. The rule walks every surface, so
 * a new page that lists the webhook events cannot bring the old claim back.
 * The changelog is history and keeps what each release said.
 */
const ROOT = join(__dirname, '..');
const DIRS = ['app', 'components', 'content', 'lib'];
const SKIP_DIRS = new Set(['node_modules', '.next', '.source', 'changelog']);
const FILE = /\.(?:ts|tsx|md|mdx)$/;

function surfaces(): string[] {
  const found: string[] = [];
  const walk = (rel: string) => {
    for (const entry of readdirSync(join(ROOT, rel), { withFileTypes: true })) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const child = `${rel}/${entry.name}`;
      if (entry.isDirectory()) walk(child);
      else if (FILE.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) found.push(child);
    }
  };
  for (const dir of DIRS) walk(dir);
  return found;
}

const CANCELED_DISPATCH = /`payment_intent\.canceled`\s*(?:→|->)/;

describe('the payment_intent.canceled webhook is described as the engine runs it', () => {
  const files = surfaces();

  it('walks the docs, including the checkout page', () => {
    expect(files).toContain('content/docs/features/checkout-stripe.mdx');
    expect(files.some((f) => f.startsWith('app/changelog/'))).toBe(false);
  });

  it('finds the dispatch line on the checkout page, so the rule below is not vacuous', () => {
    const page = readFileSync(join(ROOT, 'content/docs/features/checkout-stripe.mdx'), 'utf8');
    expect(page.split('\n').some((line) => CANCELED_DISPATCH.test(line))).toBe(true);
  });

  it('names the pending_payment condition on every dispatch line for the event', () => {
    const offenders: string[] = [];
    for (const rel of files) {
      for (const line of readFileSync(join(ROOT, rel), 'utf8').split('\n')) {
        if (CANCELED_DISPATCH.test(line) && !line.includes('pending_payment')) {
          offenders.push(`${rel}: "${line.trim().slice(0, 80)}…"`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
