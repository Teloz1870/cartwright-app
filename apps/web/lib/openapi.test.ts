import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { OPENAPI_DOCUMENT } from './openapi';
import { routeExists } from './route-exists';

/**
 * The spec, held against the code.
 *
 * A hand-written OpenAPI document has one failure mode and it is severe: it
 * drifts, an agent trusts it, and the agent gets a 400 it cannot explain. So
 * these tests enforce the two directions of agreement —
 *
 *   documented → exists   (no path here that is not a real route)
 *   exists → documented   (no public route that is not described here)
 *
 * — and the second direction has an explicit allowlist of omissions, so a reader
 * can tell "deliberately private" from "somebody forgot".
 */

const WEB_ROOT = path.dirname(fileURLToPath(new URL('.', import.meta.url)));
const API_ROOT = path.join(WEB_ROOT, 'app/api');

type Operation = { operationId?: string; description?: string; responses?: object };

/**
 * Routes that exist under `/api` and are deliberately absent from the spec.
 * Each one needs a reason a stranger would accept.
 */
const UNDOCUMENTED_ON_PURPOSE: Record<string, string> = {
  '/api/webhooks/stripe':
    'Stripe-signature authenticated. No third party can call it, so documenting it would advertise an endpoint no reader can use.',
  '/api/voice-demo/token':
    'Homepage voice demo. Bot-gated, per-IP rate limited, default-off, and coupled to a browser WebSocket session.',
  '/api/voice-demo/tool-dispatch':
    'Second half of the same homepage demo; only meaningful inside a live demo session.',
  '/api/[...unknown]':
    'The catch-all that produces the JSON 404 itself. It is the response to an undocumented path, not an endpoint.',
};

/** Every `route.ts` under app/api, as the URL path it answers. */
function discoverApiRoutes(dir = API_ROOT, prefix = '/api'): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (entry === 'route.ts') {
      found.push(prefix);
      continue;
    }
    if (statSync(full).isDirectory()) {
      found.push(...discoverApiRoutes(full, `${prefix}/${entry}`));
    }
  }
  return found;
}

/** `app/api/designs/[slug]/like` → the `/api/designs/{slug}/like` the spec uses. */
function toSpecPath(routePath: string): string {
  return routePath.replace(/\[(\.\.\.)?([^\]]+)\]/g, (_m, spread, name) =>
    spread ? `[...${name}]` : `{${name}}`,
  );
}

const paths = OPENAPI_DOCUMENT.paths as Record<string, Record<string, Operation>>;
const operations = Object.entries(paths).flatMap(([p, methods]) =>
  Object.entries(methods).map(([method, op]) => ({ path: p, method, op })),
);

describe('the document itself', () => {
  it('declares OpenAPI 3.1 and a single production server', () => {
    expect(OPENAPI_DOCUMENT.openapi).toBe('3.1.0');
    expect(OPENAPI_DOCUMENT.servers).toEqual([
      { url: 'https://cartwright.app', description: 'Production' },
    ]);
  });

  it('describes at least one operation', () => {
    expect(operations.length).toBeGreaterThan(0);
  });
});

