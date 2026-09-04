import { beforeAll, describe, expect, it } from "vitest";
import { DEFAULT_REF } from "./refs";
import {
  ENGINE_DOMAINS,
  patchAIStylistButtonContent,
  patchBrandConfigContent,
  patchBrandConfigSameAs,
  patchBrandConfigForEnglishFirst,
  patchBrandConfigGithubUrl,
  patchFooterGithubUrlGate,
  patchLogoForScaffold,
  type PatchResult,
} from "./scaffold";

/**
 * The scaffolder rewrites the engine template with ~20 string/regex anchors.
 * Every anchor is a promise about source code living in ANOTHER repo at a ref
 * this file does not control — `bump-template-ref.yml` moves DEFAULT_REF on its
 * own schedule. Nothing tested those anchors against a real template, so a bump
 * could (and did) break several at once, in silence.
 *
 * Measured failure this gate exists for: the v0.51.1 → v0.54.0 bump (PR #328,
 * released as 2.9.1) broke `patchBrandConfigGithubUrl`. Its anchor required the
 * bare profile URL, the engine had moved to a repo path, and the fallback branch
 * treated "not Teloz" as "the customer already edited it" — so every scaffold
 * published a footer "GitHub Profile" link pointing at OUR repo, with no warning.
 *
 * Two lessons are baked into the shape of this file:
 *
 *  1. **Assert OUTCOMES, not the absence of warnings.** The bug above emitted
 *     zero warnings. A "nothing warned" gate would have been green through it.
 *     Each case therefore states what must be TRUE of the patched output.
 *  2. **A skipped gate is a silent pass.** In CI a fetch failure FAILS. Only a
 *     local, offline run is allowed to skip, and it says so loudly.
 */

const TEMPLATE_REPO = "Teloz1870/cartwright-template";
const RAW = `https://raw.githubusercontent.com/${TEMPLATE_REPO}/${DEFAULT_REF}`;
const NET_TIMEOUT_MS = 30_000;

/** Files the anchors below read. Fetched once. */
const NEEDED = [
  "brand.config.ts",
  "components/AIStylistButton.tsx",
  "components/Footer.tsx",
] as const;

type NeededFile = (typeof NEEDED)[number];

const files = new Map<NeededFile, string>();
let fetchError: unknown = null;

beforeAll(async () => {
  try {
    await Promise.all(
      NEEDED.map(async (path) => {
        const res = await fetch(`${RAW}/${path}`);
        if (!res.ok) {
          throw new Error(`GET ${path} @ ${DEFAULT_REF} → HTTP ${res.status}`);
        }
        const body = await res.text();
        // A truncated/empty body would make every assertion below vacuously
        // "not the Teloz value" — the exact false-green this gate is for.
        if (body.trim().length === 0) {
          throw new Error(`GET ${path} @ ${DEFAULT_REF} → empty body`);
        }
        files.set(path, body);
      }),
    );
  } catch (err) {
    fetchError = err;
  }
}, NET_TIMEOUT_MS);

/**
 * Returns the file, or fails/skips per the CI rule. Never returns "" — an empty
 * string would let the assertions pass without reading anything.
 */
function templateFile(ctx: { skip: () => void }, path: NeededFile): string {
  if (fetchError) {
    if (process.env.CI) {
      throw new Error(
        `anchor-drift gate could not reach ${TEMPLATE_REPO}@${DEFAULT_REF}. ` +
          `In CI this is a failure, never a skip — an unrun drift gate is a silent pass. ` +
          `Cause: ${String(fetchError)}`,
      );
    }
    console.warn(
      `\n[anchor-drift] SKIPPED (offline, not CI): ${String(fetchError)}\n` +
        `[anchor-drift] These anchors are therefore UNVERIFIED on this run.\n`,
    );
    ctx.skip();
  }
  const src = files.get(path);
  if (!src) throw new Error(`missing fetched file ${path}`);
  return src;
}

/** Fails with the patcher's own warnings attached, so drift reads as drift. */
function expectNoWarnings(label: string, result: PatchResult): void {
  expect(result.warnings, `${label} warned against ${DEFAULT_REF}`).toEqual([]);
}

