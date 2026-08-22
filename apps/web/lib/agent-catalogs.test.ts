import { describe, expect, it } from 'vitest';
import { AI_CATALOG, API_CATALOG, API_CATALOG_CONTENT_TYPE } from './agent-catalogs';
import { SITE_URL } from './agent-resources';
import { routeExists } from './route-exists';
import { GET as AI_GET } from '../app/.well-known/ai-catalog.json/route';
import { GET as API_GET } from '../app/.well-known/api-catalog/route';

/**
 * The catalogues, held against what this origin actually serves.
 *
 * A catalogue is a promise about other URLs, which makes it the one kind of file
 * that can be confidently, silently wrong. The rule these tests enforce is the
 * rule stated in the module: an entry may only name a resource this repo really
 * has — and neither catalogue may advertise an MCP server, because cartwright.app
 * does not host one.
 */

const urlsIn = (o: unknown): string[] => {
  const found: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === 'string' && v.startsWith(SITE_URL)) found.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(o);
  return found;
};

describe('every catalogued URL resolves', () => {
  it('ARD catalog points only at routes this repo serves', () => {
    const urls = urlsIn(AI_CATALOG);
    expect(urls.length).toBeGreaterThan(0);
    const broken = urls.filter((u) => !routeExists(u.slice(SITE_URL.length)));
    expect(broken).toEqual([]);
  });

  it('API catalog points only at routes this repo serves', () => {
    // The anchor identifies the API rather than naming a page, so it is exempt.
    const urls = urlsIn(API_CATALOG).filter((u) => u !== `${SITE_URL}/api`);
    expect(urls.length).toBeGreaterThan(0);
    const broken = urls.filter((u) => !routeExists(u.slice(SITE_URL.length)));
    expect(broken).toEqual([]);
  });

  it('catches a URL that does not resolve (the check is not vacuous)', () => {
    // Deliberately a path nothing plans to add. This assertion used to use
    // `/.well-known/mcp.json`, which stopped being a counter-example the moment
    // the MCP server shipped — a vacuity guard has to name something that will
    // stay absent.
    expect(routeExists('/.well-known/there-is-no-such-document.json')).toBe(false);
    expect(routeExists('/openapi.json')).toBe(true);
  });
});

describe('the MCP entry is claimed only because the server exists', () => {
  // This block used to assert the OPPOSITE — that neither catalogue mentioned
  // `/api/mcp` — and it was correct for exactly as long as this origin hosted
  // no server. The rule never changed: advertise nothing that does not answer.
  // What changed is the fact underneath it, so the assertion follows the route.
  it('names the MCP server, and the route backing it is in this repo', () => {
    expect(JSON.stringify(AI_CATALOG)).toContain('/api/mcp');
    expect(routeExists('/api/mcp')).toBe(true);
    expect(routeExists('/.well-known/mcp.json')).toBe(true);
  });

  it('describes it as read-only, so no caller expects to write through it', () => {
    const entry = AI_CATALOG.entries.find((e) => e.url.endsWith('/api/mcp'));
    expect(entry).toBeDefined();
    expect(entry!.description).toMatch(/read-only/i);
    expect(entry!.type).toBe('application/mcp-server+json');
  });
});

