/**
 * `cartwright design install <slug>` — fetch a marketplace design pack into an
 * existing Cartwright project and register it.
 *
 * Closes the marketplace loop: browse at cartwright.app/designs → install the
 * code into your repo. Fetches just designs/<slug>/ from the public template
 * mirror (giget subdir clone), then wires it into designs/index.ts +
 * designs/options.ts. Falls back to printing manual steps if the registry files
 * don't match the expected shape.
 *
 * Usage: cartwright design install <slug> [--ref <tag|stable|next>] [--force]
 */
import { downloadTemplate } from "giget";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { intro, outro, cancel, spinner, note } from "@clack/prompts";
import pc from "picocolors";

const TEMPLATE_REPO = "github:Teloz1870/cartwright-template";

// Keep DEFAULT_REF in sync with src/index.ts — the bump-template-ref workflow
// seds BOTH files on each template release.
const DEFAULT_REF = "v0.39.1";
const REF_ALIASES: Record<string, string> = { stable: DEFAULT_REF, next: "next" };

// ── Pure helpers (unit-tested) ──────────────────────────────────────────────

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** The exported DesignPack const name, e.g. `engineeredDesign`. */
export function extractExportName(designIndexSrc: string): string | null {
  return designIndexSrc.match(/export\s+const\s+([A-Za-z_$][\w$]*)/)?.[1] ?? null;
}

export type DesignMeta = {
  name?: string;
  description?: string;
  mode?: string;
  premium: boolean;
};

/** Best-effort metadata for the options.ts entry, read from the pack literal. */
export function extractMeta(designIndexSrc: string): DesignMeta {
  return {
    name: designIndexSrc.match(/\bname:\s*"((?:[^"\\]|\\.)*)"/)?.[1],
    description: designIndexSrc.match(/\bdescription:\s*"((?:[^"\\]|\\.)*)"/)?.[1],
    mode: designIndexSrc.match(/\bmode:\s*"(website|webshop|both)"/)?.[1],
    premium: /\bpremium:\s*true\b/.test(designIndexSrc),
  };
}

export type RegisterStatus = "added" | "already" | "anchor-missing";

/** Insert the import + DESIGNS-map entry into designs/index.ts source. */
export function addToIndexSource(
  src: string,
  slug: string,
  exportName: string,
): { src: string; status: RegisterStatus } {
  if (src.includes(`from "./${slug}"`)) return { src, status: "already" };

  // Insert the import after the last `... from "./xxx";` import line.
  const importRe = /^import\s+[^\n]*from\s+"\.\/[^"]+";[ \t]*$/gm;
  let lastImport: RegExpExecArray | null = null;
  let m: RegExpExecArray | null;
  while ((m = importRe.exec(src))) lastImport = m;
  if (!lastImport) return { src, status: "anchor-missing" };
  const at = lastImport.index + lastImport[0].length;
  let out = `${src.slice(0, at)}\nimport { ${exportName} } from "./${slug}";${src.slice(at)}`;

  // Insert the map entry before the DESIGNS object's closing `};`.
  const dIdx = out.search(/const\s+DESIGNS\b/);
  if (dIdx < 0) return { src: out, status: "anchor-missing" };
  const open = out.indexOf("{", dIdx);
  const close = out.indexOf("\n};", open);
  if (open < 0 || close < 0) return { src: out, status: "anchor-missing" };
  const key = /^[A-Za-z_$][\w$]*$/.test(slug) ? slug : JSON.stringify(slug);
  out = `${out.slice(0, close)}\n  ${key}: ${exportName},${out.slice(close)}`;
  return { src: out, status: "added" };
}

/** Append a DESIGN_OPTIONS entry to designs/options.ts source. */
export function addToOptionsSource(
  src: string,
  slug: string,
  meta: DesignMeta,
): { src: string; status: RegisterStatus } {
  if (new RegExp(`slug:\\s*["']${escapeRe(slug)}["']`).test(src)) {
    return { src, status: "already" };
  }
  const close = src.lastIndexOf("];");
  if (close < 0) return { src, status: "anchor-missing" };
  const entry =
    `  {\n` +
    `    slug: ${JSON.stringify(slug)},\n` +
    `    name: ${JSON.stringify(meta.name ?? slug)},\n` +
    `    description: ${JSON.stringify(meta.description ?? "")},\n` +
    `    mode: ${JSON.stringify(meta.mode ?? "website")},\n` +
    `    premium: ${meta.premium ? "true" : "false"},\n` +
    `  },\n`;
  return { src: `${src.slice(0, close)}${entry}${src.slice(close)}`, status: "added" };
}

