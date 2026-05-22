import { describe, it, expect, vi, beforeEach } from "vitest";
import { runInterview } from "./interview";
import * as llm from "./llm";

vi.mock("./llm", () => ({
  generateJson: vi.fn(),
}));

describe("runInterview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returnerer ShopBrief når isComplete er true", async () => {
    vi.mocked(llm.generateJson).mockResolvedValueOnce({
      isComplete: true,
      nextQuestion: "",
      brief: { storeName: "Test", slug: "test" } // For testens skyld er validation løs her
    });

    const res = await runInterview({
      apiKey: "key",
      initialPrompt: "Jeg vil lave en kaffeshop",
      askUser: async () => "svar",
      logMsg: () => {}
    });

    expect(res).toEqual({ storeName: "Test", slug: "test" });
  });

  it("stiller spørgsmål og opsamler svar indtil isComplete", async () => {
    vi.mocked(llm.generateJson)
      .mockResolvedValueOnce({
        isComplete: false,
        nextQuestion: "Hvilken type kaffe?",
      })
      .mockResolvedValueOnce({
        isComplete: true,
        nextQuestion: "",
        brief: { storeName: "Kaffe", slug: "kaffe" }
      });

    const askUser = vi.fn().mockResolvedValueOnce("Specialkaffe");
    const res = await runInterview({
      apiKey: "key",
      initialPrompt: "kaffe",
      askUser,
      logMsg: () => {}
    });

    expect(askUser).toHaveBeenCalledWith("Hvilken type kaffe?");
    expect(res).toEqual({ storeName: "Kaffe", slug: "kaffe" });
    
    // Check at prompten i 2. kald indeholder brugerens svar
    const secondCallArg = vi.mocked(llm.generateJson).mock.calls[1][1] as string;
    expect(secondCallArg).toContain("Specialkaffe");
  });
});
