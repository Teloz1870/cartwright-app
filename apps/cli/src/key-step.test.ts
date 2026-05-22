import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { resolveKeyMode } from "./key-step";
import * as llm from "./llm";

vi.mock("./llm", () => ({
  validateKey: vi.fn(),
}));

describe("resolveKeyMode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  it("returnerer key hvis valid env key", async () => {
    process.env.GEMINI_API_KEY = "env-key";
    vi.mocked(llm.validateKey).mockResolvedValue(true);
    const res = await resolveKeyMode({
      getEnvKey: () => process.env.GEMINI_API_KEY,
      promptKey: async () => "prompt-key",
      confirmManual: async () => false,
    });
    expect(res).toEqual({ type: "key", key: "env-key" });
  });

  it("prompter hvis invalid env key og returnerer ny key", async () => {
    process.env.GEMINI_API_KEY = "bad-env-key";
    vi.mocked(llm.validateKey).mockResolvedValueOnce(false); // env fejler
    vi.mocked(llm.validateKey).mockResolvedValueOnce(true); // prompt virker

    const res = await resolveKeyMode({
      getEnvKey: () => process.env.GEMINI_API_KEY,
      promptKey: async () => "prompt-key",
      confirmManual: async () => false,
    });
    
    expect(res).toEqual({ type: "key", key: "prompt-key" });
    expect(llm.validateKey).toHaveBeenCalledTimes(2);
  });

  it("falder tilbage til manual hvis prompt er tomt", async () => {
    process.env.GEMINI_API_KEY = "bad-env-key";
    vi.mocked(llm.validateKey).mockResolvedValueOnce(false);

    const res = await resolveKeyMode({
      getEnvKey: () => process.env.GEMINI_API_KEY,
      promptKey: async () => "",
      confirmManual: async () => true,
    });
    
    expect(res).toEqual({ type: "manual" });
  });

  it("aborts hvis bruger afviser manual mode", async () => {
    vi.mocked(llm.validateKey).mockResolvedValueOnce(false);
    await expect(resolveKeyMode({
      getEnvKey: () => undefined,
      promptKey: async () => "",
      confirmManual: async () => false,
    })).rejects.toThrow(/abort/i);
  });
});
