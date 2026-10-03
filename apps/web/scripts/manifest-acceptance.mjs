// The rule sync-manifest.mjs applies before an upstream manifest may overwrite
// lib/marketplace-manifest.json — beside the script, not in it, so a test can
// import it (the script fetches and exits at import time). It mirrors what
// lib/marketplace.ts refuses at build time: syncing a manifest the loader
// rejects would turn a manual `pnpm sync:manifest` into a broken build.

export const EXPECTED_SCHEMA = 'cartwright-marketplace-manifest-v3';
const ENGINE_FACT_KEYS = ['toolCount', 'scopeCount', 'adminToolCount', 'confirmGatedCount'];

/**
 * Why the upstream manifest must NOT replace the vendored copy — or null when it may.
 * @param {unknown} manifest
 * @returns {string | null}
 */
export function manifestRejection(manifest) {
  const m = /** @type {Record<string, any> | null | undefined} */ (manifest);
  if (m?.$schema !== EXPECTED_SCHEMA) {
    return (
      `upstream $schema is ${JSON.stringify(m?.$schema)}, expected "${EXPECTED_SCHEMA}" ` +
      '(an engine schema bump needs a matching lib/marketplace.ts update)'
    );
  }
  const facts = m.engineFacts;
  if (!facts || typeof facts !== 'object') {
    return (
      `upstream "engineFacts" is missing (engine v${m.version}) — lib/marketplace.ts refuses a manifest without it. ` +
      `The field ships with engine v0.59.0+; the mirror's main still serves v${m.version} — wait for the next engine tag`
    );
  }
  for (const key of ENGINE_FACT_KEYS) {
    const value = facts[key];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      return `upstream engineFacts.${key} is ${JSON.stringify(value)}, expected a finite number >= 0`;
    }
  }
  return null;
}

/** @param {unknown} manifest */
export const isAcceptableManifest = (manifest) => manifestRejection(manifest) === null;
