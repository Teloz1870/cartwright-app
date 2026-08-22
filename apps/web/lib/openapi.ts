import { SITE_URL } from './agent-resources';

/**
 * The OpenAPI 3.1 description of cartwright.app's public HTTP surface.
 *
 * Authored by hand rather than generated, for one reason: this site's routes are
 * plain Next.js route handlers with no schema layer to derive from, so anything
 * "generated" would really be inferred, and an inferred spec that quietly drifts
 * from the handler is worse than no spec — an agent trusts it and gets a 400 it
 * cannot explain. `lib/openapi.test.ts` keeps it honest by asserting that every
 * path documented here has a matching route file on disk, and that every route
 * file that is publicly callable is documented here. Adding an endpoint without
 * describing it fails the suite.
 *
 * ## What is deliberately NOT in here
 *
 * - `/api/webhooks/stripe` — Stripe-signature authenticated, not callable by a
 *   third party. Documenting it would advertise an endpoint no reader can use.
 * - `/api/voice-demo/*` — the homepage voice demo. Bot-gated, per-IP rate
 *   limited, default-off (`VOICE_DEMO_ENABLED`), and coupled to a browser
 *   WebSocket session. It is site furniture, not an API.
 *
 * Both omissions are asserted in the test, so a future reader does not have to
 * guess whether they were forgotten.
 */

type OpenApiDocument = Record<string, unknown>;

const ERROR_SCHEMA = {
  type: 'object',
  required: ['error', 'message'],
  properties: {
    error: {
      type: 'string',
      description:
        'Stable machine-readable code. Branch on this; it does not change wording between releases.',
      examples: ['unknown_endpoint', 'invalid_email'],
    },
    message: {
      type: 'string',
      description: 'One sentence describing what went wrong.',
    },
    hint: {
      type: 'string',
      description: 'What to change before retrying, when there is something to change.',
    },
    documentation: {
      type: 'string',
      format: 'uri',
      description: 'Where this contract is written down.',
    },
  },
} as const;

function errorResponse(description: string) {
  return {
    description,
    content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
  };
}

