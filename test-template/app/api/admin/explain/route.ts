import { NextRequest } from "next/server";
import { streamText } from "ai";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { adminChatRateLimiter, rateLimitResponse } from "@/lib/rate-limit";
import { chatModelResolved } from "@/lib/ai/client";
import { buildExplainPrompt, type ExplainContextType } from "@/lib/ai/prompts/explain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Local-AI plan Fase 2.1: 30s er rigeligt for single-turn explain
// (~200-400 token prompt, ~80-150 token svar). Lokal Gemma kan tage 5-15s
// første gang efter idle, ellers <3s. Cloud Anthropic ~1-2s.
export const maxDuration = 30;

const VALID_CONTEXT_TYPES: ExplainContextType[] = [
  "dns-check-fail",
  "setup-item-missing",
  "error-message",
  "field-help",
];

const bodySchema = z.object({
  contextType: z.enum(VALID_CONTEXT_TYPES as [ExplainContextType, ...ExplainContextType[]]),
  contextData: z.unknown(),
});

/**
 * Local-AI plan Fase 2.1: "Forklar med AI" endpoint.
 *
 * Single-turn, no-tools, streaming. Bruges af ExplainButton overalt i admin
 * (EmailDomainPanel, SetupRunbook, ResendKeyForm m.fl.) til at give kunden
 * en klar dansk forklaring på fejl/warnings uden at navigere væk.
 *
 * Hvorfor det er det højest-leverage Niveau-A feature: Gemma 3 12B shiner
 * på ikke-tool conversational explain. Det er den prompt-type hvor local
 * AI giver subjektivt samme kvalitet som cloud (især når context er fokuseret),
 * og det er en feature der ellers ville kræve enten cloud-AI eller hardcoded
 * help-tekst i UI'et.
 */
export async function POST(request: NextRequest) {
  // Auth — kun admin
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate-limit per admin (genbruger samme limiter som /api/admin/chat for
  // simpel "hvor meget AI-kald pr. min" reasoning)
  const rl = adminChatRateLimiter.check(session.user.id);
  if (!rl.allowed) {
    return rateLimitResponse(rl);
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid body" },
      { status: 400 },
    );
  }

  let resolved: Awaited<ReturnType<typeof chatModelResolved>>;
  try {
    resolved = await chatModelResolved("chat");
  } catch (err) {
    return Response.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "AI-provider ikke konfigureret. Gå til /admin/integrations.",
      },
      { status: 503 },
    );
  }

  const { system, user } = buildExplainPrompt({
    contextType: parsed.data.contextType,
    contextData: parsed.data.contextData,
  });

  const result = streamText({
    model: resolved.handle,
    system,
    prompt: user,
    onError({ error }) {
      console.error(
        `[admin/explain] streamText error (provider=${resolved.provider} model=${resolved.model}):`,
        error,
      );
    },
  });

  // Returnerer plain-text stream — klienten læser progressivt og viser i popover.
  // Bruger ikke toUIMessageStreamResponse() fordi vi ikke har tool-calls.
  return result.toTextStreamResponse();
}
