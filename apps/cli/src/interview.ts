import { generateJson } from "./llm.js";
import { type ShopBrief } from "./brief.js";

export interface InterviewDeps {
  apiKey: string;
  initialPrompt: string;
  askUser: (question: string) => Promise<string>;
  logMsg: (msg: string) => void;
}

const interviewSchema = {
  type: "object",
  properties: {
    isComplete: { type: "boolean" },
    nextQuestion: { type: "string", description: "The next question to ask if not complete." },
    brief: { 
      type: "object",
      description: "The complete shop brief. Only provided when isComplete is true.",
      properties: {
        storeName: { type: "string" },
        slug: { type: "string" },
        tagline: { type: "string" },
        sells: { type: "string" },
        audience: { type: "string" },
        tone: { type: "string" },
        country: { type: "string" },
        currency: { type: "string" },
        palette: {
          type: "object",
          properties: {
            primary: { type: "string" },
            background: { type: "string" },
          },
        },
        categories: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              slug: { type: "string" },
            },
          },
        },
        products: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              categorySlug: { type: "string" },
              priceMinor: { type: "integer" },
              blurb: { type: "string" },
            },
          },
        },
      }
    }
  },
  required: ["isComplete", "nextQuestion"]
};

export async function runInterview(deps: InterviewDeps): Promise<ShopBrief> {
  const history: string[] = [];
  history.push(`The user's initial request: ${deps.initialPrompt}`);

  const systemInstructions = `
You are an e-commerce expert. Your job is to gather enough information to build a 'ShopBrief'.
Ask ONE question at a time to fill the missing fields — always in the same language the user writes in.
Once you have enough to fill in the rest competently (or the user asks you to fill in the rest yourself), set isComplete = true and complete the brief object fully.
`;

  while (true) {
    const prompt = `${systemInstructions}\n\nConversation history:\n${history.join("\n")}`;

    deps.logMsg("Thinking...");
    const res = await generateJson(deps.apiKey, prompt, interviewSchema) as any;

    if (res.isComplete && res.brief) {
      return res.brief as ShopBrief;
    }

    const answer = await deps.askUser(res.nextQuestion);
    history.push(`AI: ${res.nextQuestion}`);
    history.push(`User: ${answer}`);
  }
}
