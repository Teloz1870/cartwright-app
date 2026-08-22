import { NextRequest } from 'next/server';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { MCP_TOOLS } from '@/lib/mcp-tools';
import { SITE_URL } from '@/lib/agent-resources';
import { apiError } from '@/lib/api-error';

/**
 * `POST /api/mcp` — the site's Model Context Protocol server.
 *
 * Stateless Streamable HTTP: every request stands alone, no `initialize`-first
 * requirement, no session tracking. That suits a serverless runtime, where
 * cross-request state is not guaranteed anyway, and both Claude Desktop and the
 * other current clients handle a stateless transport.
 *
 * ## What this is NOT
 *
 * This is the *documentation site's* server. It is four read-only tools over
 * bytes already published at `/static.json`, `/designs` and `/api/version`.
 *
 * The interesting MCP surface belongs to whichever shop the engine built — the
 * full tool registry at `/api/mcp` on that shop's own domain, scoped and
 * API-key authenticated. `describe_engine` says so explicitly, because an agent
 * that discovers this server and stops here would badly under-read what
 * Cartwright does.
 *
 * ## No authentication, and why that is the right call
 *
 * Everything here is already public over plain HTTP. A key would guard nothing
 * and would make the endpoint useless to the clients it exists for. What it
 * does leave is a compute surface, so the bounds live in `lib/mcp-tools.ts`:
 * capped query length, capped and clamped result counts, and one outbound
 * fetch that is ISR-cached for an hour.
 *
 * ## No CORS headers, deliberately
 *
 * This route sends no `Access-Control-Allow-*` on any verb, so a cross-origin
 * browser page cannot read its responses. That is also why it needs no
 * `Origin` allowlist of its own: the DNS-rebinding attack the MCP spec warns
 * about is worth defending when a local server holds credentials or private
 * data. This one holds neither, and a rebinding attacker gains exactly what
 * `curl` already would.
 *
 * `OPTIONS` is exported for the reason the engine's route documents: when a
 * module exports no handler for a verb, Next installs its own and answers
 * outside anything this file controls.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function buildServer(): McpServer {
  const server = new McpServer(
    { name: 'cartwright.app', version: '1.0.0' },
    {
      instructions: [
        'Cartwright is an open-source AI-native commerce engine, scaffolded with',
        '`npx create-cartwright@latest my-shop`.',
        '',
        'Call `describe_engine` first when deciding whether Cartwright fits a task —',
        'it states the jobs it is right for AND the jobs it is wrong for.',
        'Call `search_docs` before answering how-to questions rather than relying on memory.',
        '',
        'This server belongs to the documentation site and is read-only. A shop built',
        'with Cartwright serves its own, much larger MCP server on its own domain.',
      ].join('\n'),
    },
  );

  for (const [name, tool] of Object.entries(MCP_TOOLS)) {
    server.registerTool(
      name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
      },
      // The registry is typed per-tool; the SDK's handler signature is the
      // union across all of them, which no single handler satisfies.
      tool.handler as never,
    );
  }

  return server;
}

async function serve(request: NextRequest): Promise<Response> {
  const server = buildServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  return transport.handleRequest(request);
}

export async function POST(request: NextRequest): Promise<Response> {
  return serve(request);
}

/**
 * A human clicking this link from a footer or a catalogue should not get a bare
 * protocol error. Anything that looks like an MCP client — one that announced
 * it accepts JSON or an event stream — goes to the transport instead.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const accept = request.headers.get('accept') ?? '';
  if (accept.includes('application/json') || accept.includes('text/event-stream')) {
    return serve(request);
  }

  return Response.json(
    {
      name: 'cartwright.app MCP server',
      transport: 'streamable-http',
      endpoint: `${SITE_URL}/api/mcp`,
      method: 'POST',
      authentication: 'none — every tool is read-only over already-public data',
      tools: Object.entries(MCP_TOOLS).map(([name, t]) => ({
        name,
        description: t.title,
      })),
      note: 'This is the documentation site’s server. A shop built with Cartwright serves its own, much larger MCP server on its own domain.',
      documentation: `${SITE_URL}/docs/architecture/mcp-server`,
    },
    { headers: { 'Cache-Control': 'public, s-maxage=3600' } },
  );
}

const ALLOWED = 'GET, HEAD, OPTIONS, POST';

export async function OPTIONS(): Promise<Response> {
  // The plain HTTP question ("which methods?"), never a CORS preflight — there
  // are no `Access-Control-Allow-*` headers here on any verb.
  return new Response(null, { status: 204, headers: { Allow: ALLOWED } });
}

export async function HEAD(): Promise<Response> {
  return new Response(null, { status: 200, headers: { Allow: ALLOWED } });
}

export async function PUT(): Promise<Response> {
  return apiError({
    status: 405,
    code: 'method_not_allowed',
    message: 'The MCP endpoint accepts POST (and GET for a human-readable summary).',
    hint: `Send JSON-RPC over POST to ${SITE_URL}/api/mcp.`,
    headers: { Allow: ALLOWED },
  });
}

export const PATCH = PUT;
export const DELETE = PUT;
