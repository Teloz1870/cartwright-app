/**
 * `cartwright doctor` — read-only health check for an existing Cartwright
 * project.
 *
 * Diagnostic ONLY: no fixes, no mutations, no network. Seven checks:
 *
 *   1. project    — brand.config.ts + prisma/schema.prisma + package.json
 *                   exist (else it isn't a Cartwright project root).
 *   2. release    — parse .cartwright/release.json (the self-stamping engine
 *                   version marker; missing = pre-v0.22 scaffold or stripped).
 *   3. up-to-date — compare the marker's version to DEFAULT_REF (the latest
 *                   template tag THIS CLI build knows). Explicitly no network:
 *                   an older CLI simply knows an older latest.
 *   4. profile    — parse .cartwright/profile.json (absent = full profile or
 *                   a pre-profile scaffold, not a failure).
 *   5. node       — process major version ≥ 22 (package.json engines).
 *   6. env        — .env.local exists; AUTH_SECRET non-empty non-placeholder;
 *                   DATABASE_URL present OR both TURSO_DATABASE_URL +
 *                   TURSO_AUTH_TOKEN (shallow line parse — no dotenv dep).
 *   7. db         — `pnpm run --if-present db:verify` (exit 0 = baseline ok,
 *                   2 = migration-baseline drift). Skipped when pnpm or the
 *                   script is missing.
 *
 * Output: one colored line per check + a summary; `--json` prints a
 * machine-readable { checks, ok } object instead. Exit 1 if any check FAILED
 * (warnings don't fail the run).
 *
 * Usage: cartwright doctor [--json]
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { parseArgs } from "node:util";
import { intro, outro, cancel } from "@clack/prompts";
import pc from "picocolors";
import { DEFAULT_REF } from "./refs.js";

// ── Types ───────────────────────────────────────────────────────────────────

export type CheckStatus = "ok" | "warn" | "fail" | "skip";

export type CheckResult = {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
};

/** Shape of .cartwright/release.json (all fields optional — forward-compat). */
export type ReleaseMarker = {
  engine?: string;
  channel?: string; // stable | next | source
  ref?: string;
  version?: string; // AUTHORITATIVE semver, e.g. "v0.39.1"
  commit?: string;
  releasedAt?: string;
};

/** Shape of .cartwright/profile.json. */
export type ProfileMarker = {
  profile?: string;
  generatedBy?: string;
  keptDesigns?: string[];
  excludedPaths?: string[];
  prunedDependencies?: string[];
};

/** Injectable command runner so tests never spawn real processes. */
export type SpawnRunner = (
  cmd: string,
  args: string[],
  cwd: string,
) => { status: number | null; error?: boolean; timedOut?: boolean };

/** Hard cap per spawned command — db:verify boots Prisma, so give it room. */
export const SPAWN_TIMEOUT_MS = 60_000;

// ── Pure helpers (unit-tested) ──────────────────────────────────────────────

/** Check 1 — the three files that make a directory a Cartwright project root. */
export function checkSentinels(present: {
  brandConfig: boolean;
  schema: boolean;
  pkg: boolean;
}): CheckResult {
  const missing = [
    ...(present.brandConfig ? [] : ["brand.config.ts"]),
    ...(present.schema ? [] : ["prisma/schema.prisma"]),
    ...(present.pkg ? [] : ["package.json"]),
  ];
  return missing.length === 0
    ? {
        id: "project",
        label: "Cartwright project",
        status: "ok",
        detail: "brand.config.ts · prisma/schema.prisma · package.json found",
      }
    : {
        id: "project",
        label: "Cartwright project",
        status: "fail",
        detail: `missing ${missing.join(", ")} — run from a Cartwright project root`,
      };
}

/** Tolerant parse of a release/profile marker file. Null on garbage. */
export function parseJsonObject<T>(raw: string): T | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
    return parsed as T;
  } catch {
    return null;
  }
}

