import manifest from '@/lib/marketplace-manifest.json';

/**
 * The single source for every engine-derived number the site states.
 *
 * The site used to hard-code these in prose, and they drifted: "86 tools across
 * 35 domains" in two components while the registry holds 87; "28 design packs,
 * 8 industry voices, 9 in-repo plugins" on a comparison page while the vendored
 * manifest said 26/5/5; "All 15 integrations" beside a page that renders 23;
 * "Cartwright is at v0.33.0 today" in the roadmap while the CLI shipped v0.44.1.
 * On a product whose whole position is trust, a claim that drifts from its own
 * repo is the most expensive kind of wrong.
 *
 * Marketplace counts are derived, so they cannot drift at all. The rest are
 * declared here and asserted against their sources by `e2e/design-system.spec.ts`
 * — update them in this file only, and never restate a number in copy that is
 * not read from here. In MDX, use `<EngineFact k="toolCount" />`.
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
  /**
   * Minutes a confirmation token stays valid. Authority: the engine's
   * `lib/confirmation-tokens.ts` (`TTL_MS = 5 * 60 * 1000`).
   *
   * Here because the homepage's gate panel renders it, and the mockup it was
   * built from said 15 — the exact class of drift this file exists to stop.
   */
  confirmTokenTtlMinutes: 5,

  /**
   * Services /integrations actually renders — 6 featured + 17 secondary.
   * Pinned by a test that counts the page, because these live in the page
   * component rather than in a shared list.
   */
  integrationsShipped: 23,
  /** Announced for Plus, not shipped. Kept separate on purpose. */
  integrationsPlanned: 10,

  designs: manifest.designs.length,
  voices: manifest.voices.length,
  scenes: manifest.scenes.length,
  looks: manifest.looks.length,
  elements: manifest.elements.length,
  /** Present in the manifest but not consumed by the galleries. */
  plugins: (manifest as { plugins?: unknown[] }).plugins?.length ?? 0,
} as const;

/**
 * Cite a fact from MDX: `<EngineFact k="toolCount" />`.
 * Registered globally in `components/mdx.tsx`, so docs never have to hardcode.
 */
export function EngineFact({ k }: { k: keyof typeof ENGINE_FACTS }) {
  return <>{ENGINE_FACTS[k]}</>;
}
