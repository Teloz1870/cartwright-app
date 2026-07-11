/**
 * `cartwright vertical install <slug>` — fetch a marketplace Voice (vertical
 * preset) into an existing Cartwright project and register it.
 *
 * Closes the Voice marketplace loop: browse at cartwright.app/verticals →
 * install the preset into your repo. Fetches just verticals/<slug>/ from the
 * public template mirror (giget subdir clone), then wires it into
 * verticals/index.ts + verticals/options.ts. Falls back to printing manual
 * steps if the registry files don't match the expected shape.
 *
 * Mirrors design-install.ts, but the verticals registry differs: presets live
 * in verticals/<slug>/preset.ts, and BOTH index.ts and options.ts import the
 * preset (options.ts derives its metadata via toOption(preset) at runtime, so
 * there's no literal-metadata copy to keep in sync).
 *
 * Usage: cartwright vertical install <slug> [--ref <tag|stable|next>] [--force]
 */
import { downloadTemplate } from "giget";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { intro, outro, cancel, spinner, note } from "@clack/prompts";
import pc from "picocolors";

const TEMPLATE_REPO = "github:Teloz1870/cartwright-template";

// Keep DEFAULT_REF in sync with src/index.ts + design-install.ts — the
// bump-template-ref workflow seds all three on each template release. Verticals
// first shipped in v0.33.0 (the registry exists from that tag onward).
const DEFAULT_REF = "v0.39.1";
const REF_ALIASES: Record<string, string> = { stable: DEFAULT_REF, next: "next" };

// ── Pure helpers (unit-tested) ──────────────────────────────────────────────

/** The exported preset const name from preset.ts, e.g. `kindergartenPreset`. */
export function extractPresetExportName(presetSrc: string): string | null {
  return presetSrc.match(/export\s+const\s+([A-Za-z_$][\w$]*)/)?.[1] ?? null;
}

/** Best-effort display name for the outro message. */
export function extractPresetName(presetSrc: string): string | null {
  return presetSrc.match(/\bname:\s*"((?:[^"\\]|\\.)*)"/)?.[1] ?? null;
}

export type RegisterStatus = "added" | "already" | "anchor-missing";

/**
 * Insert `import { <exportName> } from "./<slug>/preset";` after the last
 * existing preset import. Returns anchor-missing if there's no preset import to
 * anchor against. Callers guard idempotency before calling.
 */
function insertPresetImport(
  src: string,
  slug: string,
  exportName: string,
): { src: string; ok: boolean } {
  const importRe = /^import\s+\{[^}]*\}\s+from\s+"\.\/[^"]+\/preset";[ \t]*$/gm;
  let last: RegExpExecArray | null = null;
  let m: RegExpExecArray | null;
  while ((m = importRe.exec(src))) last = m;
  if (!last) return { src, ok: false };
  const at = last.index + last[0].length;
  return {
    src: `${src.slice(0, at)}\nimport { ${exportName} } from "./${slug}/preset";${src.slice(at)}`,
    ok: true,
  };
}

/** Insert the import + VERTICALS-map entry into verticals/index.ts source. */
export function addToVerticalsIndex(
  src: string,
  slug: string,
  exportName: string,
): { src: string; status: RegisterStatus } {
  if (src.includes(`from "./${slug}/preset"`)) return { src, status: "already" };
  const imp = insertPresetImport(src, slug, exportName);
  if (!imp.ok) return { src, status: "anchor-missing" };
  let out = imp.src;

  const vIdx = out.search(/const\s+VERTICALS\b/);
  if (vIdx < 0) return { src: out, status: "anchor-missing" };
  const open = out.indexOf("{", vIdx);
  const close = out.indexOf("\n};", open);
  if (open < 0 || close < 0) return { src: out, status: "anchor-missing" };
  const key = /^[A-Za-z_$][\w$]*$/.test(slug) ? slug : JSON.stringify(slug);
  out = `${out.slice(0, close)}\n  ${key}: ${exportName},${out.slice(close)}`;
  return { src: out, status: "added" };
}

/** Insert the import + `toOption(<exportName>),` into verticals/options.ts. */
export function addToVerticalOptions(
  src: string,
  slug: string,
  exportName: string,
): { src: string; status: RegisterStatus } {
  if (src.includes(`from "./${slug}/preset"`)) return { src, status: "already" };
  const imp = insertPresetImport(src, slug, exportName);
  if (!imp.ok) return { src, status: "anchor-missing" };
  let out = imp.src;

  const close = out.lastIndexOf("];");
  if (close < 0) return { src: out, status: "anchor-missing" };
  out = `${out.slice(0, close)}  toOption(${exportName}),\n${out.slice(close)}`;
  return { src: out, status: "added" };
}

