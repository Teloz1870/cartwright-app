import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import {
  isProfile,
  LIGHT_KEPT_DESIGNS,
  LIGHT_PRUNED_DESIGNS,
  LIGHT_EXCLUDED_PATHS,
  LIGHT_PRUNED_DEPENDENCIES,
  LIGHT_PRUNED_DEV_DEPENDENCIES,
  pruneDesignIndexSource,
  pruneDesignOptionsSource,
  pruneDesignMotifsSource,
  pruneWebMcpFromLayoutSource,
  prunePackageJsonForLight,
  patchBrandConfigForLightContent,
  applyLightProfile,
  lightProfileNote,
} from "./profile-light.js";

// Fixtures mirror the REAL shapes shipped in the v0.34.0 template (the shapes
// the codemods are anchored to). If the upstream files change shape, the
// e2e scaffold test is the net — these pin the pure transforms.

const INDEX_SRC = `import type { DesignPack } from "./types";
import { auroraSiteDesign } from "./aurora-site";
import { auroraShopDesign } from "./aurora-shop";
import { saasDarkDesign } from "./saas-dark";
import { studioDesign } from "./studio";
import { atelierDesign } from "./atelier";
import { hoptifyDesign } from "./hoptify";
import { editorialInkDesign } from "./editorial-ink";
import { fableDesign } from "./fable";

const DESIGNS: Record<string, DesignPack> = {
  "aurora-site": auroraSiteDesign,
  "aurora-shop": auroraShopDesign,
  "saas-dark": saasDarkDesign,
  studio: studioDesign,
  atelier: atelierDesign,
  hoptify: hoptifyDesign,
  "editorial-ink": editorialInkDesign,
  fable: fableDesign,
};

export function getDesign(slug: string | null | undefined): DesignPack | null {
  if (!slug) return null;
  return DESIGNS[slug] ?? null;
}
`;

const OPTIONS_SRC = `export const DESIGN_OPTIONS: DesignOption[] = [
  {
    slug: "aurora-site",
    name: "Aurora — Website (Cartwright default)",
    description: "The flagship Cartwright website default.",
    mode: "website",
    premium: false,
  },
  {
    slug: "saas-dark",
    name: "SaaS Dark (futurist / cyber)",
    description: "Dark bg with indigo accents, animated grid + glow.",
    mode: "website",
    premium: false,
  },
  {
    slug: "hoptify",
    name: "Hoptify",
    description: "Parody import-from-Shopify pack.",
    mode: "webshop",
    premium: false,
  },
  {
    slug: "fable",
    name: "Fable",
    description: "Metamorphosis story page.",
    mode: "website",
    premium: true,
  },
];

export const MIXABLE_DESIGN_SLUGS: ReadonlySet<string> = new Set([
  "aurora-site",
  "aurora-shop",
  "studio",
  "jungle",
  "hoptify",
  "apex",
  "fable",
  "stillwater",
]);
`;

const LAYOUT_SRC = `import Header from "@/components/Header";
import VoiceShopMount from "@/components/voice/VoiceShopMount";
import WebMcpRegistrar from "@/components/WebMcpRegistrar";
import WelcomeGuide from "@/components/WelcomeGuide";

export default async function LocaleLayout() {
  return (
    <body>
      {brandConfig.ecommerceEnabled && brandConfig.features.webMcp && <WebMcpRegistrar />}
      <main>x</main>
    </body>
  );
}
`;

const BRAND_SRC = `  features: {
    webshop: false,
    aiStylist: true,
    newsletter: true,
    mcpPublic: true,
    webMcp: false,
  },
`;

describe("isProfile", () => {
  it("accepts light and full only", () => {
    expect(isProfile("light")).toBe(true);
    expect(isProfile("full")).toBe(true);
    expect(isProfile("lite")).toBe(false);
    expect(isProfile(undefined)).toBe(false);
  });
});

