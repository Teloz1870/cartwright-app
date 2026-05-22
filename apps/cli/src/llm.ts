const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export async function validateKey(key: string): Promise<boolean> {
  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Hello" }] }],
      }),
    });
    if (!res.ok) {
      if (res.status === 400 || res.status === 401 || res.status === 403) {
        return false;
      }
      throw new Error(`Unexpected status ${res.status}`);
    }
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes("status")) {
      throw error;
    }
    return false;
  }
}

export async function generateJson(key: string, prompt: string, jsonSchema: unknown): Promise<unknown> {
  const res = await fetch(`${GEMINI_API_URL}?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: jsonSchema,
      },
    }),
  });

  if (!res.ok) {
    if (res.status === 429) {
      throw new Error("HTTP 429: Rate limit exceeded for Gemini API.");
    }
    throw new Error(`HTTP ${res.status}: Failed to generate content.`);
  }

  const data = (await res.json()) as any;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("No text content in Gemini response.");
  }

  return JSON.parse(text);
}
