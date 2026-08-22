import { API_CATALOG, API_CATALOG_CONTENT_TYPE } from '@/lib/agent-catalogs';

/**
 * `GET /.well-known/api-catalog` — RFC 9727 API catalogue.
 *
 * The standard place to ask "does this origin have an API, and where is its
 * description?". Answers with an RFC 9264 linkset pointing at the OpenAPI
 * document and the human documentation.
 */

export const revalidate = false;

export function GET(): Response {
  return new Response(JSON.stringify(API_CATALOG, null, 2), {
    headers: {
      'Content-Type': API_CATALOG_CONTENT_TYPE,
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