// ── Runner ──────────────────────────────────────────────────────────────────

export async function runVerticalInstall(args: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: { ref: { type: "string" }, force: { type: "boolean" } },
  });

  intro(pc.bgCyan(pc.black(" cartwright vertical install ")));

  const slug = positionals[0];
  if (!slug) {
    cancel("Usage: cartwright vertical install <slug> [--ref <tag>] [--force]");
    process.exit(1);
  }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    cancel(`Invalid slug "${slug}" — verticals use kebab-case (e.g. "kindergarten").`);
    process.exit(1);
  }

  const cwd = process.cwd();
  const indexPath = join(cwd, "verticals", "index.ts");
  if (!existsSync(indexPath)) {
    cancel("No verticals/index.ts here. Run this from a Cartwright project root (engine ≥ the verticals release).");
    process.exit(1);
  }

  const force = values.force === true;
  const dest = join(cwd, "verticals", slug);
  if (existsSync(dest) && !force) {
    cancel(`verticals/${slug} already exists. Re-run with --force to overwrite.`);
    process.exit(1);
  }

  const requestedRef = (values.ref as string | undefined) ?? "stable";
  const ref = REF_ALIASES[requestedRef] ?? requestedRef;

  const s = spinner();
  s.start(`Fetching Voice "${slug}" (${ref})…`);
  try {
    await downloadTemplate(`${TEMPLATE_REPO}/verticals/${slug}#${ref}`, { dir: dest, force });
  } catch {
    s.stop(pc.red("Fetch failed."));
    cancel(
      `Couldn't fetch Voice "${slug}" at ${ref}. ` +
        `Check the slug at https://cartwright.app/verticals (or try --ref next — verticals shipped after v0.32.0).`,
    );
    process.exit(1);
  }

  const fetchedPreset = join(dest, "preset.ts");
  if (!existsSync(fetchedPreset)) {
    s.stop(pc.red("Fetched, but it doesn't look like a Voice preset."));
    cancel(`"${slug}" has no preset.ts — is the slug correct?`);
    process.exit(1);
  }
  s.stop(pc.green(`Downloaded verticals/${slug}/`));

  const presetSrc = readFileSync(fetchedPreset, "utf8");
  const exportName = extractPresetExportName(presetSrc);
  const displayName = extractPresetName(presetSrc) ?? slug;
  const manual: string[] = [];

  if (exportName) {
    const idx = addToVerticalsIndex(readFileSync(indexPath, "utf8"), slug, exportName);
    if (idx.status === "added") writeFileSync(indexPath, idx.src);
    else if (idx.status === "anchor-missing") {
      manual.push(
        `verticals/index.ts — add:\n  import { ${exportName} } from "./${slug}/preset";\n  …and inside the VERTICALS map:  ${slug}: ${exportName},`,
      );
    }

    const optionsPath = join(cwd, "verticals", "options.ts");
    if (existsSync(optionsPath)) {
      const opt = addToVerticalOptions(readFileSync(optionsPath, "utf8"), slug, exportName);
      if (opt.status === "added") writeFileSync(optionsPath, opt.src);
      else if (opt.status === "anchor-missing") {
        manual.push(
          `verticals/options.ts — add:\n  import { ${exportName} } from "./${slug}/preset";\n  …and inside VERTICAL_OPTIONS:  toOption(${exportName}),`,
        );
      }
    }
  } else {
    manual.push(
      `Couldn't detect the preset's exported const — register verticals/${slug} manually in verticals/index.ts + verticals/options.ts.`,
    );
  }

  if (manual.length === 0) {
    note(`Registered in verticals/index.ts + verticals/options.ts.`, pc.green("Installed"));
  } else {
    note(manual.join("\n\n"), pc.yellow("Fetched — finish registration manually"));
  }

  outro(
    `Apply "${displayName}": enable ${pc.cyan("brand.features.verticalPresets")}, then use ` +
      `${pc.cyan("/admin/verticals")} (Voice / Voice + Skin) — or call ` +
      `${pc.cyan(`applyVertical("${slug}")`)} in code.`,
  );
}
