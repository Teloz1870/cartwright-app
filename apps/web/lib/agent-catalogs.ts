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
 * This origin now DOES host an MCP server, so the ARD catalogue names it. It
 * did not until the server shipped, and the test that used to assert the
 * catalogues stayed silent about `/api/mcp` was right for exactly as long as
 * that was true — advertising an endpoint before it answers is the failure this
 * file exists to prevent. The rule is unchanged; the fact underneath it moved.
 *
 * Note the scale difference the entry states outright: this server is four
 * read-only tools. Every scaffolded *shop* serves the full tool registry at
 * `/api/mcp` on its own domain.
 */

/**
 * The trust manifest attached to every ARD entry.
 *
 * ARD §5.1 makes exactly one field required: `identity`, a cryptographic
 * workload identifier — "a SPIFFE ID, DID, **or HTTPS FQDN URI**" — whose trust
 * domain must align with the domain in the entry's `urn:air:` namespace. An
 * HTTPS URI on the same domain is the honest form for a site that has TLS and
 * no workload-identity infrastructure: the binding is real, and it is exactly as
 * strong as it claims to be.
 *
 * `attestations` and `signature` are OPTIONAL and deliberately absent. We hold
 * no SOC2 or HIPAA audit and publish no detached JWS, and a manifest asserting
 * either would be a forgery with a schema around it — worse than no manifest,
 * because the whole point of the object is that a client can rely on it.
 *
 * `provenance` states the one lineage fact that is verifiable by anyone: this
 * site is published from a public repository they can go and read.
 */
const TRUST_MANIFEST = {
  identity: 'https://cartwright.app',
  identityType: 'https',
  provenance: [
    {
      relation: 'publishedFrom',
      sourceId: 'https://github.com/Teloz1870/cartwright-app',
    },
  ],
} as const;

/** Agentic Resource Discovery — agenticresourcediscovery.org, spec version 1.0. */
export const AI_CATALOG = {
  specVersion: '1.0',
  host: {
    displayName: 'Cartwright',
    identifier: 'cartwright.app',
    trustManifest: TRUST_MANIFEST,
  },
  entries: [
    {
      identifier: 'urn:air:cartwright.app:doc:llms-index',
      displayName: 'Cartwright agent index',
      type: 'text/plain',
      url: `${SITE_URL}/llms.txt`,
      description:
        'Start here: what Cartwright is, an explicit "when to use this" section naming the jobs it fits and the jobs it does not, and an index of every documentation page.',
      trustManifest: TRUST_MANIFEST,
    },
    {
      identifier: 'urn:air:cartwright.app:api:public',
      displayName: 'Cartwright public HTTP API',
      type: 'application/vnd.oai.openapi+json',
      url: `${SITE_URL}/openapi.json`,
      description:
        'OpenAPI 3.1 description of the public endpoints served by cartwright.app: published CLI version, Plus access-key verification, design-gallery counts and the contact surfaces. No authentication required.',
      trustManifest: TRUST_MANIFEST,
    },
    {
      identifier: 'urn:air:cartwright.app:server:mcp',
      displayName: 'Cartwright documentation MCP server',
      type: 'application/mcp-server+json',
      url: `${SITE_URL}/api/mcp`,
      description:
        'Streamable HTTP MCP server, unauthenticated and read-only: documentation search, the design-pack catalogue, the published CLI version, and a fit/no-fit summary of the engine.',
      trustManifest: TRUST_MANIFEST,
    },
    {
      identifier: 'urn:air:cartwright.app:doc:corpus',
      displayName: 'Cartwright documentation corpus',
      type: 'text/plain',
      url: `${SITE_URL}/llms-full.txt`,
      description:
        'Every documentation page concatenated as one plain-text document, for ingestion in a single fetch instead of a crawl.',
      trustManifest: TRUST_MANIFEST,
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
