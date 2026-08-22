import { MCP_TOOLS } from '@/lib/mcp-tools';
import { SITE_URL } from '@/lib/agent-resources';

/**
 * `GET /.well-known/mcp.json` — where a client looks to find out whether this
 * origin speaks MCP, and on what terms.
 *
 * Generated from `MCP_TOOLS`, so the manifest cannot advertise a tool the
 * server does not register — the failure this whole branch has been avoiding,
 * one level up: a discovery document that promises something the endpoint does
 * not answer costs the caller a round trip AND its trust in the rest of the file.
 */

export const revalidate = false;

export function GET(): Response {
  return Response.json(
    {
      name: 'cartwright.app',
      description:
        "Documentation, design packs and release information for Cartwright, an open-source AI-native commerce engine. Read-only. A shop built with Cartwright serves its own, much larger MCP server on the shop's own domain.",
      version: '1.0.0',
      transport: {
        type: 'streamable-http',
        url: `${SITE_URL}/api/mcp`,
      },
      authentication: { type: 'none' },
      capabilities: { tools: {} },
      tools: Object.entries(MCP_TOOLS).map(([name, tool]) => ({
        name,
        title: tool.title,
        description: tool.description,
      })),
      documentation: `${SITE_URL}/docs/architecture/mcp-server`,
    },
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
      },
    },
  );
}
