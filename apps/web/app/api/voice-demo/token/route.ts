import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { GoogleGenAI } from "@google/genai";
import { checkBotId } from "botid/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

/**
 * Voice-plan Fase 3.1: token-endpoint til cartwright.app's forside-demo.
 *
 * Adskilt fra test-template's /api/live/token fordi:
 *   - Demo'en bruger Cartwright's egen Gemini-key (env), ikke per-shop config
 *   - Hard-coded demo-catalog (DEMO_PRODUCTS) — ingen DB
 *   - Strammere caps: 30s session, ingen vision, kun read-tools
 *   - Per-IP rate-limit (1 demo per IP per 5 min)
 *
 * Gates:
 *   1. VOICE_DEMO_ENABLED=1 i env (defaults til off så vi kan ship docs uden
 *      at brænde Google-cost ned)
 *   2. GOOGLE_GENAI_API_KEY skal være sat
 *   3. BotID check i production
 *   4. Per-IP rate-limit via in-memory Map (reset per deploy; godt nok for v1)
 */

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 min
const recentAttempts = new Map<string, number>();

export async function POST(request: NextRequest) {
  if (process.env.VOICE_DEMO_ENABLED !== "1") {
    return Response.json(
      { error: "Demo not available right now." },
      { status: 503 },
    );
  }

  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Demo not configured (missing Gemini key)." },
      { status: 503 },
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";

  if (process.env.VERCEL_ENV === "production") {
    try {
      const verification = await checkBotId();
      if (verification.isBot) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
    } catch {
      // BotID-fejl må ikke blokere reale brugere
    }
  }

  // Per-IP rate limit — soft; in-memory.
  const now = Date.now();
  const last = recentAttempts.get(ip);
  if (last && now - last < RATE_LIMIT_WINDOW_MS) {
    const retryAfterSec = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - last)) / 1000);
    return Response.json(
      {
        error:
          "Try again in a minute — keeping the demo cost down with a per-IP limit.",
        retryAfterSec,
      },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
    );
  }
  recentAttempts.set(ip, now);
  cleanupOldAttempts();

  // Mint token. 30s total session lifetime; the same key Google bills against
  // is Cartwright's own (separate from any per-shop key).
  const expireTime = new Date(now + 60 * 1000).toISOString();
  const newSessionExpireTime = new Date(now + 30 * 1000).toISOString();
  const sessionId = randomUUID();

  try {
    const ai = new GoogleGenAI({ apiKey });
    const token = await (
      ai as unknown as {
        authTokens: {
          create: (input: {
            config: Record<string, unknown>;
          }) => Promise<{ name: string }>;
        };
      }
    ).authTokens.create({
      config: {
        uses: 1,
        expireTime,
        newSessionExpireTime,
        httpOptions: { apiVersion: "v1alpha" },
        liveConnectConstraints: {
          model: "models/gemini-2.5-flash-live",
          config: {
            responseModalities: ["AUDIO"],
            systemInstruction: { parts: [{ text: DEMO_SYSTEM_PROMPT }] },
            tools: [{ functionDeclarations: DEMO_TOOL_DECLARATIONS }],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
            },
          },
        },
        lockAdditionalFields: [
          "tools",
          "systemInstruction",
          "responseModalities",
        ],
      },
    });

    return Response.json({
      token: token.name,
      sessionId,
      model: "gemini-2.5-flash-live",
      expiresAt: newSessionExpireTime,
    });
  } catch (err) {
    console.error("[voice-demo/token] mint failed:", err);
    return Response.json(
      {
        error:
          err instanceof Error ? err.message : "Demo voice failed to start.",
      },
      { status: 502 },
    );
  }
}

function cleanupOldAttempts(): void {
  const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
  for (const [ip, ts] of recentAttempts.entries()) {
    if (ts < cutoff) recentAttempts.delete(ip);
  }
}

const DEMO_SYSTEM_PROMPT = [
  "You are the voice assistant for the Cartwright Demo Store — a tiny 12-item catalog used to demonstrate voice + vision shopping.",
  "Speak naturally. NEVER read markdown, bullets, or URLs aloud.",
  "Use only the products_search and products_get tools — there's no cart, checkout, or personal data in this demo.",
  "If the customer asks for anything beyond browsing the catalog (place an order, sign up, etc.), reply that this is a demo and they should run `npx create-cartwright@latest` to get the full shop.",
  "Sessions are 30 seconds. If you sense time is running out, suggest one product they'd like and wrap up warmly.",
  "Default to English. Match the customer's language if they speak something else.",
].join("\n");

const DEMO_TOOL_DECLARATIONS = [
  {
    name: "products_search",
    description:
      "Search the 12-item Cartwright Demo Store catalog for items matching a free-text query (e.g. 'coffee', 'lamp', 'gift under 200 kr').",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Free-text query in any language" },
      },
      required: ["query"],
    },
  },
  {
    name: "products_get",
    description:
      "Get the full details of a specific demo product by id (returned in products_search results).",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "Product id (e.g. 'demo-coffee-01')" },
      },
      required: ["id"],
    },
  },
];