/** Check 2 — the .cartwright/release.json engine-version marker. */
export function checkReleaseMarker(raw: string | null): {
  result: CheckResult;
  marker: ReleaseMarker | null;
} {
  const id = "release";
  const label = "Release marker";
  if (raw === null) {
    return {
      result: {
        id,
        label,
        status: "warn",
        detail:
          "no .cartwright/release.json — pre-v0.22 scaffold, or the marker was stripped",
      },
      marker: null,
    };
  }
  const marker = parseJsonObject<ReleaseMarker>(raw);
  if (!marker) {
    return {
      result: {
        id,
        label,
        status: "warn",
        detail: ".cartwright/release.json exists but could not be parsed",
      },
      marker: null,
    };
  }
  // Field-type validation: valid JSON with non-string fields (e.g.
  // {"version": 39} or {"ref": null}) must degrade to a warn — never reach
  // compareSemverish (which would crash calling .trim() on a number).
  const badFields = (["version", "ref", "channel", "releasedAt"] as const).filter(
    (key) => marker[key] !== undefined && typeof marker[key] !== "string",
  );
  if (badFields.length > 0) {
    return {
      result: {
        id,
        label,
        status: "warn",
        detail: `malformed release marker — non-string field(s): ${badFields.join(", ")}`,
      },
      marker: null,
    };
  }
  const bits = [
    `engine ${marker.version ?? marker.ref ?? "unknown"}`,
    ...(marker.channel ? [`channel ${marker.channel}`] : []),
    ...(marker.releasedAt ? [`released ${marker.releasedAt}`] : []),
  ];
  const sourceNote =
    marker.channel === "source"
      ? " — running from engine source, not a tagged release"
      : "";
  return {
    result: { id, label, status: "ok", detail: bits.join(" · ") + sourceNote },
    marker,
  };
}

/** True when a vX.Y.Z tag carries a pre-release/build suffix (-rc.1, +sha…). */
export function hasPrereleaseSuffix(v: string): boolean {
  return /^v?\d+\.\d+\.\d+[-+]/.test(v.trim());
}

/**
 * Compare two vX.Y.Z-ish strings numerically on the X.Y.Z base (pre-release
 * suffixes are ignored here — checkUpToDate flags them separately). Returns
 * -1 if a < b, 0 if equal, 1 if a > b, null when either doesn't look like a
 * semver tag.
 */
export function compareSemverish(a: string, b: string): -1 | 0 | 1 | null {
  const re = /^v?(\d+)\.(\d+)\.(\d+)/;
  const ma = re.exec(a.trim());
  const mb = re.exec(b.trim());
  if (!ma || !mb) return null;
  for (let i = 1; i <= 3; i++) {
    const na = Number(ma[i]);
    const nb = Number(mb[i]);
    if (na < nb) return -1;
    if (na > nb) return 1;
  }
  return 0;
}

/**
 * Check 3 — engine version vs the latest template tag THIS CLI build knows
 * (DEFAULT_REF). Explicitly no network — an older CLI knows an older latest.
 */
export function checkUpToDate(
  markerVersion: string | null | undefined,
  latestKnown: string,
): CheckResult {
  const id = "up-to-date";
  const label = "Engine up to date";
  if (!markerVersion) {
    return {
      id,
      label,
      status: "skip",
      detail: "no engine version to compare (release marker missing)",
    };
  }
  const cmp = compareSemverish(markerVersion, latestKnown);
  if (cmp === null) {
    return {
      id,
      label,
      status: "skip",
      detail: `engine version "${markerVersion}" is not a vX.Y.Z tag — cannot compare`,
    };
  }
  if (cmp === 0) {
    // Same X.Y.Z base but a pre-release suffix on either side → not actually
    // on the stable tag. Flag it instead of calling it up to date.
    if (hasPrereleaseSuffix(markerVersion) || hasPrereleaseSuffix(latestKnown)) {
      return {
        id,
        label,
        status: "warn",
        detail: `engine ${markerVersion} is a pre-release of ${latestKnown} — upgrade to the stable tag`,
      };
    }
    return {
      id,
      label,
      status: "ok",
      detail: `engine ${markerVersion} matches the latest this CLI knows (${latestKnown})`,
    };
  }
  if (cmp < 0) {
    return {
      id,
      label,
      status: "warn",
      detail:
        `engine ${markerVersion} is behind ${latestKnown} — update guide: ` +
        `https://cartwright.app/docs (see the versioning policy). ` +
        `No network check: ${latestKnown} is the latest known to this CLI build.`,
    };
  }
  return {
    id,
    label,
    status: "ok",
    detail:
      `engine ${markerVersion} is ahead of this CLI's known latest (${latestKnown}) — ` +
      `a newer CLI exists: npx create-cartwright@latest`,
  };
}

