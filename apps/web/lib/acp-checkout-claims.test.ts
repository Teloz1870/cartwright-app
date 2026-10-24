import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The ACP examples on this site are requests an agent copies, so they must be
 * requests the engine accepts.
 *
 * Until 2026-10-24 both ACP pages sent `line_items: [{ "product_id": … }]`.
 * The engine's line-item schema (lib/acp/index.ts `lineItemSchema`, the same
 * from v0.62.0 to origin/main 1f861db) knows only `id`, `item_id`, `slug`,
 * `sku` and `quantity`. It drops any other key, so every such line answered
 * `422 acp_line_item_identifier_required`. The bodies failed earlier still:
 * `createSessionInputSchema` is strict, so `shipping_address` and
 * `payment_method` were a `422 validation_error`, as was a quantity of 100
 * (the cap is 10 per line). The walkthrough's `/complete` sent
 * `payment_method_id` without the `shared_payment_token` that
 * lib/acp/complete.ts requires. The response examples showed fields
 * (`tax_minor`, `amount_subtotal_minor`, an `escrow` block) that
 * `serializeAcpSession` never returns, and the walkthrough sent a
 * `negotiated_unit_amount_minor` that exists nowhere in the engine.
 *
 * The constants below mirror the engine's schemas as measured. When the
 * engine's ACP input changes, change them in the same PR as the copy. The
 * rules walk every surface, so a new page with a curl example is checked
 * without anyone adding it here. Known limit: only `curl -X POST … -d '…'`
 * examples are parsed; a fetch() snippet would pass unseen.
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

/** lib/acp/index.ts — createSessionInputSchema (strict) and its nested schemas. */
const CREATE_KEYS = new Set(['line_items', 'buyer', 'fulfillment_address', 'fulfillment_option', 'discount_code']);
const IDENTIFIERS = ['id', 'item_id', 'slug', 'sku'] as const;
const LINE_ITEM_KEYS = new Set<string>([...IDENTIFIERS, 'quantity']);
const ADDRESS_KEYS = new Set(['name', 'address_line1', 'address', 'postal_code', 'zip', 'city', 'country']);
/** lib/acp/complete.ts — completeSessionInputSchema (not strict: it drops other keys). */
const COMPLETE_KEYS = new Set(['shared_payment_token', 'idempotency_key']);

/** Field names no ACP request or response in the engine has ever carried. */
const NEVER_IN_ENGINE = [
  'negotiated_unit_amount_minor',
  'amount_subtotal_minor',
  'subtotal_minor',
  'tax_minor',
  'shipping_minor',
  'total_minor',
  '"shipping_address"',
];

/**
 * Audit events no ACP route writes: `git grep 'acp.checkout'` and `'acp.feed'`
 * on engine origin/main 1f861db find nothing, and lib/acp, app/api/acp and
 * lib/orders/create-acp.ts write no audit row.
 */
const ACP_AUDIT_EVENT = /acp\.(?:checkout|feed)\.[a-z_]+/g;

const ACP_PAGES = ['content/docs/features/agentic-commerce-protocol.mdx', 'content/docs/guides/ai-sale-walkthrough.mdx'];

type Example = { rel: string; path: string; body: Record<string, unknown> };

/** Every `curl -X POST …/api/acp/v1/checkout_sessions[/…] … -d '<json>'` on a surface. */
function curlExamples(files: string[]): Example[] {
  const CURL = /curl -X POST \S*\/api\/acp\/v1\/checkout_sessions(\/\S*)?\s(?:(?!curl )[\s\S])*?-d '([^']*)'/g;
  const found: Example[] = [];
  for (const rel of files) {
    for (const m of readFileSync(join(ROOT, rel), 'utf8').matchAll(CURL)) {
      found.push({ rel, path: m[1] ?? '', body: JSON.parse(m[2]) as Record<string, unknown> });
    }
  }
  return found;
}

