import { AI_CATALOG } from '@/lib/agent-catalogs';

/**
 * `GET /.well-known/ai-catalog.json` — Agentic Resource Discovery catalogue.
 *
 * An index of resources this origin already serves, at the well-known location
 * an AI client looks for them. It adds no capability; it removes the guessing.
 */

export const revalidate = false;

export function GET(): Response {
  return Response.json(AI_CATALOG, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
