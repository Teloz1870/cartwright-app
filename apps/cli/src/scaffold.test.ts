import { describe, it, expect } from "vitest";
import { titleCase, patchBrandConfigContent } from "./scaffold";

describe("scaffold helpers", () => {
  it("titleCase laver projektnavn til storeName", () => {
    expect(titleCase("nord-kaffe")).toBe("Nord Kaffe");
  });

  it("patchBrandConfigContent erstatter storeName og storeSlug", () => {
    const input = `{ storeName: "Demo", storeSlug: "demo" }`;
    const out = patchBrandConfigContent(input, "min-shop");
    expect(out).toContain(`storeName: "Min Shop"`);
    expect(out).toContain(`storeSlug: "min-shop"`);
  });
});
