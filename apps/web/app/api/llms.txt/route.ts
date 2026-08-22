import { SITE_URL } from '@/lib/agent-resources';
import { OPENAPI_DOCUMENT } from '@/lib/openapi';

export const revalidate = false;

/**
 * `GET /api/llms.txt` — the API surface, scoped.
 *
 * Generated from the same `OPENAPI_DOCUMENT` the spec is served from, so an
 * endpoint cannot appear in one and not the other. An agent that only wants to
 * know what it can CALL fetches this instead of the root index or the whole
 * OpenAPI document.
 *
 * Reachable because `app/api/[...unknown]/route.ts` is a catch-all: Next
 * resolves this static segment first, so the JSON 404 never sees it.
 */
function body(): string {
  const paths = OPENAPI_DOCUMENT.paths as Record<
    string,
    Record<string, { operationId?: string; summary?: string; description?: string }>
  >;

  const lines: string[] = [];
  for (const [path, methods] of Object.entries(paths)) {
    for (const [method, op] of Object.entries(methods)) {
      lines.push(
        `- \`${method.toUpperCase()} ${path}\` — **${op.operationId}**: ${op.summary ?? ''}`,
      );
    }
  }

  return `# Cartwright — API surface

> The public HTTP endpoints served by cartwright.app. No authentication is
> required for any of them, and there is no write API for content.

Full machine-readable description, with typed parameters and response schemas:
${SITE_URL}/openapi.json

## Endpoints

${lines.join('\n')}

## Errors

Every error uses one envelope: a stable \`error\` code, a \`message\`, an
actionable \`hint\` where there is one, and a \`documentation\` URL. An unknown
path under \`/api\` answers \`404\` as JSON, never as an HTML page.

## Note on scope

This is the API of the cartwright.app *website*. A shop built with Cartwright
serves a much larger surface on its own domain — the
full tool registry at \`POST /api/v1/tools/<name>\` plus an MCP server at
\`/api/mcp\`, both scoped and API-key authenticated. Those belong to that
deployment, not to this one: ${SITE_URL}/docs/api/mcp-tools
`;
}

export function GET(): Response {
  return new Response(body(), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      Link: `<${SITE_URL}/openapi.json>; rel="service-desc", <${SITE_URL}/llms.txt>; rel="index"`,
    },
  });
}
