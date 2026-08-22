import { SITE_URL } from './agent-resources';

/**
 * The two machine-readable catalogues that describe this origin to an agent.
 *
 * Both are indexes, not new capability. Everything they point at already
 * shipped — `/openapi.json`, `/llms.txt`, `/llms-full.txt`, the docs — and an
 * agent simply had no standard place to look for it. That constraint is what
 * keeps these honest, and it is the rule for editing them: **an entry may only
 * name a resource this origin actually serves.** A catalogue that advertises an
 * endpoint which 404s is worse than no catalogue, because a caller wastes a
 * request AND stops trusting the rest of the file.
 *
 * Concretely, that is why neither one lists an MCP server. cartwright.app does
 * not host one; every scaffolded *shop* does, at `/api/mcp` on its own domain.
 * `lib/agent-catalogs.test.ts` asserts that every URL in both documents is a
 * route in this repo, and that neither mentions `/api/mcp`.
 */

/** Agentic Resource Discovery — agenticresourcediscovery.org, spec version 1.0. */
export const AI_CATALOG = {
  specVersion: '1.0',
  host: {
    displayName: 'Cartwright',
    identifier: 'cartwright.app',
  },
  entries: [
    {
      identifier: 'urn:ai:cartwright.app:doc:llms-index',
      displayName: 'Cartwright agent index',
      type: 'text/plain',
      url: `${SITE_URL}/llms.txt`,
      description:
        'Start here: what Cartwright is, an explicit "when to use this" section naming the jobs it fits and the jobs it does not, and an index of every documentation page.',
    },
    {
      identifier: 'urn:ai:cartwright.app:api:public',
      displayName: 'Cartwright public HTTP API',
      type: 'application/vnd.oai.openapi+json',
      url: `${SITE_URL}/openapi.json`,
      description:
        'OpenAPI 3.1 description of the public endpoints served by cartwright.app: published CLI version, Plus access-key verification, design-gallery counts and the contact surfaces. No authentication required.',
    },
    {
      identifier: 'urn:ai:cartwright.app:doc:corpus',
      displayName: 'Cartwright documentation corpus',
      type: 'text/plain',
      url: `${SITE_URL}/llms-full.txt`,
      description:
        'Every documentation page concatenated as one plain-text document, for ingestion in a single fetch instead of a crawl.',
    },
  ],
} as const;

/**
 * RFC 9727 API catalog, expressed as an RFC 9264 linkset.
 *
 * `anchor` is the API's identifier rather than a fetchable page — RFC 9727
 * anchors the API itself, and the link relations hang off it. `service-desc` is
 * the machine description (our OpenAPI document); `service-doc` is the
 * human-readable documentation.
 */
export const API_CATALOG = {
  linkset: [
    {
      anchor: `${SITE_URL}/api`,
      'service-desc': [
        {
          href: `${SITE_URL}/openapi.json`,
          type: 'application/json',
          title: 'OpenAPI 3.1 description',
        },
      ],
      'service-doc': [
        {
          href: `${SITE_URL}/docs/api/api-keys`,
          type: 'text/html',
          title: 'API keys and the tool surface',
        },
      ],
    },
  ],
} as const;

/**
 * The media type RFC 9727 specifies for the catalog. Stated in full, profile
 * included — a bare `application/linkset+json` is a different, weaker claim.
 */
export const API_CATALOG_CONTENT_TYPE =
  'application/linkset+json;profile="https://www.rfc-editor.org/info/rfc9727"';