describe("light design curation invariants", () => {
  it("keeps the 8 owner-curated slugs + the 2 structural keeps", () => {
    for (const slug of [
      "aurora-site",
      "fable",
      "stillwater",
      "halo",
      "jungle",
      "meridian",
      "brutalist",
      "apex",
      "aurora-shop", // webshop-mode default (inferDesignFromIndustry)
      "studio", // shared section library (lib/builder/section-registry)
    ]) {
      expect(LIGHT_KEPT_DESIGNS).toContain(slug);
    }
  });

  it("kept and pruned sets are disjoint and total (26 packs at v0.34.0)", () => {
    const pruned = LIGHT_PRUNED_DESIGNS.map((d) => d.slug);
    for (const slug of pruned) expect(LIGHT_KEPT_DESIGNS).not.toContain(slug);
    expect(LIGHT_KEPT_DESIGNS.length + pruned.length).toBe(26);
  });

  it("every pruned design dir is in the excluded-path list", () => {
    for (const { slug } of LIGHT_PRUNED_DESIGNS) {
      expect(LIGHT_EXCLUDED_PATHS).toContain(`designs/${slug}`);
    }
  });

  it("never excludes a kept design or a core module path", () => {
    for (const rel of LIGHT_EXCLUDED_PATHS) {
      for (const kept of LIGHT_KEPT_DESIGNS) {
        expect(rel).not.toBe(`designs/${kept}`);
      }
      // Spot-guard: the audit's CORE clusters must never appear here.
      expect(rel.startsWith("lib/builder")).toBe(false);
      expect(rel.startsWith("lib/tools")).toBe(false);
      expect(rel.startsWith("lib/genome")).toBe(false);
      expect(rel.startsWith("lib/search")).toBe(false); // dynamic-import coupled — kept
      expect(rel.startsWith("prisma")).toBe(false);
    }
  });
});

describe("pruneDesignIndexSource", () => {
  const pruned = [
    { slug: "saas-dark", exportName: "saasDarkDesign" },
    { slug: "atelier", exportName: "atelierDesign" },
    { slug: "hoptify", exportName: "hoptifyDesign" },
    { slug: "editorial-ink", exportName: "editorialInkDesign" },
  ];

  it("removes import lines and map entries (quoted + bare-ident keys)", () => {
    const { src, missing } = pruneDesignIndexSource(INDEX_SRC, pruned);
    expect(missing).toEqual([]);
    expect(src).not.toContain("saasDarkDesign");
    expect(src).not.toContain("atelierDesign");
    expect(src).not.toContain("hoptifyDesign");
    expect(src).not.toContain("editorialInkDesign");
    // kept designs untouched
    expect(src).toContain(`import { auroraSiteDesign } from "./aurora-site";`);
    expect(src).toContain(`"aurora-shop": auroraShopDesign,`);
    expect(src).toContain("studio: studioDesign,");
    expect(src).toContain("fable: fableDesign,");
    expect(src).toContain("export function getDesign");
  });

  it("reports slugs it could not find without failing", () => {
    const { src, missing } = pruneDesignIndexSource(INDEX_SRC, [
      { slug: "not-a-design", exportName: "notADesign" },
    ]);
    expect(missing).toEqual(["not-a-design"]);
    expect(src).toBe(INDEX_SRC);
  });
});

describe("pruneDesignOptionsSource", () => {
  it("removes DESIGN_OPTIONS entries and mixable-set lines", () => {
    const { src, missing } = pruneDesignOptionsSource(OPTIONS_SRC, ["saas-dark", "hoptify"]);
    expect(missing).toEqual([]);
    expect(src).not.toContain(`slug: "saas-dark"`);
    expect(src).not.toContain(`slug: "hoptify"`);
    expect(src).not.toContain(`"hoptify",`); // removed from MIXABLE_DESIGN_SLUGS
    // kept entries + structure intact
    expect(src).toContain(`slug: "aurora-site"`);
    expect(src).toContain(`slug: "fable"`);
    expect(src).toContain(`"stillwater",`);
    expect(src).toContain("];");
    expect(src).toContain("]);");
  });

  it("reports unknown slugs without modifying the source", () => {
    const { src, missing } = pruneDesignOptionsSource(OPTIONS_SRC, ["nope"]);
    expect(missing).toEqual(["nope"]);
    expect(src).toBe(OPTIONS_SRC);
  });
});