export const OPENAPI_DOCUMENT: OpenApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Cartwright — cartwright.app HTTP API',
    version: '1.0.0',
    summary: 'The public endpoints and machine-readable documents served by cartwright.app.',
    description: [
      'cartwright.app is the documentation and distribution site for Cartwright, an',
      'open-source (MIT) Next.js commerce engine scaffolded with `npx create-cartwright`.',
      '',
      'Two different things are described here, and it matters which one you want:',
      '',
      '- **This site’s API** (`/api/*`) — a small surface: the currently published CLI',
      '  version, Plus access-key verification, and the design-gallery like counts.',
      '  No authentication is required for any of it. There is no write API for content.',
      '- **Discovery documents** — `/llms.txt`, `/openapi.json`, `/sitemap.xml` and the',
      '  Markdown representations. Fetch `/llms.txt` first if you are deciding whether',
      '  Cartwright fits a task; it carries an explicit "when to use this" section.',
      '',
      '**A shop built with Cartwright has a much larger API than this site does.** Each',
      'scaffolded shop serves its own tool surface at `POST /api/v1/tools/<name>` plus an',
      'MCP server at `/api/mcp`, both scoped and API-key authenticated, on the shop’s own',
      'domain. Those endpoints belong to that deployment, not to cartwright.app, so they',
      'are documented at ' + SITE_URL + '/docs rather than described here.',
      '',
      'Every error response on this origin uses one envelope: a stable `error` code, a',
      '`message`, an optional actionable `hint`, and a `documentation` URL.',
    ].join('\n'),
    license: { name: 'MIT', identifier: 'MIT' },
    contact: {
      name: 'Cartwright',
      url: `${SITE_URL}/contact`,
      email: 'hello@cartwright.app',
    },
  },
  servers: [{ url: SITE_URL, description: 'Production' }],
  tags: [
    { name: 'Discovery', description: 'Machine-readable documents describing this site.' },
    { name: 'MCP', description: 'The Model Context Protocol server this site hosts.' },
    { name: 'Releases', description: 'What version of the CLI is currently published.' },
    { name: 'Plus', description: 'Verification for Cartwright Plus access keys.' },
    { name: 'Designs', description: 'Public design-gallery popularity counts.' },
    { name: 'Contact', description: 'Reach a human. Rate-limited, email-backed.' },
    { name: 'Telemetry', description: 'Anonymous, opt-out scaffold ping sent by the CLI.' },
  ],
  paths: {
    '/llms.txt': {
      get: {
        operationId: 'getLlmsTxt',
        tags: ['Discovery'],
        summary: 'Agent index for this site',
        description:
          'Plain-text index: what Cartwright is, an explicit "when to use this" section naming the jobs it fits and the jobs it does not, and a link to every documentation page. Start here.',
        responses: {
          '200': {
            description: 'The index.',
            content: { 'text/plain': { schema: { type: 'string' } } },
          },
        },
      },
    },
    '/llms-full.txt': {
      get: {
        operationId: 'getLlmsFullTxt',
        tags: ['Discovery'],
        summary: 'Entire documentation corpus in one response',
        description:
          'Every documentation page concatenated as plain text, for ingestion in a single fetch instead of a crawl.',
        responses: {
          '200': {
            description: 'The corpus.',
            content: { 'text/plain': { schema: { type: 'string' } } },
          },
        },
      },
    },
    '/openapi.json': {
      get: {
        operationId: 'getOpenApiDocument',
        tags: ['Discovery'],
        summary: 'This document',
        description: 'The OpenAPI 3.1 description of this origin. Self-referential on purpose: an agent that finds one entry point can reach the rest.',
        responses: {
          '200': {
            description: 'The OpenAPI document.',
            content: { 'application/json': { schema: { type: 'object' } } },
          },
        },
      },
    },
    '/static.json': {
      get: {
        operationId: 'getSearchIndex',
        tags: ['Discovery'],
        summary: 'Pre-built documentation search index',
        description:
          'The Orama search index behind the docs search box, exported as JSON so you can query the documentation locally instead of crawling it.',
        responses: {
          '200': {
            description: 'The search index.',
            content: { 'application/json': { schema: { type: 'object' } } },
          },
        },
      },
    },
    '/api/mcp': {
      post: {
        operationId: 'callMcpServer',
        tags: ['MCP'],
        summary: 'Model Context Protocol endpoint (Streamable HTTP)',
        description:
          'JSON-RPC over Streamable HTTP. Stateless — no `initialize` handshake is required and no session is tracked. Four read-only tools: `describe_engine`, `search_docs`, `list_designs`, `get_cli_version`. No authentication: every tool answers from data already published over plain HTTP. The manifest at /.well-known/mcp.json lists them. Note this is the documentation SITE\u2019s server; a shop built with Cartwright serves a much larger, authenticated one on its own domain.',
        requestBody: {
          required: true,
          description: 'A JSON-RPC 2.0 request, per the MCP specification.',
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: {
          '200': {
            description: 'A JSON-RPC response.',
            content: { 'application/json': { schema: { type: 'object' } } },
          },
        },
      },
      get: {
        operationId: 'describeMcpServer',
        tags: ['MCP'],
        summary: 'Human-readable summary of the MCP server',
        description:
          'Returns a plain JSON description of the endpoint and its tools, so a person following the link from a catalogue does not meet a bare protocol error. A client that announces `application/json` or `text/event-stream` is routed to the transport instead.',
        responses: {
          '200': {
            description: 'The summary.',
            content: { 'application/json': { schema: { type: 'object' } } },
          },
        },
      },
    },
    '/.well-known/mcp.json': {
      get: {
        operationId: 'getMcpManifest',
        tags: ['MCP'],
        summary: 'MCP server manifest',
        description:
          'Where a client looks to learn whether this origin speaks MCP, on what transport, and which tools it registers. Generated from the same registry the server itself loads, so it cannot advertise a tool that is not there.',
        responses: {
          '200': {
            description: 'The manifest.',
            content: { 'application/json': { schema: { type: 'object' } } },
          },
        },
      },
    },
    '/api/llms.txt': {
      get: {
        operationId: 'getApiSurfaceIndex',
        tags: ['Discovery'],
        summary: 'The API surface as plain text',
        description:
          'A scoped llms.txt listing every endpoint in this document with its operationId and summary, for an agent that wants to know what it can call without parsing the full OpenAPI document. Generated from this same description, so the two cannot disagree.',
        responses: {
          '200': {
            description: 'The scoped index.',
            content: { 'text/plain': { schema: { type: 'string' } } },
          },
        },
      },
    },
    '/api/version': {
      get: {
        operationId: 'getPublishedVersion',
        tags: ['Releases'],
        summary: 'Currently published create-cartwright version',
        description:
          'Reads the npm registry (cached for one hour) and returns the published dist-tags for `create-cartwright`. Use this instead of hardcoding a version when telling a user what `npx create-cartwright@latest` will install.',
        responses: {
          '200': {
            description: 'Published versions.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/VersionInfo' },
              },
            },
          },
          '502': errorResponse('The npm registry was unreachable or answered an error.'),
        },
      },
    },
    '/api/v1/license/verify': {
      post: {
        operationId: 'verifyPlusAccessKey',
        tags: ['Plus'],
        summary: 'Verify a Cartwright Plus access key',
        description:
          'Online check of the live membership behind an offline-valid Plus access key. The response carries no personal data — no customer id, no email, no subscription id. A `503` means verification is unavailable and the caller should apply its own offline grace window; it is NOT a revocation.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LicenseVerifyRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'The key is well-formed and signed by a known key.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LicenseStatus' },
              },
            },
          },
          '400': errorResponse('The body was not JSON, or `key` was missing or oversized.'),
          '401': errorResponse('The key is malformed or not signed by a known key.'),
          '503': errorResponse(
            'Verification is unavailable on this deployment (signing keys or Stripe not configured, or Stripe unreachable). Apply your offline grace policy; do not treat this as a revocation.',
          ),
        },
      },
    },
    '/api/designs/likes': {
      get: {
        operationId: 'listDesignLikes',
        tags: ['Designs'],
        summary: 'Like counts for every design in the gallery',
        description:
          'Anonymous popularity counts, keyed by design slug. `configured` is false when the deployment has no like store provisioned, in which case `likes` is an empty object rather than an error.',
        responses: {
          '200': {
            description: 'Counts, possibly empty.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DesignLikes' },
              },
            },
          },
        },
      },
    },
    '/api/designs/{slug}/like': {
      post: {
        operationId: 'likeDesign',
        tags: ['Designs'],
        summary: 'Add one anonymous like to a design',
        description:
          'Increments the like counter for one design and returns the new total. Deduplication is client-side only — likes are deliberately low-stakes and unauthenticated.',
        parameters: [
          {
            name: 'slug',
            in: 'path',
            required: true,
            description: 'Design slug, as listed by `listDesignLikes` or on /designs.',
            schema: { type: 'string', pattern: '^[a-z0-9-]+$' },
          },
        ],
        responses: {
          '200': {
            description: 'The new count.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DesignLikeCount' },
              },
            },
          },
          '404': errorResponse('No design with that slug.'),
          '503': errorResponse('No like store is provisioned on this deployment.'),
        },
      },
    },
    '/api/contact': {
      post: {
        operationId: 'sendContactMessage',
        tags: ['Contact'],
        summary: 'Send a message to the maintainers',
        description:
          'Delivers a contact-form message by email. There is no database behind it and no message is retrievable afterwards; the sender address becomes the reply-to. Intended for humans — an agent should prefer the documentation.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ContactRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'The message was delivered.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Ok' },
              },
            },
          },
          '400': errorResponse('A field failed validation. `error` names which one.'),
          '502': errorResponse('The email provider rejected the send.'),
          '503': errorResponse('Email is not configured on this deployment.'),
        },
      },
    },
    '/api/waitlist': {
      post: {
        operationId: 'joinWaitlist',
        tags: ['Contact'],
        summary: 'Join the waitlist for a paid tier',
        description:
          'Registers an email against one of the not-yet-released paid tiers. Same email-only, no-database design as the contact endpoint.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/WaitlistRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Registered.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Ok' } },
            },
          },
          '400': errorResponse('`email` was not an address, or `tier` was not a known tier.'),
          '502': errorResponse('The email provider rejected the send.'),
          '503': errorResponse('Email is not configured on this deployment.'),
        },
      },
    },
    '/api/telemetry/scaffold': {
      post: {
        operationId: 'reportScaffoldCompleted',
        tags: ['Telemetry'],
        summary: 'Anonymous scaffold ping (sent by the CLI, not by you)',
        description:
          'Receiver for the one anonymous ping `create-cartwright` sends after a successful scaffold. Documented so the data flow is inspectable rather than hidden: it carries only coarse install facts — CLI version, template ref, profile, template, Node major, platform, database choice — and no project name, path or identifier. Disable it with `--no-telemetry`, `CARTWRIGHT_TELEMETRY=0` or `DO_NOT_TRACK=1`. Always answers `204`, even to a malformed body, so a metrics endpoint never teaches a caller to retry.',
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ScaffoldPing' },
            },
          },
        },
        responses: {
          '204': { description: 'Accepted. No body, in every case.' },
        },
      },
    },
  },
  components: {
    schemas: {
      Error: ERROR_SCHEMA,
      Ok: {
        type: 'object',
        required: ['ok'],
        properties: { ok: { type: 'boolean', const: true } },
      },
      VersionInfo: {
        type: 'object',
        required: ['latest', 'beta', 'next', 'publishedAt', 'source'],
        properties: {
          latest: {
            type: ['string', 'null'],
            description: 'The `latest` dist-tag — what `npx create-cartwright` installs.',
            examples: ['2.7.4'],
          },
          beta: { type: ['string', 'null'], description: 'The `beta` dist-tag, if any.' },
          next: { type: ['string', 'null'], description: 'The `next` dist-tag, if any.' },
          publishedAt: {
            type: ['string', 'null'],
            format: 'date-time',
            description: 'When the `latest` version was published.',
          },
          source: { type: 'string', const: 'npm-registry' },
        },
      },
      LicenseVerifyRequest: {
        type: 'object',
        required: ['key'],
        properties: {
          key: {
            type: 'string',
            maxLength: 4096,
            description: 'A Plus access key, in the form `cw_plus_v1.<payload>.<signature>`.',
          },
        },
      },
      LicenseStatus: {
        type: 'object',
        required: ['status', 'plan'],
        properties: {
          status: {
            type: 'string',
            enum: ['active', 'grace', 'inactive'],
            description:
              '`active` — membership current. `grace` — lapsed but inside the grace window. `inactive` — no current membership.',
          },
          plan: { type: 'string', const: 'plus' },
        },
      },
      DesignLikes: {
        type: 'object',
        required: ['configured', 'likes'],
        properties: {
          configured: {
            type: 'boolean',
            description: 'False when this deployment has no like store; `likes` is then empty.',
          },
          likes: {
            type: 'object',
            description: 'Design slug → like count.',
            additionalProperties: { type: 'integer', minimum: 0 },
          },
        },
      },
      DesignLikeCount: {
        type: 'object',
        required: ['slug', 'count'],
        properties: {
          slug: { type: 'string' },
          count: { type: 'integer', minimum: 0 },
        },
      },
      ContactRequest: {
        type: 'object',
        required: ['name', 'email', 'message'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 120 },
          email: { type: 'string', format: 'email', maxLength: 254 },
          subject: {
            type: 'string',
            enum: ['setup-help', 'partnership', 'press', 'security', 'other'],
            default: 'other',
          },
          message: { type: 'string', minLength: 10, maxLength: 4000 },
        },
      },
      WaitlistRequest: {
        type: 'object',
        required: ['email', 'tier'],
        properties: {
          email: { type: 'string', format: 'email', maxLength: 254 },
          tier: { type: 'string', enum: ['plus', 'cloud'] },
        },
      },
      ScaffoldPing: {
        type: 'object',
        description: 'All fields optional; anything unrecognised is discarded.',
        properties: {
          cliVersion: { type: 'string', maxLength: 40 },
          ref: { type: 'string', maxLength: 40 },
          profile: { type: 'string', maxLength: 20 },
          template: { type: 'string', maxLength: 40 },
          node: { type: 'string', maxLength: 10 },
          platform: { type: 'string', maxLength: 20 },
          db: { type: 'string', maxLength: 20 },
        },
      },
    },
  },
  externalDocs: {
    description: 'Documentation, including the tool surface each scaffolded shop serves.',
    url: `${SITE_URL}/docs/introduction`,
  },
};