// ── Runner ──────────────────────────────────────────────────────────────────

export async function runDesignInstall(args: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: { ref: { type: "string" }, force: { type: "boolean" } },
  });

  intro(pc.bgCyan(pc.black(" cartwright design install ")));

  const slug = positionals[0];
  if (!slug) {
    cancel("Usage: cartwright design install <slug> [--ref <tag>] [--force]");
    process.exit(1);
  }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    cancel(`Invalid slug "${slug}" — designs use kebab-case (e.g. "engineered").`);
    process.exit(1);
  }

  const cwd = process.cwd();
  const indexPath = join(cwd, "designs", "index.ts");
  if (!existsSync(indexPath)) {
    cancel("No designs/index.ts here. Run this from a Cartwright project root.");
    process.exit(1);
  }

  const force = values.force === true;
  const dest = join(cwd, "designs", slug);
  if (existsSync(dest) && !force) {
    cancel(`designs/${slug} already exists. Re-run with --force to overwrite.`);
    process.exit(1);
  }

  const requestedRef = (values.ref as string | undefined) ?? "stable";
  const ref = REF_ALIASES[requestedRef] ?? requestedRef;

  const s = spinner();
  s.start(`Fetching design "${slug}" (${ref})…`);
  try {
    await downloadTemplate(`${TEMPLATE_REPO}/designs/${slug}#${ref}`, { dir: dest, force });
  } catch {
    s.stop(pc.red("Fetch failed."));
    cancel(
      `Couldn't fetch design "${slug}" at ${ref}. ` +
        `Check the slug at https://cartwright.app/designs (or try --ref next).`,
    );
    process.exit(1);
  }

  const fetchedIndex = join(dest, "index.ts");
  if (!existsSync(fetchedIndex)) {
    s.stop(pc.red("Fetched, but it doesn't look like a design pack."));
    cancel(`"${slug}" has no index.ts — is the slug correct?`);
    process.exit(1);
  }
  s.stop(pc.green(`Downloaded designs/${slug}/`));

  const designSrc = readFileSync(fetchedIndex, "utf8");
  const exportName = extractExportName(designSrc);
  const meta = extractMeta(designSrc);
  const manual: string[] = [];

  if (exportName) {
    const idx = addToIndexSource(readFileSync(indexPath, "utf8"), slug, exportName);
    if (idx.status === "added") writeFileSync(indexPath, idx.src);
    else if (idx.status === "anchor-missing") {
      manual.push(
        `designs/index.ts — add:\n  import { ${exportName} } from "./${slug}";\n  …and inside the DESIGNS map:  "${slug}": ${exportName},`,
      );
    }

    const optionsPath = join(cwd, "designs", "options.ts");
    if (existsSync(optionsPath)) {
      const opt = addToOptionsSource(readFileSync(optionsPath, "utf8"), slug, meta);
      if (opt.status === "added") writeFileSync(optionsPath, opt.src);
      else if (opt.status === "anchor-missing") {
        manual.push(`designs/options.ts — add a DESIGN_OPTIONS entry with slug "${slug}".`);
      }
    }
  } else {
    manual.push(
      `Couldn't detect the design's exported const — register designs/${slug} manually in designs/index.ts + designs/options.ts.`,
    );
  }

  if (manual.length === 0) {
    note(`Registered in designs/index.ts + designs/options.ts.`, pc.green("Installed"));
  } else {
    note(manual.join("\n\n"), pc.yellow("Fetched — finish registration manually"));
  }

  outro(
    `Activate it: set ${pc.cyan(`designSlug: "${slug}"`)} in brand.config.ts ` +
      `(or pick it in /admin/designs), then start your dev server.`,
  );
}