describe("pruneDesignMotifsSource", () => {
  const MOTIFS_SRC = `export const DESIGN_MOTIFS: Record<string, string> = {
  apex: "orbit-mark",
  engineered: "lattice-mark",
  nocturne: "constellation-mark",
  "editorial-ink": "prism-mark",
  fable: "moth-illustration",
};
`;
  it("removes pruned keys (bare + quoted), keeps curated keys", () => {
    const out = pruneDesignMotifsSource(MOTIFS_SRC, ["engineered", "nocturne", "editorial-ink"]);
    expect(out).not.toContain("engineered");
    expect(out).not.toContain("nocturne");
    expect(out).not.toContain("editorial-ink");
    expect(out).toContain(`apex: "orbit-mark",`);
    expect(out).toContain(`fable: "moth-illustration",`);
  });
});

describe("pruneWebMcpFromLayoutSource", () => {
  it("removes exactly the import + mount lines", () => {
    const out = pruneWebMcpFromLayoutSource(LAYOUT_SRC);
    expect(out).not.toContain("WebMcpRegistrar");
    expect(out).toContain("VoiceShopMount"); // neighbours untouched
    expect(out).toContain("WelcomeGuide");
    expect(out).toContain("<main>x</main>");
    expect(LAYOUT_SRC.split("\n").length - out.split("\n").length).toBe(2);
  });
});

describe("prunePackageJsonForLight", () => {
  const PKG_SRC = JSON.stringify(
    {
      name: "cartwright",
      scripts: { dev: "next dev", "db:setup": "tsx scripts/db-setup.ts" },
      dependencies: {
        "@ai-sdk/openai": "^3.0.65",
        "@ai-sdk/openai-compatible": "^2.0.48",
        next: "16.2.6",
      },
      devDependencies: {
        "fast-check": "^4.8.0",
        "ts-node": "^10.9.2",
        typescript: "^5.7.0",
      },
    },
    null,
    2,
  ) + "\n";

  it("removes exactly the proven-orphan deps, keeps everything else", () => {
    const { src, missing } = prunePackageJsonForLight(PKG_SRC);
    expect(missing).toEqual([]);
    const pkg = JSON.parse(src);
    expect(pkg.dependencies["@ai-sdk/openai"]).toBeUndefined();
    expect(pkg.devDependencies["fast-check"]).toBeUndefined();
    expect(pkg.devDependencies["ts-node"]).toBeUndefined();
    // near-miss names + the rest of the tree are untouched
    expect(pkg.dependencies["@ai-sdk/openai-compatible"]).toBe("^2.0.48");
    expect(pkg.dependencies.next).toBe("16.2.6");
    expect(pkg.devDependencies.typescript).toBe("^5.7.0");
    expect(pkg.scripts["db:setup"]).toBe("tsx scripts/db-setup.ts");
    // keeps the repo's package.json formatting convention
    expect(src.endsWith("\n")).toBe(true);
  });

  it("reports deps the template no longer has without failing", () => {
    const slim = JSON.stringify({ dependencies: { next: "16.2.6" } });
    const { src, missing } = prunePackageJsonForLight(slim);
    expect(missing).toEqual([
      ...LIGHT_PRUNED_DEPENDENCIES,
      ...LIGHT_PRUNED_DEV_DEPENDENCIES,
    ]);
    expect(JSON.parse(src).dependencies.next).toBe("16.2.6");
  });

  it("leaves invalid JSON untouched (fail-soft)", () => {
    const broken = "{ not json";
    const { src, missing } = prunePackageJsonForLight(broken);
    expect(src).toBe(broken);
    expect(missing.length).toBeGreaterThan(0);
  });
});

describe("patchBrandConfigForLightContent", () => {
  it("flips only the newsletter flag", () => {
    const out = patchBrandConfigForLightContent(BRAND_SRC);
    expect(out).toContain("newsletter: false");
    expect(out).toContain("aiStylist: true");
    expect(out).toContain("mcpPublic: true");
  });
});

