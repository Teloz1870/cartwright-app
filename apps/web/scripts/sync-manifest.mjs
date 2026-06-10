#!/usr/bin/env node
// Refresh the vendored engine marketplace manifest (lib/marketplace-manifest.json)
// from the public template mirror. Manual / CI-refresh only — NOT wired into the
// build, so a network hiccup can never break a deploy.
//
// Usage: pnpm sync:manifest
//
// Behaviour:
// - non-200 response  → keep the existing vendored copy, warn, exit 0.
// - wrong $schema     → keep the existing vendored copy, warn, exit 1
//                       (an engine schema bump needs a matching lib/marketplace.ts update).
// - success           → overwrite lib/marketplace-manifest.json (stable 2-space JSON).

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const MANIFEST_URL =
  'https://raw.githubusercontent.com/Teloz1870/cartwright-template/main/marketplace-manifest.json';
const EXPECTED_SCHEMA = 'cartwright-marketplace-manifest-v2';

const dest = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'lib',
  'marketplace-manifest.json',
);

console.log(`[sync:manifest] fetching ${MANIFEST_URL}`);

let res;
try {
  res = await fetch(MANIFEST_URL);
} catch (err) {
  console.warn(`[sync:manifest] fetch failed (${err?.message ?? err}) — keeping the existing vendored copy.`);
  process.exit(0);
}

if (!res.ok) {
  console.warn(
    `[sync:manifest] upstream responded ${res.status} ${res.statusText} — keeping the existing vendored copy.`,
  );
  process.exit(0);
}

const text = await res.text();

let manifest;
try {
  manifest = JSON.parse(text);
} catch {
  console.error('[sync:manifest] upstream payload is not valid JSON — keeping the existing vendored copy.');
  process.exit(1);
}

if (manifest?.$schema !== EXPECTED_SCHEMA) {
  console.error(
    `[sync:manifest] upstream $schema is ${JSON.stringify(manifest?.$schema)}, expected "${EXPECTED_SCHEMA}" — ` +
      'keeping the existing vendored copy. An engine schema bump needs a matching lib/marketplace.ts update.',
  );
  process.exit(1);
}

await writeFile(dest, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(
  `[sync:manifest] wrote ${path.relative(process.cwd(), dest)} ` +
    `(engine v${manifest.version}: ${manifest.designs?.length ?? 0} designs, ${manifest.voices?.length ?? 0} voices, ` +
    `${manifest.scenes?.length ?? 0} scenes, ${manifest.svgItems?.length ?? 0} svg items, ` +
    `${manifest.elements?.length ?? 0} elements, ${manifest.looks?.length ?? 0} looks)`,
);
