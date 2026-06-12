/**
 * `--look <url>` — scaffold wearing a shared look (cartwright-composition-v1).
 *
 * The engine's public look-sharing endpoint (`GET /api/look`, behind the
 * `lookSharing` flag) serves a shop's cosmetic identity — skin (design slug),
 * palette, 3D scene and chrome parts — as a `cartwright-composition-v1`
 * artifact, and `/built-with-cartwright` advertises:
 *
 *   npx create-cartwright --look <site>/api/look
 *
 * This module makes that command real. After the project is scaffolded and the
 * database is seeded, the look is applied in two steps:
 *
 *   1. skin   → `designSlug: "<skin>"` in the scaffold's brand.config.ts
 *               (config beats DB in the engine's getActiveDesign resolution,
 *               so this is the trusted, committable way to pick the design).
 *               Skipped with a hint when the scaffold doesn't ship the design
 *               (e.g. pruned by the light profile).
 *   2. palette / scene / chrome → the seeded database's BrandingSettings row
 *               (themeJson / threeDConfigJson.scene / chromeJson), written
 *               with the scaffold's own @libsql/client via a temp script —
 *               the exact field formats the engine's applyComposition writes.
 *
 * FAIL-SOFT EVERYWHERE: an unreachable URL, non-JSON response, wrong schema
 * id, unknown skin or DB write failure prints one clear warning and the
 * scaffold continues unchanged. A broken look must never break a scaffold.
 *
 * SHARING BOUNDARY: the public look never carries voice (genome copy) or
 * homepageLayout — and this module ignores those fields if a full composition
 * export is passed, applying only the cosmetic subset.
 */
import { existsSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { patchBrandConfigDesignSlug } from "./scaffold.js";

export const LOOK_SCHEMA_ID = "cartwright-composition-v1" as const;

/** Fetch timeout — a slow look server must not hang the scaffold. */
export const LOOK_FETCH_TIMEOUT_MS = 10_000;

/** Cap on the response body — a look is a small JSON file, not a download. */
export const LOOK_MAX_BYTES = 1_000_000;

/** The 6-token brand palette — same shape as the engine's themeJson. */
export type LookPalette = {
  accent: string;
  accentDeep: string;
  cream: string;
  sand: string;
  ink: string;
  muted: string;
};

export const LOOK_PALETTE_KEYS: ReadonlyArray<keyof LookPalette> = [
  "accent",
  "accentDeep",
  "cream",
  "sand",
  "ink",
  "muted",
];

/**
 * The public subset of cartwright-composition-v1 this flag consumes (mirror
 * of the engine's toPublicLook projection). voice/homepageLayout never travel
 * over the public endpoint and are deliberately not modelled here.
 */
export type PublicLook = {
  schema: typeof LOOK_SCHEMA_ID;
  /** Display name for the success line; falls back to the skin slug. */
  name?: string;
  /** Design slug — the Skin. */
  skin: string;
  palette?: LookPalette;
  scene?: string;
  chrome?: { headerKey?: string; footerKey?: string };
};

export type ParseLookResult =
  | { ok: true; look: PublicLook }
  | { ok: false; error: string };

/** #rgb / #rrggbb — mirror of the engine spec's HEX_RE. */
const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** kebab-case registry keys (design slugs, scene ids, chrome keys). */
const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Minimal structural validation of a look JSON string — the CLI cannot check
 * registry membership (that knowledge lives in the engine), so it validates
 * shape only: `schema` must be the composition-v1 id, `skin` a design slug,
 * and the optional palette/scene/chrome parts must match the spec's shapes.
 * Invalid optional parts reject the WHOLE look (never half-apply a corrupt
 * artifact — same philosophy as the engine's applyComposition). Unknown extra
 * fields (voice, homepageLayout, description …) are ignored.
 */
export function parseLook(raw: string): ParseLookResult {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, error: "the response is not valid JSON." };
  }
  if (!isRecord(json)) {
    return { ok: false, error: "the look must be a JSON object." };
  }

  if (json.schema !== LOOK_SCHEMA_ID) {
    return {
      ok: false,
      error: `not a ${LOOK_SCHEMA_ID} artifact (schema: ${JSON.stringify(json.schema ?? null)}).`,
    };
  }

  const skin = json.skin;
  if (typeof skin !== "string" || skin.length === 0) {
    return { ok: false, error: `"skin" is missing — a look must name its design slug.` };
  }
  if (skin.length > 50 || !SLUG_RE.test(skin)) {
    return { ok: false, error: `"skin" is not a valid design slug: ${JSON.stringify(skin)}.` };
  }

  const look: PublicLook = { schema: LOOK_SCHEMA_ID, skin };

  if (typeof json.name === "string" && json.name.trim().length > 0) {
    look.name = json.name.trim().slice(0, 80);
  }

  if (json.palette !== undefined) {
    if (!isRecord(json.palette)) {
      return { ok: false, error: `"palette" must be an object with the 6 brand colors.` };
    }
    const palette = {} as LookPalette;
    for (const key of LOOK_PALETTE_KEYS) {
      const value = json.palette[key];
      if (typeof value !== "string" || !HEX_RE.test(value)) {
        return {
          ok: false,
          error: `"palette.${key}" must be a hex color (#rgb or #rrggbb).`,
        };
      }
      palette[key] = value;
    }
    look.palette = palette;
  }

  if (json.scene !== undefined) {
    if (typeof json.scene !== "string" || json.scene.length > 50 || !SLUG_RE.test(json.scene)) {
      return { ok: false, error: `"scene" must be a scene id (e.g. "aurora").` };
    }
    look.scene = json.scene;
  }

  if (json.chrome !== undefined) {
    if (!isRecord(json.chrome)) {
      return { ok: false, error: `"chrome" must be an object ({ headerKey?, footerKey? }).` };
    }
    const chrome: { headerKey?: string; footerKey?: string } = {};
    for (const key of ["headerKey", "footerKey"] as const) {
      const value = json.chrome[key];
      if (value === undefined) continue;
      if (typeof value !== "string" || value.length > 80 || !SLUG_RE.test(value)) {
        return { ok: false, error: `"chrome.${key}" must be a chrome registry key.` };
      }
      chrome[key] = value;
    }
    if (chrome.headerKey || chrome.footerKey) look.chrome = chrome;
  }

  return { ok: true, look };
}

