import { Redis } from '@upstash/redis';
import { DESIGNS } from './designs-data';

/**
 * Phase 2 social layer — anonymous design "likes" / popularity, backed by a
 * serverless Redis (Upstash via the Vercel Marketplace). GRACEFUL by design:
 * if no store is provisioned (no env vars), everything degrades to "not
 * configured" + zero counts, so the site builds and runs unchanged. It lights
 * up the moment a store + env vars exist.
 *
 * Provision: add Upstash Redis on the Vercel project (Marketplace) → it sets
 * UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_URL/TOKEN).
 */

let _redis: Redis | null | undefined;

function redis(): Redis | null {
  if (_redis !== undefined) return _redis;
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL ?? '';
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN ?? '';
  _redis = url && token ? new Redis({ url, token }) : null;
  return _redis;
}

export function likesConfigured(): boolean {
  return redis() !== null;
}

const KEY = (slug: string) => `design:likes:${slug}`;
const VALID_SLUGS = new Set(DESIGNS.map((d) => d.slug));

/** All like counts keyed by slug (0 for any with no value). Empty if no store. */
export async function getAllLikes(): Promise<Record<string, number>> {
  const r = redis();
  const out: Record<string, number> = {};
  if (!r) return out;
  const slugs = DESIGNS.map((d) => d.slug);
  try {
    const vals = await r.mget<(number | string | null)[]>(...slugs.map(KEY));
    slugs.forEach((s, i) => {
      out[s] = Number(vals[i] ?? 0) || 0;
    });
  } catch {
    /* store hiccup → treat as zero, don't break the page */
  }
  return out;
}

/** Increment a design's like count. Returns the new count, or null if not
 *  configured / unknown slug. */
export async function likeDesign(slug: string): Promise<number | null> {
  const r = redis();
  if (!r || !VALID_SLUGS.has(slug)) return null;
  try {
    return await r.incr(KEY(slug));
  } catch {
    return null;
  }
}
