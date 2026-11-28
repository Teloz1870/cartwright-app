import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The Phone.inc pages describe the scaffold the engine ships, not the one it
 * was meant to become.
 *
 * Until 2026-11-28 the docs page said the webhook was "signature-verified" with
 * an HMAC over `phoneIncWebhookSecret`, idempotent on `event_id`, and wrote
 * `PhoneCall` / `PhoneVoicemail` rows matched to customers via libphonenumber;
 * that the IVR editor saved to `PhoneIvrConfig`; that `/admin/telefon` had
 * three tabs and `/api/phone/*` returned 503 when off. On engine v0.68.0
 * (13cccb35) none of that exists:
 *   - prisma/schema.prisma has no Phone* model; IntegrationSettings has only
 *     phoneIncWorkspaceId + phoneIncApiKey (:1043-1044)
 *   - plugins/phone-widget/admin/TelefonDashboard.tsx: two tabs, sample rows
 *   - plugins/phone-widget/api/admin.ts: the IVR save logs and stores nothing
 *   - plugins/phone-widget/api/token.ts: `phone_inc_mock_…`, no session check
 *   - plugins/phone-widget/api/webhook.ts + lib/verify-webhook.ts: stores
 *     nothing; optional shared secret from env PHONE_INC_WEBHOOK_SECRET
 *
 * When the engine ships Phone.inc's signed webhooks (DRØM26-b), rewrite the
 * "/api/phone/webhook → Authentication" section and relax SIGNATURE_CLAIMS in
 * the same PR. The changelog is history and keeps what each release said.
 */
const WEB = join(__dirname, '..');
const read = (rel: string) => readFileSync(join(WEB, rel), 'utf8');

const PAGE = 'content/docs/features/phone-inc-telephony.mdx';
const INTEGRATIONS = 'app/(home)/integrations/page.tsx';

/** The Phone.inc fields IntegrationSettings has on engine v0.68.0. */
const ENGINE_PHONE_FIELDS = ['phoneIncWorkspaceId', 'phoneIncApiKey'];

/** Models the engine does not have: naming one anywhere is an invented feature. */
const INVENTED_MODELS = /\bPhone(?:Call|Voicemail|IvrConfig)\b/g;

/** What the old page promised and the engine does not do. */
const OVERCLAIMS: [string, RegExp][] = [
  ['idempotency key', /\bevent_id\b|\bevent_ts\b/],
  ['customer matching', /libphonenumber|Customer\.phone|\/admin\/customers\//],
  ['three admin tabs', /three tabs/i],
  ['a 503 when off', /\b503\b/],
  ['"✓ wired" rows', /✓ wired/],
  ['voicemail transcription', /voicemail transcription|transcribed voicemails/i],
];

/** The webhook compares a shared secret; it verifies no signature yet. */
const SIGNATURE_CLAIMS = /signature-verified|\bHMAC\b|phoneIncWebhookSecret/i;

function phoneCard(src: string): string {
  const m = /\{\s*brand: 'phone-inc',[\s\S]*?\n\s*\},/.exec(src);
  if (!m) throw new Error(`${INTEGRATIONS} no longer has a 'phone-inc' card`);
  return m[0];
}

function surfaces(): string[] {
  const found: string[] = [];
  const skip = new Set(['node_modules', '.next', '.source', 'changelog']);
  const walk = (rel: string) => {
    for (const entry of readdirSync(join(WEB, rel), { withFileTypes: true })) {
      if (skip.has(entry.name)) continue;
      const child = `${rel}/${entry.name}`;
      if (entry.isDirectory()) walk(child);
      else if (/\.(?:ts|tsx|md|mdx)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
        found.push(child);
      }
    }
  };
  for (const dir of ['app', 'components', 'content', 'lib']) walk(dir);
  return found;
}

describe('Phone.inc claims match the engine scaffold', () => {
  const page = read(PAGE);
  const card = phoneCard(read(INTEGRATIONS));

  it('names no Phone.inc model the engine does not have, on any page', () => {
    const files = surfaces();
    expect(files).toContain(PAGE);
    const offenders: string[] = [];
    for (const rel of files) {
      for (const m of read(rel).matchAll(INVENTED_MODELS)) offenders.push(`${rel}: ${m[0]}`);
    }
    expect(offenders).toEqual([]);
  });

  it('names only the IntegrationSettings fields the engine has', () => {
    const named = new Set([...page.matchAll(/\bphoneInc[A-Z]\w*/g)].map((m) => m[0]));
    expect([...named].filter((f) => !ENGINE_PHONE_FIELDS.includes(f))).toEqual([]);
    for (const field of ENGINE_PHONE_FIELDS) expect(page).toContain(field);
  });

  it.each(OVERCLAIMS)('does not promise %s', (_what, claim) => {
    expect(page).not.toMatch(claim);
    expect(card).not.toMatch(claim);
  });

  it('describes the webhook guard as the shared secret it is', () => {
    expect(page).not.toMatch(SIGNATURE_CLAIMS);
    expect(page).toContain('PHONE_INC_WEBHOOK_SECRET');
    expect(page).toContain('x-phone-inc-signature');
  });

  it('says the flag is off by default and that the backend is a scaffold', () => {
    expect(page).toMatch(/`phoneWidget` flag \(runtime, \*\*off by default\*\*\)/);
    expect(page).toMatch(/stores nothing/);
    expect(card).toMatch(/scaffold/);
  });
});