export type FetchLookResult =
  | { ok: true; look: PublicLook }
  | { ok: false; error: string };

/**
 * Fetch + validate a look URL. Built-in `fetch` only (no new dependency),
 * 10 s timeout, 1 MB body cap. `fetchImpl` is injectable for unit tests.
 */
export async function fetchLook(
  url: string,
  fetchImpl: typeof fetch = fetch,
): Promise<FetchLookResult> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return { ok: false, error: `"${url}" is not a valid URL.` };
  }
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return { ok: false, error: `--look only supports http(s) URLs (got ${parsedUrl.protocol}//).` };
  }

  let body: string;
  try {
    const res = await fetchImpl(parsedUrl.toString(), {
      headers: { accept: "application/json" },
      redirect: "follow",
      signal: AbortSignal.timeout(LOOK_FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `the look URL answered HTTP ${res.status}${res.status === 404 ? " (is the lookSharing flag enabled on that shop?)" : ""}.`,
      };
    }
    body = await res.text();
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    if (name === "TimeoutError" || name === "AbortError") {
      return {
        ok: false,
        error: `the look URL did not answer within ${LOOK_FETCH_TIMEOUT_MS / 1000} s.`,
      };
    }
    return { ok: false, error: "the look URL could not be reached." };
  }

  if (body.length > LOOK_MAX_BYTES) {
    return { ok: false, error: "the response is too large to be a look file." };
  }

  const parsed = parseLook(body);
  if (!parsed.ok) return parsed;
  return { ok: true, look: parsed.look };
}

// ── Step 1: skin → brand.config.ts ──────────────────────────────────────────

export type StageSkinResult = {
  /** true when brand.config.ts now carries the look's designSlug. */
  applied: boolean;
  warnings: string[];
};

/**
 * Set the look's skin as the scaffold's designSlug — IF the scaffold ships
 * that design pack. `designs/<skin>/` on disk is the ground truth for both
 * profiles (the light profile prunes non-curated packs; future templates may
 * add or remove packs). A missing pack warns + skips the skin while the rest
 * of the look (palette/scene/chrome) still applies — fail-soft default per
 * the profile contract, with the re-install hint.
 */
