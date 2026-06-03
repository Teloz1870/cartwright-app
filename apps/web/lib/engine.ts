/**
 * Engine version, synced from source.
 *
 * cartwright.app should never hardcode "the current engine version" — it drifts
 * the moment a new tag ships. Instead we read it straight from the engine's
 * CHANGELOG.md on the public template repo (the same file that ships with every
 * release). The top-most `## vX.Y.Z` header is the latest release.
 *
 * Fail-soft: if the fetch fails (network, rate-limit, repo move) we fall back to
 * a bundled constant so the prod build/render never breaks. Bump the fallback
 * when you cut a release — it's only a safety net, the live value wins.
 *
 * Companion to app/api/version/route.ts, which reads the *CLI* version from npm.
 * This reads the *engine/template* version from the CHANGELOG.
 */

const RAW_CHANGELOG =
  'https://raw.githubusercontent.com/Teloz1870/cartwright-template/main/CHANGELOG.md';

/** Safety net if the live fetch fails. Bump on each release. */
export const FALLBACK_ENGINE_VERSION = '0.14.0';

/**
 * Latest engine release version (e.g. "0.11.0"), read from the engine CHANGELOG.
 * ISR-cached for 1h. Never throws.
 */
export async function getEngineVersion(): Promise<string> {
  try {
    const res = await fetch(RAW_CHANGELOG, { next: { revalidate: 3600 } });
    if (!res.ok) return FALLBACK_ENGINE_VERSION;
    const md = await res.text();
    // Top-most "## vX.Y.Z — DATE" header is the latest release.
    const match = md.match(/^##\s+v(\d+\.\d+\.\d+)/m);
    return match?.[1] ?? FALLBACK_ENGINE_VERSION;
  } catch {
    return FALLBACK_ENGINE_VERSION;
  }
}
