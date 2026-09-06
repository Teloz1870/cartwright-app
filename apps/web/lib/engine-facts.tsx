import manifest from '@/lib/marketplace-manifest.json';
import { SITE_COLD_RUN } from '@/lib/home-copy';

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
   * WebMCP tools a v0.50 storefront can register in the browser page itself:
   * 3 global + 2 catalogue + 1 PDP + 3 cart + 3 declarative forms + 1 crema
   * pack tool. Authority: the engine's WebMCP binding constants (the same
   * ones its moat test aggregates).
   */
  webMcpToolCount: 13,
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

  /**
   * The `--profile site` scaffold, as the release scaffold gate measures it on
   * every engine release (`timings-site.json`, the published create-cartwright against
   * the current stable tag — both named in SITE_COLD_RUN.provenance). The dependency count is the CLI's curated prune list at
   * work; it drops further when the materializer adopts the registry-derived
   * prune set (engine B4). Zero env vars: the only `assertEnv` caller is the
   * database module, which the site profile removes.
   */
  siteRuntimeDeps: SITE_COLD_RUN.runtimeDependencies,
  siteDevDeps: SITE_COLD_RUN.devDependencies,
  siteEnvVarsToBoot: 0,
  /**
   * Design packs registered in a fresh site scaffold's `designs/index.ts`:
   * aurora-site, saas-dark, studio, corporate-baseline, stack, jungle,
   * agentic-showcase and blank. The nine Google-font packs moved to the
   * `google-fonts` module (engine PR #564, first shipped in v0.56.0) so a site
   * scaffold boots and builds with Google's CDN unreachable. Authority: the
   * engine's `scaffold/manifest.json` core claims, verified against a real
   * materialization of that commit (17 on create-cartwright@2.9.2; 8 from 2.9.3 → v0.56.1).
   */
  siteDesignPacks: 8,
  siteColdRunScaffold: SITE_COLD_RUN.scaffold,
  siteColdRunBuild: SITE_COLD_RUN.build,
  siteColdRunBoot: SITE_COLD_RUN.boot,
  siteColdRunProvenance: SITE_COLD_RUN.provenance,

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

/**
 * Resolve every `<EngineFact k="…" />` in a Markdown/MDX string to its value.
 *
 * The Markdown twin of a docs page (`/docs/<path>.md`, `Accept: text/markdown`,
 * and the `/llms-full.txt` concatenation) is the processed MDX text — React
 * never runs over it, so the component tags an HTML reader sees as numbers
 * reached an AI reader as literal `<EngineFact k="siteColdRunScaffold" />`
 * (measured live 2026-09-06: 23 raw tags across the corpus, 12 of them on the
 * plain-website runbook — the exact surface the site-profile program exists
 * for).
 *
 * Code is left alone: fenced blocks, indented blocks and inline spans keep
 * whatever they show, so a page that documents the tag keeps documenting it.
 * The processed text escapes SOME backticks as `&#x60;` — a real line reads
 * "repo with `llms.txt&#x60;, …" — so the entity has to count as a delimiter
 * when pairing spans; counting only literal backticks shifted parity by one
 * and left three tags unresolved on the built site.
 *
 * Outside code the tag is matched in every spelling MDX accepts — `k="x"`,
 * `k='x'`, `k={"x"}`, extra attributes, self-closing or `</EngineFact>` — and
 * anything else (a missing key, a key that is not a fact, a computed key)
 * throws: these bodies are produced at build time, so a fact that cannot be
 * cited must fail the build rather than ship as markup.
 */
export function renderEngineFacts(markdown: string): string {
  // A private-use code point that cannot occur in the source; it lets an
  // escaped backtick take part in span pairing without changing a byte of the
  // output (it is mapped back before returning).
  const TICK = "";
  const withTicks = markdown.split("&#x60;").join(TICK).split("&#96;").join(TICK);
  const CODE = [
    "```[\\s\\S]*?```", // fenced
    "~~~[\\s\\S]*?~~~",
    "(?:^|\\n)(?: {4}|\\t)[^\\n]*", // an indented code line
    "[`\\uE000][^`\\uE000\\n]*[`\\uE000]", // inline span, either delimiter
  ].join("|");
  const parts = withTicks.split(new RegExp(`(${CODE})`, "g"));
  return parts
    .map((part, i) => (i % 2 === 1 ? part ?? "" : replaceEngineFactTags(part ?? "")))
    .join("")
    .split(TICK)
    .join("&#x60;");
}

function replaceEngineFactTags(prose: string): string {
  const tag = /<EngineFact\b[\s\S]*?(?:\/>|<\/EngineFact>)/g;
  return prose.replace(tag, (match) => {
    const k = /\bk\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*(?:"([^"]*)"|'([^']*)')\s*\})/.exec(match);
    const key = k?.[1] ?? k?.[2] ?? k?.[3] ?? k?.[4];
    if (!key) throw new Error(`${match}: <EngineFact> needs a literal k="…" (a computed key cannot be resolved here)`);
    if (!Object.hasOwn(ENGINE_FACTS, key)) throw new Error(`${match}: no such fact in ENGINE_FACTS`);
    return String(ENGINE_FACTS[key as keyof typeof ENGINE_FACTS]);
  });
}
