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
    expect(routeExists('/.well-known/mcp.json')).toBe(false);
    expect(routeExists('/openapi.json')).toBe(true);
  });
});

describe('neither catalogue advertises what we do not host', () => {
  it('says nothing about an MCP server on this origin', () => {
    // Every scaffolded SHOP serves /api/mcp on its own domain. This site does
    // not, and a catalogue entry claiming otherwise would send agents at a 404.
    const blob = JSON.stringify([AI_CATALOG, API_CATALOG]);
    expect(blob).not.toContain('/api/mcp');
    expect(blob).not.toContain('mcp-server+json');
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
      expect(e.identifier, e.displayName).toMatch(/^urn:ai:cartwright\.app:/);
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