export function stageLookSkin(targetDir: string, look: PublicLook): StageSkinResult {
  const warnings: string[] = [];

  if (!existsSync(join(targetDir, "designs", look.skin))) {
    warnings.push(
      `the look's design "${look.skin}" is not in this scaffold (the light profile keeps a curated set). ` +
        `Skipped setting designSlug — palette/scene/chrome still apply. ` +
        `Add it later with \`npx cartwright design install ${look.skin}\`, or re-scaffold with --profile full.`,
    );
    return { applied: false, warnings };
  }

  const configPath = join(targetDir, "brand.config.ts");
  if (!existsSync(configPath)) {
    warnings.push("brand.config.ts not found — designSlug not set.");
    return { applied: false, warnings };
  }
  const original = readFileSync(configPath, "utf8");
  const patch = patchBrandConfigDesignSlug(original, look.skin);
  warnings.push(...patch.warnings.map((w) => `brand.config.ts: ${w}`));
  if (patch.src !== original) writeFileSync(configPath, patch.src);
  return { applied: patch.warnings.length === 0, warnings };
}

// ── Step 2: palette / scene / chrome → seeded BrandingSettings row ──────────

/** True when the look carries DB-backed parts (anything beyond the skin). */
export function lookHasDbParts(look: PublicLook): boolean {
  return Boolean(look.palette || look.scene || look.chrome);
}

/**
 * The temp script that writes the look's DB parts using the SCAFFOLD's own
 * node_modules (`@libsql/client` is a direct engine dependency — the same
 * client the engine's db:setup fallback uses). Static source — the look JSON
 * and store name travel via env vars, all SQL is parameterized, so no data is
 * ever interpolated into code or SQL.
 *
 * Field formats mirror the engine's applyComposition exactly:
 *   - themeJson         = JSON.stringify(palette)            (6-color object)
 *   - chromeJson        = JSON.stringify({ headerKey?, footerKey? })
 *   - threeDConfigJson  = JSON.stringify({ ...existing, scene })  (scene merged
 *     over the current 3D config so intensity/paletteSource survive)
 *
 * Env resolution mirrors the scaffold's prisma.config.ts precedence:
 * .env.local (override) > process.env > .env; Turso when both TURSO_* vars are
 * set, else DATABASE_URL, else file:./dev.db. Postgres is skipped (libsql
 * client can't reach it) with a pointer to composition.apply.
 */
export const LOOK_DB_SCRIPT = `// Temp script written by create-cartwright --look; deleted after the run.
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@libsql/client";

const ERR = (msg) => {
  console.log("CARTWRIGHT_LOOK_DB_ERR " + msg);
  process.exit(1);
};

const look = JSON.parse(process.env.CARTWRIGHT_LOOK_JSON ?? "{}");

// Same aggressive cleaning as the engine's lib/db.ts cleanEnv.
const cleanEnv = (raw) => {
  if (!raw) return undefined;
  const stripped = String(raw).replace(/[^\\x20-\\x7E]/g, "").trim();
  const unquoted = stripped.replace(/^["']|["']$/g, "");
  return unquoted || undefined;
};
const parseEnvFile = (path) => {
  const out = {};
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, "utf8").split("\\n")) {
    const m = line.match(/^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*=\\s*(.*)\\s*$/);
    if (m && !line.trimStart().startsWith("#")) out[m[1]] = m[2];
  }
  return out;
};
// Precedence mirrors the scaffold's prisma.config.ts: .env, then .env.local
// with override (so .env.local also beats process.env, like dotenv override).
const envFile = parseEnvFile(".env");
const envLocal = parseEnvFile(".env.local");
const get = (k) => cleanEnv(envLocal[k] ?? process.env[k] ?? envFile[k]);

const databaseUrl = get("DATABASE_URL") ?? "file:./dev.db";
if (get("DATABASE_DRIVER") === "postgres" || /^postgres(ql)?:/i.test(databaseUrl)) {
  ERR("Postgres database — apply the look later via the composition.apply tool or /admin/designs.");
}
const tursoUrl = get("TURSO_DATABASE_URL");
const tursoToken = get("TURSO_AUTH_TOKEN");
const client = createClient(
  tursoUrl && tursoToken ? { url: tursoUrl, authToken: tursoToken } : { url: databaseUrl },
);

try {
  const sets = [];
  const args = [];
  if (look.palette) {
    sets.push("themeJson = ?");
    args.push(JSON.stringify(look.palette));
  }
  if (look.chrome && (look.chrome.headerKey || look.chrome.footerKey)) {
    sets.push("chromeJson = ?");
    args.push(JSON.stringify(look.chrome));
  }
  if (look.scene) {
    // Merge the scene over the existing 3D config (fail-soft parse) so
    // intensity/paletteSource survive — mirror of applyComposition.
    let existing = {};
    try {
      const row = await client.execute("SELECT threeDConfigJson FROM BrandingSettings WHERE id = 1");
      const raw = row.rows[0]?.threeDConfigJson;
      if (typeof raw === "string" && raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) existing = parsed;
      }
    } catch {
      /* fresh row or unreadable config — write { scene } alone */
    }
    sets.push("threeDConfigJson = ?");
    args.push(JSON.stringify({ ...existing, scene: look.scene }));
  }

  if (sets.length > 0) {
    const updated = await client.execute({
      sql: "UPDATE BrandingSettings SET " + sets.join(", ") + " WHERE id = 1",
      args,
    });
    if (Number(updated.rowsAffected) === 0) {
      // No row yet (seed skipped?) — create it with the engine's minimal
      // required fields, mirroring applyComposition's upsert-create.
      const cols = ["id", "storeName", "heroImage", "announcement"];
      const vals = [1, process.env.CARTWRIGHT_LOOK_STORE_NAME || "Cartwright", "", ""];
      for (let i = 0; i < sets.length; i++) {
        cols.push(sets[i].split(" ")[0]);
        vals.push(args[i]);
      }
      await client.execute({
        sql:
          "INSERT INTO BrandingSettings (" + cols.join(", ") + ") VALUES (" +
          cols.map(() => "?").join(", ") + ")",
        args: vals,
      });
    }
  }
  console.log("CARTWRIGHT_LOOK_DB_OK");
} catch (err) {
  ERR(err instanceof Error ? err.message : String(err));
} finally {
  client.close();
}
`;