/** Check 4 — the .cartwright/profile.json scaffold-profile marker. */
export function checkProfile(raw: string | null): CheckResult {
  const id = "profile";
  const label = "Scaffold profile";
  if (raw === null) {
    return {
      id,
      label,
      status: "ok",
      detail: "no .cartwright/profile.json — full profile or a pre-profile scaffold",
    };
  }
  const marker = parseJsonObject<ProfileMarker>(raw);
  if (!marker) {
    return {
      id,
      label,
      status: "warn",
      detail: ".cartwright/profile.json exists but could not be parsed",
    };
  }
  const kept = Array.isArray(marker.keptDesigns) ? marker.keptDesigns.length : null;
  // v2 markers (the B3 materializer) record the resolved module graph
  // instead of a kept-designs list.
  const modules = Array.isArray((marker as { modules?: unknown }).modules)
    ? ((marker as { modules: unknown[] }).modules.length)
    : null;
  return {
    id,
    label,
    status: "ok",
    detail:
      `profile "${marker.profile ?? "unknown"}"` +
      (kept !== null ? ` · ${kept} designs kept` : "") +
      (modules !== null ? ` · ${modules} modules` : ""),
  };
}

/** Check 5 — Node major version (engine's package.json says >= 22). */
export function checkNode(nodeVersion: string): CheckResult {
  const major = Number(/^v?(\d+)/.exec(nodeVersion)?.[1] ?? NaN);
  const ok = Number.isFinite(major) && major >= 22;
  return {
    id: "node",
    label: "Node version",
    status: ok ? "ok" : "warn",
    detail: ok
      ? `Node ${nodeVersion}`
      : `Node ${nodeVersion} — the engine needs Node ≥ 22 (package.json engines)`,
  };
}

/**
 * Shallow .env parse — enough for a diagnostic, no dotenv dep. Handles
 * `KEY=value`, `export KEY=value`, surrounding single/double quotes, inline
 * ` # comments` after the value (a `#` INSIDE quotes is preserved), full-line
 * comments and blank lines. Unquoted values keep any `=` after the first.
 * Known limitation: multiline quoted values are NOT supported (each line is
 * parsed independently) — out of scope for this diagnostic.
 */
export function parseEnvFile(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) continue;
    const m = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    let value = m[2].trim();
    const quote = value[0];
    if (quote === '"' || quote === "'") {
      const close = value.indexOf(quote, 1);
      if (close > 0) {
        // Take the quoted content; anything after the closing quote (e.g. an
        // inline ` # prod` comment) is ignored. `#` inside quotes survives.
        value = value.slice(1, close);
      }
      // No closing quote on this line → keep raw (multiline values are out
      // of scope, see the doc comment above).
    } else {
      // Unquoted: strip a trailing ` # comment` — only when the `#` follows
      // whitespace, so bare fragments like `a#b` stay intact.
      value = value.replace(/\s+#.*$/, "").trim();
    }
    out[m[1]] = value;
  }
  return out;
}

/** The env keys the doctor cares about (boot requirements). */
export const ENV_KEYS = [
  "AUTH_SECRET",
  "DATABASE_URL",
  "TURSO_DATABASE_URL",
  "TURSO_AUTH_TOKEN",
] as const;

/**
 * Merge the env sources with the app's ACTUAL runtime precedence (Next.js
 * load order): process.env > .env.local > .env. Settings inherited from the
 * shell/CI/container must count — otherwise a perfectly bootable project
 * would report a false FAIL. Only the keys the doctor checks are overlaid
 * from process.env (it carries hundreds of unrelated vars).
 */
export function mergeEnvSources(input: {
  dotEnv: Record<string, string>;
  dotEnvLocal: Record<string, string>;
  processEnv: Record<string, string | undefined>;
}): Record<string, string> {
  const merged: Record<string, string> = { ...input.dotEnv, ...input.dotEnvLocal };
  for (const key of ENV_KEYS) {
    const v = input.processEnv[key];
    if (v !== undefined) merged[key] = v;
  }
  return merged;
}

/** True when an AUTH_SECRET value is empty or an obvious placeholder. */
export function isPlaceholderSecret(value: string | undefined): boolean {
  if (value === undefined) return true;
  const v = value.trim();
  if (v === "") return true;
  if (v.startsWith("<") || v.endsWith(">")) return true;
  return /^(changeme|change[-_]me|todo|placeholder|replace([-_]me)?|your[-_].*|xxx+|\.\.\.)$/i.test(
    v,
  );
}

