import { describe, it, expect, vi } from "vitest";
import { generateJson, validateKey } from "./llm";

describe("generateJson", () => {
  it("parser JSON ud af Gemini-svaret", async () => {
    const fakeBody = {
      candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }],
    };
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(fakeBody), { status: 200 })));
    const out = await generateJson("test-key", "byg noget", { type: "object" });
    expect(out).toEqual({ ok: true });
  });

  it("kaster ved HTTP-fejl", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nej", { status: 429 })));
    await expect(generateJson("k", "p", {})).rejects.toThrow(/429|rate/i);
  });
});

describe("validateKey", () => {
  it("returnerer true hvis auth virker", async () => {
    const fakeBody = {
      candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }],
    };
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(fakeBody), { status: 200 })));
    const out = await validateKey("test-key");
    expect(out).toBe(true);
  });

  it("returnerer false hvis unauthorized (400 / 401 / 403)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("Bad Request", { status: 400 })));
    const out = await validateKey("bad-key");
    expect(out).toBe(false);
  });
});