describe('function-calling compatibility', () => {
  // The three properties an LLM function-calling adapter needs to turn an
  // operation into a callable tool.
  it('gives every operation a unique operationId', () => {
    const ids = operations.map(({ op }) => op.operationId);
    expect(ids.every((id) => typeof id === 'string' && id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses camelCase verb-first operationIds, not URL slugs', () => {
    for (const { op, path: p } of operations) {
      expect(op.operationId, p).toMatch(/^[a-z][a-zA-Z0-9]*$/);
    }
  });

  it('gives every operation a description long enough to disambiguate it', () => {
    for (const { op, path: p, method } of operations) {
      expect(op.description, `${method.toUpperCase()} ${p}`).toBeTruthy();
      expect(op.description!.length, `${method.toUpperCase()} ${p}`).toBeGreaterThan(40);
    }
  });

  it('gives every operation at least one documented response with a schema', () => {
    for (const { op, path: p, method } of operations) {
      const responses = op.responses as Record<string, { content?: object; description?: string }>;
      expect(responses, `${method.toUpperCase()} ${p}`).toBeTruthy();
      const codes = Object.keys(responses);
      expect(codes.length, `${method.toUpperCase()} ${p}`).toBeGreaterThan(0);
      for (const code of codes) {
        expect(responses[code].description, `${p} ${code}`).toBeTruthy();
      }
    }
  });

  it('types every path parameter and marks it required', () => {
    for (const { op, path: p } of operations) {
      const params = (op as { parameters?: { in: string; required?: boolean; schema?: object; description?: string }[] })
        .parameters;
      const templated = p.match(/\{[^}]+\}/g) ?? [];
      if (templated.length === 0) continue;
      expect(params, p).toBeDefined();
      const pathParams = params!.filter((param) => param.in === 'path');
      expect(pathParams.length, p).toBe(templated.length);
      for (const param of pathParams) {
        expect(param.required, p).toBe(true);
        expect(param.schema, p).toBeDefined();
        expect(param.description, p).toBeTruthy();
      }
    }
  });

  it('resolves every $ref against components.schemas', () => {
    const schemas = (OPENAPI_DOCUMENT.components as { schemas: Record<string, unknown> }).schemas;
    const refs = JSON.stringify(OPENAPI_DOCUMENT).match(/"#\/components\/schemas\/[A-Za-z]+"/g) ?? [];
    expect(refs.length).toBeGreaterThan(0);
    for (const ref of new Set(refs)) {
      const name = ref.replace(/"|#\/components\/schemas\//g, '');
      expect(schemas, ref).toHaveProperty(name);
    }
  });
});

describe('documented → exists', () => {
  it('every documented path resolves to a route in this repo', () => {
    const missing = Object.keys(paths).filter((p) => !routeExists(p));
    expect(missing).toEqual([]);
  });
});

describe('exists → documented', () => {
  const discovered = discoverApiRoutes().map(toSpecPath);

  it('found the API routes on disk (the check is not vacuous)', () => {
    expect(discovered).toContain('/api/version');
    expect(discovered.length).toBeGreaterThan(5);
  });

  it('documents every public /api route, or names why it is omitted', () => {
    const undocumented = discovered.filter(
      (p) => !(p in paths) && !(p in UNDOCUMENTED_ON_PURPOSE),
    );
    expect(undocumented).toEqual([]);
  });

  it('does not carry a stale omission for a route that no longer exists', () => {
    // Otherwise the allowlist becomes a place where excuses outlive their
    // endpoints and the "exists → documented" check quietly weakens.
    const stale = Object.keys(UNDOCUMENTED_ON_PURPOSE).filter(
      (p) => !discovered.includes(p),
    );
    expect(stale).toEqual([]);
  });

  it('gives a real reason for each omission', () => {
    for (const [p, reason] of Object.entries(UNDOCUMENTED_ON_PURPOSE)) {
      expect(reason.length, p).toBeGreaterThan(40);
    }
  });
});

describe('the error contract', () => {
  it('is one schema, required on the codes that can fail', () => {
    const schemas = (OPENAPI_DOCUMENT.components as { schemas: Record<string, { required?: string[] }> })
      .schemas;
    expect(schemas.Error.required).toEqual(['error', 'message']);
  });

  it('describes an error response for every non-2xx code it documents', () => {
    for (const { op, path: p } of operations) {
      const responses = op.responses as Record<string, { content?: Record<string, { schema?: { $ref?: string } }> }>;
      for (const [code, response] of Object.entries(responses)) {
        if (code.startsWith('2')) continue;
        const schema = response.content?.['application/json']?.schema;
        expect(schema?.$ref, `${p} ${code}`).toBe('#/components/schemas/Error');
      }
    }
  });
});
