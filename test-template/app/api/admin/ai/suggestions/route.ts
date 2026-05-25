import { auth } from "@/lib/auth";
import { getSuggestedFirstMessages } from "@/lib/ai/copilot-context";
import { chatModelResolved } from "@/lib/ai/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Local-AI plan Fase 2.2: returnér state-aware suggested first messages +
 * current provider/model til AdminChatPanel header badge.
 *
 * AdminChatPanel kan opt-in til at fetche denne ved mount og rende chips
 * over chat-input'et i tom-state. Når admin har sendt første message,
 * forsvinder chips.
 *
 * Eksempel response:
 *   {
 *     "provider": "local",
 *     "model": "gemma4:e4b",
 *     "suggestions": [
 *       { "id": "what-missing", "label": "Hvad mangler i mit setup?", "prompt": "..." },
 *       { "id": "verify-setup", "label": "Verificér mit setup", "prompt": "..." }
 *     ]
 *   }
 */
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let provider: string | null = null;
  let model: string | null = null;
  try {
    const resolved = await chatModelResolved("chat");
    provider = resolved.provider;
    model = resolved.model;
  } catch {
    // Provider ikke konfigureret — UI kan stadig vise suggestions, bare uden badge
  }

  const suggestions = await getSuggestedFirstMessages();

  return Response.json({ provider, model, suggestions });
}
