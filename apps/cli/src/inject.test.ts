import { describe, it, expect, vi, beforeEach } from "vitest";
import { injectBriefFiles } from "./inject";
import * as fs from "node:fs";
import { type ShopBrief } from "./brief";

vi.mock("node:fs", () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

describe("injectBriefFiles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opretter mapper og skriver filer", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const brief: ShopBrief = {
      storeName: "Test",
      slug: "test-slug",
      tagline: "Test tag",
      sells: "Ting",
      audience: "Folk",
      tone: "Sjov",
      country: "DK",
      currency: "DKK",
      palette: { primary: "#112233", background: "#ffeedd" },
      categories: [],
      products: []
    };

    injectBriefFiles("/tmp/target", brief);

    expect(fs.mkdirSync).toHaveBeenCalledTimes(3);
    expect(fs.writeFileSync).toHaveBeenCalledTimes(3);

    const writeCalls = vi.mocked(fs.writeFileSync).mock.calls;
    expect(writeCalls[0][0] as string).toContain("themes");
    expect(writeCalls[1][0] as string).toContain("prompts");
    expect(writeCalls[2][0] as string).toContain("industry-templates");
  });
});
