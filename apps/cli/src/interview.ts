import { generateJson } from "./llm";
import { type ShopBrief } from "./brief";

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
  history.push(`Brugerens indledende forespørgsel: ${deps.initialPrompt}`);

  const systemInstructions = `
Du er en e-commerce ekspert. Din opgave er at indsamle nok information til at bygge et 'ShopBrief'.
Stil ét spørgsmål ad gangen for at udfylde de manglende felter.
Når du har nok info til at gætte resten kompetent (eller brugeren beder dig om at udfylde resten selv), så sæt isComplete = true og udfyld brief-objektet komplet.
`;

  while (true) {
    const prompt = `${systemInstructions}\n\nSamtalehistorik:\n${history.join("\n")}`;
    
    deps.logMsg("Tænker...");
    const res = await generateJson(deps.apiKey, prompt, interviewSchema) as any;

    if (res.isComplete && res.brief) {
      return res.brief as ShopBrief;
    }

    const answer = await deps.askUser(res.nextQuestion);
    history.push(`AI: ${res.nextQuestion}`);
    history.push(`Bruger: ${answer}`);
  }
}