describe('ARD catalog shape (spec version 1.0)', () => {
  it('carries specVersion, host and entries', () => {
    expect(AI_CATALOG.specVersion).toBe('1.0');
    expect(AI_CATALOG.host.identifier).toBe('cartwright.app');
    expect(AI_CATALOG.host.displayName.length).toBeGreaterThan(0);
    expect(AI_CATALOG.entries.length).toBeGreaterThan(0);
  });

  it('gives every entry the five required fields', () => {
    for (const e of AI_CATALOG.entries) {
      // ARD §4.2.1: `urn:air:<publisher>:<namespace>:<name>`, publisher an FQDN.
      expect(e.identifier, e.displayName).toMatch(
        /^urn:air:cartwright\.app:[a-z0-9-]+:[a-z0-9-]+$/,
      );
      expect(e.displayName.length).toBeGreaterThan(0);
      expect(e.type, e.displayName).toMatch(/^[a-z]+\/[a-z0-9.+-]+$/);
      expect(e.url.startsWith(SITE_URL), e.displayName).toBe(true);
      // A description that does not disambiguate is not worth the fetch.
      expect(e.description.length, e.displayName).toBeGreaterThan(40);
    }
  });

  it('uses unique identifiers', () => {
    const ids = AI_CATALOG.entries.map((e) => e.identifier);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('API catalog shape (RFC 9727 / RFC 9264)', () => {
  it('is a linkset with an anchored service-desc', () => {
    expect(Array.isArray(API_CATALOG.linkset)).toBe(true);
    const [item] = API_CATALOG.linkset;
    expect(item.anchor).toBe(`${SITE_URL}/api`);
    expect(item['service-desc'][0].href).toBe(`${SITE_URL}/openapi.json`);
  });

  it('declares the RFC 9727 profile in its media type', () => {
    // A bare `application/linkset+json` is a weaker, different claim: it says
    // "this is a linkset", not "this is an API catalog".
    expect(API_CATALOG_CONTENT_TYPE).toContain('application/linkset+json');
    expect(API_CATALOG_CONTENT_TYPE).toContain(
      'profile="https://www.rfc-editor.org/info/rfc9727"',
    );
  });
});

describe('the trust manifest claims only what we can back', () => {
  const manifests = [
    AI_CATALOG.host.trustManifest,
    ...AI_CATALOG.entries.map((e) => e.trustManifest),
  ];

  it('is present on the host and on every entry', () => {
    expect(manifests.length).toBeGreaterThan(1);
    for (const m of manifests) expect(m).toBeDefined();
  });

  it('binds identity to the same domain as the urn:air namespace', () => {
    // ARD §5.1: the identity's trust domain MUST align with the domain in the
    // discovery identifier. An HTTPS FQDN URI is one of the three forms the
    // spec names, and it is the one a site with TLS can honestly assert.
    for (const m of manifests) {
      expect(m.identity).toBe('https://cartwright.app');
      expect(m.identityType).toBe('https');
    }
    for (const e of AI_CATALOG.entries) {
      expect(e.identifier.startsWith('urn:air:cartwright.app:')).toBe(true);
    }
  });

  it('states provenance that anyone can go and verify', () => {
    for (const m of manifests) {
      const [p] = m.provenance;
      expect(p.relation).toBe('publishedFrom');
      expect(p.sourceId).toBe('https://github.com/Teloz1870/cartwright-app');
    }
  });

  it('asserts NO attestation and NO signature', () => {
    // The load-bearing negative. We hold no SOC2 or HIPAA audit and publish no
    // detached JWS; either would be a forgery with a schema around it, and the
    // whole value of the object is that a client can rely on it.
    const blob = JSON.stringify(AI_CATALOG);
    expect(blob).not.toContain('attestations');
    expect(blob).not.toContain('signature');
    expect(blob).not.toContain('SOC2');
  });
});

describe('the served responses', () => {
  it('/.well-known/ai-catalog.json is JSON and parses back to the catalogue', async () => {
    const res = AI_GET();
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(await res.json()).toEqual(AI_CATALOG);
  });

  it('/.well-known/api-catalog carries the profiled media type', async () => {
    const res = API_GET();
    expect(res.headers.get('content-type')).toBe(API_CATALOG_CONTENT_TYPE);
    expect(await res.json()).toEqual(API_CATALOG);
  });

  it('both are cacheable — they change only when the code does', () => {
    for (const res of [AI_GET(), API_GET()]) {
      expect(res.headers.get('cache-control')).toContain('s-maxage=');
    }
  });
});
