import manifest from '@/lib/marketplace-manifest.json';

/**
 * The single source for every engine-derived number the site states.
 *
 * The site used to hard-code these in prose — "86 tools across 35 domains" in
 * two separate components, "28 design packs, 8 industry voices, 9 in-repo
 * plugins" on a comparison page while the vendored manifest said 26/5/5, and
 * "All 15 integrations" beside a page that renders 23. On a product whose
 * entire position is trust, a claim that drifts from its own repo is the most
 * expensive kind of wrong.
 *
 * Marketplace counts are derived, so they cannot drift at all. The engine
 * counts below are declared, because cartwright-app has no live view of the
 * engine's tool registry — the live catalogue at `GET /api/v1/tools` on any
 * shop remains the authority. Update them in this file only, and never restate
 * a number in copy that is not read from here.
 */
export const ENGINE_FACTS = {
  /** Registered MCP tools. Authority: the engine's `lib/tools/*` registry. */
  toolCount: 87,
  /** Scopes an API key can carry. Authority: the engine's `lib/scopes.ts`. */
  scopeCount: 21,
  /** Tools the admin assistant may reach. Authority: `ADMIN_TOOL_ALLOWLIST`. */
  adminToolCount: 37,
  /** Of those, the ones that stop and require a server-issued confirmation. */
  confirmGatedCount: 25,

  designs: manifest.designs.length,
  voices: manifest.voices.length,
  scenes: manifest.scenes.length,
  looks: manifest.looks.length,
  elements: manifest.elements.length,
} as const;
