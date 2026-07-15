/**
 * POST /api/telemetry/scaffold
 *
 * Receiver for create-cartwright's anonymous, opt-out scaffold ping (sent once
 * at the end of a successful scaffold; disabled with --no-telemetry,
 * CARTWRIGHT_TELEMETRY=0 or DO_NOT_TRACK=1 — documented in the CLI README).
 *
 * Deliberately PII-free: the CLI sends only coarse install facts (cli version,
 * template ref, profile, template, node major, platform, db choice). No project
 * name, no paths, no user identifiers. Storage is Vercel Analytics' aggregate
 * custom events (same system the privacy page documents) — no database row is
 * written and the request body is not persisted anywhere else.
 *
 * Always answers 204, even on garbage — a metrics endpoint must never teach
 * callers to retry.
 */

import { track } from '@vercel/analytics/server';

export const runtime = 'nodejs';

const STR = (v: unknown, max = 40): string | null =>
  typeof v === 'string' && v.length > 0 && v.length <= max ? v : null;

export async function POST(request: Request): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const b = (body ?? {}) as Record<string, unknown>;

    const props: Record<string, string> = {};
    const cliVersion = STR(b.cliVersion);
    const ref = STR(b.ref);
    const profile = STR(b.profile, 20);
    const template = STR(b.template);
    const node = STR(b.node, 10);
    const platform = STR(b.platform, 20);
    const db = STR(b.db, 20);
    if (cliVersion) props.cliVersion = cliVersion;
    if (ref) props.ref = ref;
    if (profile) props.profile = profile;
    if (template) props.template = template;
    if (node) props.node = node;
    if (platform) props.platform = platform;
    if (db) props.db = db;

    await track('scaffold_completed', props);
  } catch {
    // fail-soft by design
  }
  return new Response(null, { status: 204 });
}