/** Check 6 — env preflight (mirrors the engine's boot requirements). */
export function checkEnv(input: {
  envLocalExists: boolean;
  env: Record<string, string>;
}): CheckResult {
  const id = "env";
  const label = "Environment";
  const issues: string[] = [];
  if (isPlaceholderSecret(input.env.AUTH_SECRET)) {
    issues.push("AUTH_SECRET is missing or a placeholder — the app won't boot without it");
  }
  const hasDb =
    Boolean(input.env.DATABASE_URL?.trim()) ||
    (Boolean(input.env.TURSO_DATABASE_URL?.trim()) &&
      Boolean(input.env.TURSO_AUTH_TOKEN?.trim()));
  if (!hasDb) {
    issues.push(
      "no database URL — set DATABASE_URL, or both TURSO_DATABASE_URL + TURSO_AUTH_TOKEN",
    );
  }
  if (issues.length === 0) {
    return {
      id,
      label,
      status: "ok",
      detail: input.envLocalExists
        ? "AUTH_SECRET set · database URL present"
        : "AUTH_SECRET + database URL present (inherited process env — no .env.local)",
    };
  }
  if (!input.envLocalExists) {
    return {
      id,
      label,
      status: "warn",
      detail:
        ".env.local not found — copy .env.example and set AUTH_SECRET + a database URL",
    };
  }
  return { id, label, status: "fail", detail: issues.join("; ") };
}

/** True when package.json declares a db:verify script. */
export function hasDbVerifyScript(pkgRaw: string | null): boolean {
  if (pkgRaw === null) return false;
  const pkg = parseJsonObject<{ scripts?: Record<string, unknown> }>(pkgRaw);
  return typeof pkg?.scripts?.["db:verify"] === "string";
}

/** Check 7 — migration-baseline drift via the project's own db:verify gate. */
export function checkDbVerify(input: {
  hasScript: boolean;
  pnpmOnPath: boolean;
  cwd: string;
  run: SpawnRunner;
}): CheckResult {
  const id = "db";
  const label = "Database baseline";
  if (!input.pnpmOnPath) {
    return { id, label, status: "skip", detail: "pnpm not found — db:verify not run" };
  }
  if (!input.hasScript) {
    return {
      id,
      label,
      status: "skip",
      detail: "no db:verify script (older engine) — nothing to run",
    };
  }
  const res = input.run("pnpm", ["run", "--if-present", "db:verify"], input.cwd);
  if (res.timedOut) {
    return {
      id,
      label,
      status: "warn",
      detail: `db:verify timed out after ${SPAWN_TIMEOUT_MS / 1000}s — run \`pnpm db:verify\` manually`,
    };
  }
  if (res.error || res.status === null) {
    return { id, label, status: "warn", detail: "could not run db:verify" };
  }
  if (res.status === 0) {
    return { id, label, status: "ok", detail: "migration baseline matches the schema" };
  }
  if (res.status === 2) {
    // Drift doesn't block boot (dev uses db push / db:setup) — but the
    // scaffolded ci.yml runs db:verify, so CI WILL go red. Warn, not fail.
    return {
      id,
      label,
      status: "warn",
      detail:
        "migration-baseline drift — your CI (ci.yml) will fail on db:verify; see prisma/migrations/README.md",
    };
  }
  return {
    id,
    label,
    status: "warn",
    detail: `could not verify (db:verify exited ${res.status})`,
  };
}

// ── Aggregation (integration-tested with an injectable runner) ─────────────

const defaultRunner: SpawnRunner = (cmd, args, cwd) => {
  const res = spawnSync(cmd, args, {
    cwd,
    stdio: "ignore",
    shell: process.platform === "win32",
    // Never hang the doctor on a stuck child (e.g. db:verify waiting on a DB).
    timeout: SPAWN_TIMEOUT_MS,
  });
  const timedOut =
    (res.error as NodeJS.ErrnoException | undefined)?.code === "ETIMEDOUT";
  return { status: res.status, error: Boolean(res.error), timedOut };
};

function readIfExists(path: string): string | null {
  return existsSync(path) ? readFileSync(path, "utf8") : null;
}