export type ApplyLookDbResult = { ok: boolean; warning?: string };

/**
 * Write the look's palette/scene/chrome into the scaffold's seeded database.
 * Runs the temp script with `node` from the scaffold root (so its
 * node_modules + .env files resolve), passes the look via env, and always
 * deletes the script. Fail-soft: every failure path returns one warning.
 */
export function applyLookDbParts(
  targetDir: string,
  look: PublicLook,
  opts: { storeName?: string } = {},
): ApplyLookDbResult {
  if (!lookHasDbParts(look)) return { ok: true };

  if (!existsSync(join(targetDir, "node_modules", "@libsql", "client"))) {
    return {
      ok: false,
      warning:
        "@libsql/client not installed in the scaffold — palette/scene/chrome not applied. " +
        "Apply the look later via the composition.apply tool or /admin/designs.",
    };
  }

  const scriptName = ".cartwright-look-apply.mjs";
  const scriptPath = join(targetDir, scriptName);
  try {
    writeFileSync(scriptPath, LOOK_DB_SCRIPT);
    const stdout = execSync(`node ${scriptName}`, {
      cwd: targetDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 30_000,
      env: {
        ...process.env,
        CARTWRIGHT_LOOK_JSON: JSON.stringify(look),
        CARTWRIGHT_LOOK_STORE_NAME: opts.storeName ?? "",
      },
    });
    if (!stdout.includes("CARTWRIGHT_LOOK_DB_OK")) {
      return { ok: false, warning: extractDbError(stdout) };
    }
    return { ok: true };
  } catch (err) {
    const stdout =
      err && typeof err === "object" && "stdout" in err ? String(err.stdout ?? "") : "";
    return { ok: false, warning: extractDbError(stdout) };
  } finally {
    try {
      unlinkSync(scriptPath);
    } catch {
      /* already gone */
    }
  }
}

function extractDbError(stdout: string): string {
  const line = stdout.split("\n").find((l) => l.startsWith("CARTWRIGHT_LOOK_DB_ERR "));
  const detail = line ? line.slice("CARTWRIGHT_LOOK_DB_ERR ".length) : "";
  return (
    `couldn't write the look to the database${detail ? ` (${detail})` : ""}. ` +
    `The scaffold itself is fine — apply the look later via the composition.apply tool or /admin/designs.`
  );
}

/** What the apply run is summarized as — drives the success line + outro. */
export type LookSummary = {
  /** Display name for "Look applied: <name>". */
  name: string;
  /** At least one part of the look landed. */
  applied: boolean;
  warnings: string[];
};