describe("applyLightProfile (filesystem)", () => {
  it("removes excluded paths, applies codemods, writes the profile marker", () => {
    const dir = mkdtempSync(join(tmpdir(), "cw-light-"));
    try {
      // Minimal scaffold with one representative of each prune category.
      const files: Record<string, string> = {
        "lib/a2a/jwt.ts": "export {};",
        "lib/ucp/oauth.ts": "export {};",
        "lib/webmcp/paths.ts": "export {};",
        "lib/hoptify/migrate.ts": "export {};",
        "components/WebMcpRegistrar.tsx": "export default function X() { return null; }",
        "designs/saas-dark/index.ts": "export const saasDarkDesign = {};",
        "designs/aurora-site/index.ts": "export const auroraSiteDesign = {};",
        "designs/index.ts": INDEX_SRC,
        "designs/options.ts": OPTIONS_SRC,
        "app/[locale]/layout.tsx": LAYOUT_SRC,
        "brand.config.ts": BRAND_SRC,
        "tests/unit/ucp-oauth.test.ts": "// pruned",
        "package.json": JSON.stringify({
          dependencies: { "@ai-sdk/openai": "^3.0.65", next: "16.2.6" },
          devDependencies: { "fast-check": "^4.8.0", "ts-node": "^10.9.2" },
        }),
      };
      for (const [rel, content] of Object.entries(files)) {
        mkdirSync(join(dir, dirname(rel)), { recursive: true });
        writeFileSync(join(dir, rel), content);
      }

      const report = applyLightProfile(dir);

      // removed
      expect(existsSync(join(dir, "lib/a2a"))).toBe(false);
      expect(existsSync(join(dir, "lib/ucp"))).toBe(false);
      expect(existsSync(join(dir, "lib/webmcp"))).toBe(false);
      expect(existsSync(join(dir, "lib/hoptify"))).toBe(false);
      expect(existsSync(join(dir, "components/WebMcpRegistrar.tsx"))).toBe(false);
      expect(existsSync(join(dir, "designs/saas-dark"))).toBe(false);
      expect(existsSync(join(dir, "tests/unit/ucp-oauth.test.ts"))).toBe(false);
      // kept
      expect(existsSync(join(dir, "designs/aurora-site/index.ts"))).toBe(true);

      // codemods applied
      const idx = readFileSync(join(dir, "designs/index.ts"), "utf8");
      expect(idx).not.toContain("saasDarkDesign");
      const layout = readFileSync(join(dir, "app/[locale]/layout.tsx"), "utf8");
      expect(layout).not.toContain("WebMcpRegistrar");
      const brand = readFileSync(join(dir, "brand.config.ts"), "utf8");
      expect(brand).toContain("newsletter: false");
      const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
      expect(pkg.dependencies["@ai-sdk/openai"]).toBeUndefined();
      expect(pkg.devDependencies["fast-check"]).toBeUndefined();
      expect(pkg.devDependencies["ts-node"]).toBeUndefined();
      expect(pkg.dependencies.next).toBe("16.2.6");

      // marker
      const marker = JSON.parse(readFileSync(join(dir, ".cartwright/profile.json"), "utf8"));
      expect(marker.profile).toBe("light");
      expect(marker.removedPaths ?? marker.excludedPaths).toContain("lib/a2a");
      expect(marker.prunedDependencies).toContain("@ai-sdk/openai");
      expect(report.removedPaths).toContain("lib/a2a");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("is fail-soft on an empty directory (warnings, no throw)", () => {
    const dir = mkdtempSync(join(tmpdir(), "cw-light-empty-"));
    try {
      const report = applyLightProfile(dir);
      expect(report.removedPaths).toEqual([]);
      expect(report.warnings.length).toBeGreaterThan(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("lightProfileNote", () => {
  it("leads with the one-sentence pitch and the recovery paths", () => {
    const note = lightProfileNote();
    expect(note).toContain("a real site: design, database, backend — live in minutes");
    expect(note).toContain("cartwright design install");
    expect(note).toContain("--profile full");
  });
});