/**
 * Run every check against a project directory. Pure apart from fs reads and
 * the injectable command runner — tests point it at a mkdtemp scaffold with a
 * stub runner. Short-circuits after the sentinel check when the directory is
 * not a Cartwright project.
 */
export function collectChecks(
  cwd: string,
  deps: {
    run?: SpawnRunner;
    nodeVersion?: string;
    processEnv?: Record<string, string | undefined>;
  } = {},
): { checks: CheckResult[]; ok: boolean } {
  const run = deps.run ?? defaultRunner;
  const nodeVersion = deps.nodeVersion ?? process.version;
  const processEnv = deps.processEnv ?? process.env;

  const sentinel = checkSentinels({
    brandConfig: existsSync(join(cwd, "brand.config.ts")),
    schema: existsSync(join(cwd, "prisma", "schema.prisma")),
    pkg: existsSync(join(cwd, "package.json")),
  });
  if (sentinel.status === "fail") {
    return { checks: [sentinel], ok: false };
  }

  const { result: markerResult, marker } = checkReleaseMarker(
    readIfExists(join(cwd, ".cartwright", "release.json")),
  );

  const pnpmProbe = run("pnpm", ["--version"], cwd);
  const pnpmOnPath = !pnpmProbe.error && pnpmProbe.status === 0;

  const checks: CheckResult[] = [
    sentinel,
    markerResult,
    checkUpToDate(marker?.version ?? marker?.ref, DEFAULT_REF),
    checkProfile(readIfExists(join(cwd, ".cartwright", "profile.json"))),
    checkNode(nodeVersion),
    checkEnv({
      envLocalExists: existsSync(join(cwd, ".env.local")),
      // Runtime precedence, exactly as the app receives env:
      // process.env > .env.local > .env (Next.js load order).
      env: mergeEnvSources({
        dotEnv: parseEnvFile(readIfExists(join(cwd, ".env")) ?? ""),
        dotEnvLocal: parseEnvFile(readIfExists(join(cwd, ".env.local")) ?? ""),
        processEnv,
      }),
    }),
    checkDbVerify({
      hasScript: hasDbVerifyScript(readIfExists(join(cwd, "package.json"))),
      pnpmOnPath,
      cwd,
      run,
    }),
  ];
  return { checks, ok: checks.every((c) => c.status !== "fail") };
}

// ── Runner ──────────────────────────────────────────────────────────────────

const STATUS_GLYPH: Record<CheckStatus, string> = {
  ok: pc.green("✓"),
  warn: pc.yellow("!"),
  fail: pc.red("✗"),
  skip: pc.dim("○"),
};

export async function runDoctor(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: { json: { type: "boolean" } },
  });

  const { checks, ok } = collectChecks(process.cwd());

  if (values.json === true) {
    // Machine-readable — no clack chrome, no colors.
    console.log(JSON.stringify({ checks, ok }, null, 2));
    process.exitCode = ok ? 0 : 1;
    return;
  }

  intro(pc.bgCyan(pc.black(" cartwright doctor ")));

  // Not a Cartwright project → one clear cancel instead of a check list.
  if (checks.length === 1 && checks[0].id === "project" && checks[0].status === "fail") {
    cancel(`Not a Cartwright project: ${checks[0].detail}.`);
    process.exitCode = 1;
    return;
  }

  for (const check of checks) {
    const label = check.status === "fail" ? pc.red(check.label) : pc.bold(check.label);
    console.log(`  ${STATUS_GLYPH[check.status]} ${label} ${pc.dim("—")} ${check.detail}`);
  }

  const counts = { ok: 0, warn: 0, fail: 0, skip: 0 };
  for (const check of checks) counts[check.status]++;
  const summary = [
    pc.green(`${counts.ok} ok`),
    ...(counts.warn > 0 ? [pc.yellow(`${counts.warn} warning${counts.warn === 1 ? "" : "s"}`)] : []),
    ...(counts.fail > 0 ? [pc.red(`${counts.fail} failed`)] : []),
    ...(counts.skip > 0 ? [pc.dim(`${counts.skip} skipped`)] : []),
  ].join(" · ");

  outro(
    ok
      ? `${summary} — ${pc.green("no blocking problems found.")} ${pc.dim("(read-only: nothing was changed)")}`
      : `${summary} — ${pc.red("fix the failed checks above.")} ${pc.dim("(read-only: nothing was changed)")}`,
  );
  process.exitCode = ok ? 0 : 1;
}
