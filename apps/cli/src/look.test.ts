import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  LOOK_SCHEMA_ID,
  LOOK_DB_SCRIPT,
  parseLook,
  fetchLook,
  stageLookSkin,
  lookHasDbParts,
  type PublicLook,
} from "./look.js";

const VALID_PALETTE = {
  accent: "#c96f4a",
  accentDeep: "#9a4f2e",
  cream: "#faf6f0",
  sand: "#e8dccb",
  ink: "#2b2118",
  muted: "#8a7a68",
};

const VALID_LOOK = {
  schema: LOOK_SCHEMA_ID,
  name: "Northbound look",
  skin: "fable",
  palette: VALID_PALETTE,
  scene: "aurora",
  chrome: { headerKey: "minimal-header", footerKey: "slim-footer" },
};

describe("parseLook", () => {
  it("accepts a minimal look (schema + skin only)", () => {
    const r = parseLook(JSON.stringify({ schema: LOOK_SCHEMA_ID, skin: "fable" }));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.look.skin).toBe("fable");
      expect(r.look.palette).toBeUndefined();
      expect(lookHasDbParts(r.look)).toBe(false);
    }
  });

  it("accepts a full public look and keeps every cosmetic part", () => {
    const r = parseLook(JSON.stringify(VALID_LOOK));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.look.name).toBe("Northbound look");
      expect(r.look.palette).toEqual(VALID_PALETTE);
      expect(r.look.scene).toBe("aurora");
      expect(r.look.chrome).toEqual({ headerKey: "minimal-header", footerKey: "slim-footer" });
      expect(lookHasDbParts(r.look)).toBe(true);
    }
  });

  it("ignores private composition fields (voice/homepageLayout) — sharing boundary", () => {
    const r = parseLook(
      JSON.stringify({
        ...VALID_LOOK,
        voice: { genomeOverrides: { headline: "secret copy" } },
        homepageLayout: { sections: [] },
      }),
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect("voice" in r.look).toBe(false);
      expect("homepageLayout" in r.look).toBe(false);
    }
  });

  it("rejects non-JSON", () => {
    const r = parseLook("<html>not json</html>");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("not valid JSON");
  });

  it("rejects a wrong schema id", () => {
    const r = parseLook(JSON.stringify({ schema: "cartwright-design-v1", skin: "fable" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain(LOOK_SCHEMA_ID);
  });

  it("rejects a missing skin", () => {
    const r = parseLook(JSON.stringify({ schema: LOOK_SCHEMA_ID, name: "No skin" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('"skin" is missing');
  });

  it("rejects a non-slug skin (codemod/SQL safety)", () => {
    const r = parseLook(
      JSON.stringify({ schema: LOOK_SCHEMA_ID, skin: 'x" as never; evil: "1' }),
    );
    expect(r.ok).toBe(false);
  });

  it("rejects a palette with a missing or non-hex color (whole look, never half-applied)", () => {
    const missing = parseLook(
      JSON.stringify({
        schema: LOOK_SCHEMA_ID,
        skin: "fable",
        palette: { ...VALID_PALETTE, ink: undefined },
      }),
    );
    expect(missing.ok).toBe(false);

    const bad = parseLook(
      JSON.stringify({
        schema: LOOK_SCHEMA_ID,
        skin: "fable",
        palette: { ...VALID_PALETTE, accent: "tomato" },
      }),
    );
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error).toContain("palette.accent");
  });

  it("rejects a malformed scene / chrome key", () => {
    expect(
      parseLook(JSON.stringify({ schema: LOOK_SCHEMA_ID, skin: "fable", scene: 42 })).ok,
    ).toBe(false);
    expect(
      parseLook(
        JSON.stringify({
          schema: LOOK_SCHEMA_ID,
          skin: "fable",
          chrome: { headerKey: "DROP TABLE;" },
        }),
      ).ok,
    ).toBe(false);
  });

  it("drops an empty chrome object instead of writing chromeJson", () => {
    const r = parseLook(JSON.stringify({ schema: LOOK_SCHEMA_ID, skin: "fable", chrome: {} }));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.look.chrome).toBeUndefined();
  });
});

describe("fetchLook", () => {
  const okResponse = (body: unknown): Response =>
    new Response(JSON.stringify(body), { status: 200 });

  it("fetches and validates a look", async () => {
    const r = await fetchLook("https://example.com/api/look", async () =>
      okResponse(VALID_LOOK),
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.look.skin).toBe("fable");
  });

  it("fails soft on a network error", async () => {
    const r = await fetchLook("https://example.com/api/look", async () => {
      throw new TypeError("fetch failed");
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("could not be reached");
  });

  it("fails soft on a timeout", async () => {
    const r = await fetchLook("https://example.com/api/look", async () => {
      const err = new Error("timed out");
      err.name = "TimeoutError";
      throw err;
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("did not answer");
  });

  it("fails soft on HTTP 404 with the lookSharing hint", async () => {
    const r = await fetchLook(
      "https://example.com/api/look",
      async () => new Response("Not found", { status: 404 }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toContain("404");
      expect(r.error).toContain("lookSharing");
    }
  });

  it("fails soft on an invalid or non-http URL", async () => {
    expect((await fetchLook("not a url")).ok).toBe(false);
    expect((await fetchLook("ftp://example.com/look.json")).ok).toBe(false);
  });

  it("fails soft on a non-look JSON body", async () => {
    const r = await fetchLook("https://example.com/api/look", async () =>
      okResponse({ hello: "world" }),
    );
    expect(r.ok).toBe(false);
  });
});

describe("stageLookSkin", () => {
  const BRAND_CONFIG = `export const brand = {
  industryTemplate: "saas",
  designSlug: undefined as string | undefined,
  mode: "website" as "website" | "webshop" | "agent-marketplace",
};
`;
  const look: PublicLook = { schema: LOOK_SCHEMA_ID, skin: "fable" };

  it("sets designSlug when the scaffold ships the design", () => {
    const dir = mkdtempSync(join(tmpdir(), "cw-look-"));
    try {
      mkdirSync(join(dir, "designs", "fable"), { recursive: true });
      writeFileSync(join(dir, "brand.config.ts"), BRAND_CONFIG);

      const r = stageLookSkin(dir, look);

      expect(r.applied).toBe(true);
      expect(r.warnings).toEqual([]);
      expect(readFileSync(join(dir, "brand.config.ts"), "utf8")).toContain(
        `designSlug: "fable" as string | undefined`,
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("skips the skin with the re-install hint when the design pack is pruned (light profile)", () => {
    const dir = mkdtempSync(join(tmpdir(), "cw-look-"));
    try {
      mkdirSync(join(dir, "designs"), { recursive: true }); // no designs/fable
      writeFileSync(join(dir, "brand.config.ts"), BRAND_CONFIG);

      const r = stageLookSkin(dir, look);

      expect(r.applied).toBe(false);
      expect(r.warnings.join("\n")).toContain("cartwright design install fable");
      expect(r.warnings.join("\n")).toContain("--profile full");
      // Scaffold unchanged — the fail-soft contract.
      expect(readFileSync(join(dir, "brand.config.ts"), "utf8")).toBe(BRAND_CONFIG);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("warns + skips on template drift (no designSlug anchor)", () => {
    const dir = mkdtempSync(join(tmpdir(), "cw-look-"));
    try {
      mkdirSync(join(dir, "designs", "fable"), { recursive: true });
      writeFileSync(join(dir, "brand.config.ts"), `export const brand = { mode: "website" };\n`);

      const r = stageLookSkin(dir, look);

      expect(r.applied).toBe(false);
      expect(r.warnings.join("\n")).toContain("anchor not found");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("LOOK_DB_SCRIPT", () => {
  it("is parameterized and writes the applyComposition field formats", () => {
    // No string interpolation of look data into SQL — args arrays only.
    expect(LOOK_DB_SCRIPT).toContain("args");
    expect(LOOK_DB_SCRIPT).not.toContain("${look.");
    // The three BrandingSettings blobs the engine's composition.apply writes.
    expect(LOOK_DB_SCRIPT).toContain("themeJson = ?");
    expect(LOOK_DB_SCRIPT).toContain("chromeJson = ?");
    expect(LOOK_DB_SCRIPT).toContain("threeDConfigJson = ?");
    // Scene merges over the existing 3D config instead of clobbering it.
    expect(LOOK_DB_SCRIPT).toContain("...existing, scene: look.scene");
    // Look data travels via env, never inlined into the script source.
    expect(LOOK_DB_SCRIPT).toContain("CARTWRIGHT_LOOK_JSON");
  });
});