const extraKeys = (obj: object, allowed: Set<string>) => Object.keys(obj).filter((k) => !allowed.has(k));

describe('ACP checkout examples are requests the engine accepts', () => {
  const files = surfaces();
  const examples = curlExamples(files);
  const creates = examples.filter((e) => e.path === '');

  it('walks the docs, including both ACP pages', () => {
    for (const page of ACP_PAGES) expect(files).toContain(page);
    expect(files.some((f) => f.startsWith('app/changelog/'))).toBe(false);
  });

  it('finds a create and a complete example on both ACP pages, so the rules below are not vacuous', () => {
    for (const page of ACP_PAGES) {
      expect(creates.some((e) => e.rel === page)).toBe(true);
      expect(examples.some((e) => e.rel === page && e.path.endsWith('/complete'))).toBe(true);
    }
  });

  it('names every line item with id, item_id, slug or sku — never product_id, which the engine drops', () => {
    const offenders: string[] = [];
    for (const { rel, body } of creates) {
      const lines = body.line_items;
      if (!Array.isArray(lines) || lines.length < 1 || lines.length > 20) {
        offenders.push(`${rel}: line_items must be an array of 1 to 20 lines`);
        continue;
      }
      for (const line of lines as Record<string, unknown>[]) {
        const extra = extraKeys(line, LINE_ITEM_KEYS);
        if (extra.length) offenders.push(`${rel}: line item key(s) the engine drops: ${extra.join(', ')}`);
        if (!IDENTIFIERS.some((k) => typeof line[k] === 'string' && line[k] !== '')) {
          offenders.push(`${rel}: line item without id/item_id/slug/sku → 422 acp_line_item_identifier_required`);
        }
        const q = line.quantity;
        if (typeof q !== 'number' || !Number.isInteger(q) || q < 1 || q > 10) {
          offenders.push(`${rel}: quantity ${String(q)} is outside the engine's 1 to 10 per line`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('sends only the top-level and address keys the strict create schema takes', () => {
    const offenders: string[] = [];
    for (const { rel, body } of creates) {
      const extra = extraKeys(body, CREATE_KEYS);
      if (extra.length) offenders.push(`${rel}: unrecognized key(s) → 422 validation_error: ${extra.join(', ')}`);
      const address = body.fulfillment_address;
      if (address && typeof address === 'object') {
        const bad = extraKeys(address, ADDRESS_KEYS);
        if (bad.length) offenders.push(`${rel}: fulfillment_address key(s) the engine refuses: ${bad.join(', ')}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('completes with a shared_payment_token, the one field /complete requires, and no key it drops', () => {
    const offenders: string[] = [];
    for (const { rel, path, body } of examples.filter((e) => e.path.endsWith('/complete'))) {
      const extra = extraKeys(body, COMPLETE_KEYS);
      if (extra.length || typeof body.shared_payment_token !== 'string') {
        offenders.push(`${rel} ${path}: ${JSON.stringify(body)}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('names no ACP field the engine never had', () => {
    const offenders: string[] = [];
    for (const rel of files) {
      const src = readFileSync(join(ROOT, rel), 'utf8');
      for (const name of NEVER_IN_ENGINE) if (src.includes(name)) offenders.push(`${rel}: ${name}`);
    }
    expect(offenders).toEqual([]);
  });

  it('shows an ACP audit row only inside a step a warn callout says does not follow yet', () => {
    const offenders: string[] = [];
    for (const rel of files) {
      const src = readFileSync(join(ROOT, rel), 'utf8');
      const disclaimed = new Set<number>();
      for (const callout of src.matchAll(/<Callout type="warn">([\s\S]*?)<\/Callout>/g)) {
        if (!/audit row/.test(callout[1])) continue;
        for (const r of callout[1].matchAll(/Steps (\d+) to (\d+)/g)) {
          for (let n = Number(r[1]); n <= Number(r[2]); n++) disclaimed.add(n);
        }
      }
      for (const m of src.matchAll(ACP_AUDIT_EVENT)) {
        const steps = [...src.slice(0, m.index).matchAll(/^## Step (\d+)/gm)];
        const step = steps.length ? Number(steps[steps.length - 1][1]) : NaN;
        if (!disclaimed.has(step)) offenders.push(`${rel}: ${m[0]} (Step ${step}) reads as a row the engine writes`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('shows ACP session ids in the acs_ + 32 hex form acsId() mints', () => {
    const offenders: string[] = [];
    for (const rel of ACP_PAGES) {
      const src = readFileSync(join(ROOT, rel), 'utf8');
      for (const m of src.matchAll(/\b(a?cs)_([\w.…]*)/g)) {
        if (m[1] !== 'acs' || !/^[0-9a-f]{32}$/.test(m[2])) offenders.push(`${rel}: ${m[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('shows feed lines keyed by item_id, the id a line item sends back', () => {
    const offenders: string[] = [];
    let seen = 0;
    for (const rel of ACP_PAGES) {
      const src = readFileSync(join(ROOT, rel), 'utf8');
      for (const block of src.matchAll(/```jsonl\n([\s\S]*?)\n```/g)) {
        for (const line of block[1].split('\n')) {
          const item = JSON.parse(line) as Record<string, unknown>;
          seen += 1;
          if (typeof item.item_id !== 'string' || 'id' in item) offenders.push(`${rel}: ${line.slice(0, 60)}…`);
        }
      }
    }
    expect(seen).toBeGreaterThan(0);
    expect(offenders).toEqual([]);
  });
});

/**
 * The same two pages also claimed auth, caching, escrow and audit behaviour
 * the engine does not have (APP-ACP-DOCS-TRUTH, measured on engine origin/main
 * 1f861db):
 * - no route under app/api/acp calls authenticateApiKey or requireApiScope or
 *   reads an Authorization header, and lib/scopes.ts has no acp: scope;
 * - `requireFeedAuth` exists nowhere in the engine;
 * - app/api/acp/feed/route.ts reads no request header and sends the one
 *   cache-control value below;
 * - app/api/escrow holds only verify/route.ts; nothing creates or funds an
 *   EscrowTransaction (the Stripe webhook is app/api/webhook/stripe and never
 *   touches the table), and its verifier passes no proof: delivery, signature
 *   and webhook pend, and hash fails because the route passes no expected hash;
 * - on these paths only guardianCheck writes a row (AgenticJWT), so the Agent
 *   Card fetch writes none, and no route here checks an API key's scopes.
 */
const FEED_CACHE_CONTROL = 'public, max-age=900, s-maxage=900';

/** app/api/escrow/verify/route.ts — escrowVerifyRequestSchema and its 200 body. */
const VERIFY_KEYS = new Set(['agentId', 'jti', 'signedJwt', 'scopes', 'escrowTxId', 'proofType', 'proofPayload', 'submittedHash']);
const VERIFY_RESPONSE_KEYS = ['escrowStatus', 'proofId', 'verifierResult', 'verifierMessage'];

/** Phrases the engine contradicts, on any surface. */
const CONTRADICTED_ANYWHERE: [RegExp, string][] = [
  [/requireFeedAuth/, 'no such helper anywhere in the engine'],
  [/\bacp:[a-z_]+/, 'lib/scopes.ts has no acp: scope'],
  [/\/api\/escrow\/(?!verify\b)[\w{.…]/, 'app/api/escrow has only verify/route.ts'],
  [/\/api\/agent-onboard\b/, 'no such route'],
];

/** …and on the two ACP pages. */
const CONTRADICTED_ON_ACP_PAGES: [RegExp, string][] = [
  [/max-age=300|the route honours it|no stale snapshots/, `the feed sends ${FEED_CACHE_CONTROL} and reads no request header`],
  [/pending\s*(?:→|->)\s*funded/, 'no engine code funds an escrow row'],
  [/\/api\/stripe\/webhook/, 'the webhook is /api/webhook/stripe, and it never touches EscrowTransaction'],
  [/agent-card\.fetch/, 'app/api/agent-card writes no row'],
  [/scopes are checked before the handler/, "no route on these pages checks an API key's scopes"],
];

const blocks = (src: string, lang: string) => [...src.matchAll(new RegExp('```' + lang + '\\n([\\s\\S]*?)\\n```', 'g'))];

describe('the ACP pages claim only the auth, caching, escrow and audit the engine has', () => {
  const files = surfaces();
  const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

  it('names no helper, scope, route or behaviour the engine contradicts', () => {
    const offenders: string[] = [];
    for (const rel of files) {
      const rules = ACP_PAGES.includes(rel) ? [...CONTRADICTED_ANYWHERE, ...CONTRADICTED_ON_ACP_PAGES] : CONTRADICTED_ANYWHERE;
      for (const [re, why] of rules) {
        const m = read(rel).match(re);
        if (m) offenders.push(`${rel}: "${m[0]}" — ${why}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('sends no Authorization header to an ACP route, since none reads one', () => {
    const offenders: string[] = [];
    let seen = 0;
    for (const rel of files) {
      for (const [, code] of blocks(read(rel), 'bash')) {
        if (!code.includes('/api/acp/')) continue;
        seen += 1;
        if (/Authorization:/i.test(code)) offenders.push(`${rel}: ${code.split('\n')[0]}`);
      }
    }
    expect(seen).toBeGreaterThan(0);
    expect(offenders).toEqual([]);
  });

  it("states the feed's cache-control as the route sends it", () => {
    expect(read(ACP_PAGES[0])).toContain(`Cache-Control: ${FEED_CACHE_CONTROL}`);
  });

  it('submits escrow proofs the verify schema takes, a delivery proof with trackingNumber and carrier', () => {
    const offenders: string[] = [];
    let seen = 0;
    for (const rel of files) {
      for (const m of read(rel).matchAll(/curl -X POST \S*\/api\/escrow\/verify\s(?:(?!curl )[\s\S])*?-d '([^']*)'/g)) {
        const body = JSON.parse(m[1]) as Record<string, unknown>;
        if (rel === ACP_PAGES[1]) seen += 1;
        const extra = extraKeys(body, VERIFY_KEYS);
        if (extra.length) offenders.push(`${rel}: key(s) the verify schema drops: ${extra.join(', ')}`);
        const proof = (body.proofPayload ?? {}) as Record<string, unknown>;
        if (body.proofType === 'delivery' && !(['trackingNumber', 'carrier'] as const).every((k) => typeof proof[k] === 'string' && proof[k] !== '')) {
          offenders.push(`${rel}: delivery proof without trackingNumber and carrier → verifierResult "fail"`);
        }
      }
    }
    expect(seen).toBeGreaterThan(0);
    expect(offenders).toEqual([]);
  });

  it('answers a proof with the body the verify route returns, and releases nothing', () => {
    const src = read(ACP_PAGES[1]);
    const at = src.search(/curl -X POST \S*\/api\/escrow\/verify/);
    expect(at).toBeGreaterThan(-1);
    const response = blocks(src.slice(at), 'json')[0];
    expect(response).toBeDefined();
    const body = JSON.parse(response[1]) as Record<string, unknown>;
    expect(Object.keys(body)).toEqual(VERIFY_RESPONSE_KEYS);
    expect(body.escrowStatus).not.toBe('released');
  });
});

/**
 * The R1 falsifier on app#417 found two more claims the engine contradicts
 * (measured on engine origin/main af4561f6):
 * - Every route under app/api/acp/v1 gates on `brand.acp.enabled`
 *   (lib/acp/http.ts `acpDisabledResponse`) and on nothing else.
 *   `brand.features.acp` gates no route. Its readers are discovery surfaces:
 *   app/.well-known/ucp, app/feed/google.xml (`native_commerce`), app/llms.txt
 *   and lib/agent-skills/public-site.ts. The agent-marketplace scaffold flips
 *   only `features.acp` (apps/cli/src/scaffold.ts), so `acp.enabled` stays
 *   false there and its checkout routes answer 404.
 * - `guardianCheck` runs in exactly two routes: POST /api/negotiate and
 *   POST /api/escrow/verify. GET /api/agent-card is A2A-gated and calls only
 *   `a2aDisabledResponse` and `prisma.agentCard.findFirst`, so the policy's
 *   `agent-card.read` scope and its blocked-agent list never apply to it. No
 *   admin screen or tool writes `BrandingSettings.agenticPolicyJson`.
 */
const SWITCH_AND_GUARDIAN_CONTRADICTED: [RegExp, string][] = [
  [/\b(?:ACP|routes?) (?:is |are )?gated (?:behind|by|on) `(?:brand\.)?features\.acp`/, 'the ACP checkout routes read brand.acp.enabled, not features.acp'],
  [/the `acp` (?:switch|gate)/, 'two switches are called acp; name brand.acp.enabled, the one the routes read'],
  [/No A2A (?:call|request) skipped the Guardian/, 'GET /api/agent-card is A2A-gated and runs no Guardian'],
  [/outside the shop's agentic policy on an A2A call/, 'GET /api/agent-card ignores the agentic policy'],
  [/until the admin sets it/, 'no admin screen or tool writes agenticPolicyJson'],
];

const section = (src: string, heading: string) => {
  const start = src.indexOf(`\n## ${heading}\n`);
  if (start < 0) return '';
  const end = src.indexOf('\n## ', start + 1);
  return src.slice(start, end < 0 ? undefined : end);
};

describe('the ACP pages name the switch the checkout routes read and the routes the Guardian runs on', () => {
  const files = surfaces();
  const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

  it('names no switch or Guardian coverage the engine contradicts', () => {
    const offenders: string[] = [];
    for (const rel of files) {
      for (const [re, why] of SWITCH_AND_GUARDIAN_CONTRADICTED) {
        const m = read(rel).match(re);
        if (m) offenders.push(`${rel}: "${m[0]}" — ${why}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('says the checkout routes read brand.acp.enabled and that features.acp gates no route', () => {
    const gate = section(read(ACP_PAGES[0]), 'Feature gate');
    expect(gate).not.toBe('');
    expect(gate).toMatch(/`acp\.enabled`\*{0,2} is the one the checkout routes read/);
    expect(gate).toMatch(/`features\.acp`\*{0,2} gates no route/);
  });

  it('sets acp.enabled to true in every brand.config snippet that turns features.acp on', () => {
    const offenders: string[] = [];
    let seen = 0;
    for (const rel of files) {
      for (const [, code] of blocks(read(rel), 'ts')) {
        const features = code.match(/features:\s*\{[^}]*\}/);
        if (!features || !/\bacp:\s*true\b/.test(features[0])) continue;
        seen += 1;
        if (!/\bacp:\s*\{[^}]*\benabled:\s*true\b/.test(code)) offenders.push(`${rel}: ${code.split('\n')[0]}`);
      }
    }
    expect(seen).toBeGreaterThan(0);
    expect(offenders).toEqual([]);
  });

  it('claims Guardian coverage for negotiate and escrow/verify only, and names the Agent Card fetch as unguarded', () => {
    const didnt = section(read(ACP_PAGES[1]), "What didn't happen");
    expect(didnt).not.toBe('');
    expect(didnt).toMatch(/`\/api\/negotiate` and `\/api\/escrow\/verify` run it before they act, and they are the only routes that do/);
    expect(didnt).toMatch(/`GET \/api\/agent-card`\)? is A2A-gated but runs no Guardian/);
  });
});