describe(`scaffold anchors vs the real template @ ${DEFAULT_REF}`, () => {
  it("neutralises footer.githubUrl — a scaffold must never link to our repo", (ctx) => {
    const src = templateFile(ctx, "brand.config.ts");

    // Guard against a vacuous pass: prove the input really does carry a Teloz
    // URL, so the assertion below is exercised rather than trivially true.
    expect(src, "template no longer ships a Teloz githubUrl at all").toMatch(
      /githubUrl:\s*"https:\/\/github\.com\/Teloz1870/,
    );

    const result = patchBrandConfigGithubUrl(src);
    expectNoWarnings("patchBrandConfigGithubUrl", result);
    expect(result.src).toMatch(/githubUrl:\s*""/);
    expect(result.src).not.toMatch(/githubUrl:\s*"https:\/\/github\.com\/Teloz1870/);
  });

  it("gates the footer GitHub block so the emptied URL renders nothing", (ctx) => {
    const src = templateFile(ctx, "components/Footer.tsx");
    const result = patchFooterGithubUrlGate(src);
    expectNoWarnings("patchFooterGithubUrlGate", result);
    expect(result.src).toContain("{brand.footer.githubUrl && (");
  });

  it("swaps the Teloz logo mark and leaves a Cartwright favicon palette", (ctx) => {
    const src = templateFile(ctx, "brand.config.ts");
    const result = patchLogoForScaffold(src);
    expectNoWarnings("patchLogoForScaffold", result);

    // The Teloz stacked-layers mark must not survive into a customer scaffold.
    expect(result.src).not.toContain("M12 2L2 7l10 5 10-5-10-5z");
    expect(result.src).toContain("M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z");

    const bg = result.src.match(/faviconBg:\s*["']([^"']+)["']/)?.[1];
    const fg = result.src.match(/faviconFg:\s*["']([^"']+)["']/)?.[1];
    // Legacy Teloz navy must never be what a scaffold ships.
    expect([bg, fg]).not.toEqual(["#1e3f5a", "#f4efe6"]);
    expect(
      [
        ["#c33f16", "#ffffff"],
        ["#18181b", "#fafafa"],
      ].some(([b, f]) => b === bg && f === fg),
      `favicon palette ${bg}/${fg} is not a known Cartwright pair`,
    ).toBe(true);
  });

  it("empties company.sameAs — no scaffold may assert it is Cartwright in JSON-LD", (ctx) => {
    const src = templateFile(ctx, "brand.config.ts");
    expect(src, "template no longer ships a sameAs list").toMatch(/sameAs:\s*\[/);

    const result = patchBrandConfigSameAs(src);
    expectNoWarnings("patchBrandConfigSameAs", result);
    const after = result.src.match(/sameAs:\s*\[([\s\S]*?)\]/)?.[1] ?? "";
    expect(after.trim()).toBe("");
  });

  it("leaves no engine domain in any identity field", (ctx) => {
    const src = templateFile(ctx, "brand.config.ts");

    // Vacuity guard: the engine really does brand itself in this file.
    expect(
      ENGINE_DOMAINS.some((d) => src.includes(d)),
      "template carries none of the known engine domains — has it rebranded again?",
    ).toBe(true);

    const out = patchBrandConfigContent(src, "my-shop");
    for (const domain of ENGINE_DOMAINS) {
      // Identity FIELDS must be clean. Comments may still mention us.
      const leaked = out
        .split("\n")
        .filter((l) => {
          const t = l.trimStart();
          if (t.startsWith("*") || t.startsWith("//") || t.startsWith("/*")) return false;
          return new RegExp(`"[^"]*${domain.replace(".", "\\.")}`).test(l);
        });
      expect(leaked, `${domain} still in scaffold identity fields`).toEqual([]);
    }
  });

  it("forces the scaffold to be born en-only", (ctx) => {
    const src = templateFile(ctx, "brand.config.ts");
    const result = patchBrandConfigForEnglishFirst(src, "Test Shop");
    expectNoWarnings("patchBrandConfigForEnglishFirst", result);
    expect(result.src).toMatch(/locales:\s*\["en"\]\s*as const/);
    expect(result.src).toMatch(/defaultLocale:\s*"en"/);
  });

  it("leaves no hardcoded Danish AI-assistant labels in the button", (ctx) => {
    const src = templateFile(ctx, "components/AIStylistButton.tsx");
    const result = patchAIStylistButtonContent(src);

    // From v0.52.0 the engine fixed this upstream via tSf()/messages, so the
    // anchors miss BY DESIGN and the patch must stay quiet. Below that ref the
    // anchors must still hit. Either way the outcome is the same and it is the
    // outcome — not the anchor — that this asserts.
    expectNoWarnings("patchAIStylistButtonContent", result);
    expect(result.src).not.toContain('"AI Konsulent"');
    expect(result.src).not.toContain('"Spørg AI Konsulenten"');
  });

  it("is not vacuous: a drifted anchor is caught, not silently tolerated", () => {
    // The regression that motivated this file, replayed on a synthetic input:
    // a githubUrl the old exact-match anchor could not see. The patcher must
    // now either neutralise it or say something — never both-silent-and-unchanged,
    // which is what shipped in 2.9.1.
    const drifted = `  footer: {\n    githubUrl: "https://github.com/Teloz1870/some-new-repo" as string,\n  },`;
    const result = patchBrandConfigGithubUrl(drifted);
    expect(result.src).toMatch(/githubUrl:\s*""/);

    // And a genuinely foreign URL is preserved but reported, so the silent
    // branch that hid the bug cannot come back.
    const foreign = `  footer: {\n    githubUrl: "https://github.com/acme/shop" as string,\n  },`;
    const kept = patchBrandConfigGithubUrl(foreign);
    expect(kept.src).toContain("https://github.com/acme/shop");
    expect(kept.warnings.join(" ")).toContain("acme/shop");
  });
});
