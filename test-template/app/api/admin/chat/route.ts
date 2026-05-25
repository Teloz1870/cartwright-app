import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { streamText, tool, stepCountIs, convertToModelMessages } from "ai";
import { z } from "zod";
import {
  chatModelResolved,
  filterToolsForCapability,
  ADMIN_TOOL_ALLOWLIST,
  ADMIN_MAX_TOOL_CALLS_PER_SESSION,
  CONFIRM_REQUIRED,
  isAdminTool,
} from "@/lib/ai/client";
import { OPERATOR_SYSTEM_PROMPT } from "@/lib/ai/operator-prompt";
import { OPERATOR_SYSTEM_PROMPT_COMPACT } from "@/lib/ai/prompts/operator-compact";
import { buildSetupContext } from "@/lib/ai/copilot-context";
import { getTool, invokeTool } from "@/lib/tools/registry";
import { ADMIN_CHAT_SCOPES } from "@/lib/scopes";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { adminChatRateLimiter, rateLimitResponse } from "@/lib/rate-limit";
import {
  createPendingConfirmation,
  consumeConfirmation,
  stripConfirm,
} from "@/lib/confirmation-tokens";
import { redactSensitive } from "@/lib/audit";
import { withAuditContext } from "@/lib/audit-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Local-AI plan: hævet fra 120s → 180s. Local Gemma 3 12B kan tage 30-60s for
// første message med 10+ tool-schemas; Vercel-deploy med Anthropic er stadig
// snappy. Customers på Vercel-hobby har 60s hard limit — dokumenteret i docs.
export const maxDuration = 180;

/**
 * Operatør-chat-endpoint. Lever bag Auth.js requireAdmin-guard. Sender SSE-
 * streamed responses med tool-calling fra ADMIN_TOOL_ALLOWLIST.
 *
 * Plan-først-confirmation (kritisk sikkerheds-lag):
 *   Tools i CONFIRM_REQUIRED-listen udføres IKKE direkte. Første kald
 *   returnerer { requiresConfirmation:true, tool, args, preview }. Klient
 *   viser plan-card; admin klikker bekræft → ny request sendes med samme
 *   args + 'confirm:true'. AI'en kan IKKE selv sætte confirm:true (vi
 *   tjekker FØR vi giver args videre til tool-handler — confirm fjernes
 *   fra args inden første kald).
 *
 * Suggest-mode: hvis request body har 'suggestMode:true', filtreres
 * ADMIN_TOOL_ALLOWLIST til kun read-tools (write-tools returnerer 403).
 */
export async function POST(request: NextRequest) {
  // 1. Auth — kun admin
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Rate-limit per admin-user-id
  const rl = adminChatRateLimiter.check(session.user.id);
  if (!rl.allowed) {
    return rateLimitResponse(rl);
  }

  // 3. Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { messages, suggestMode, confirmations } = body as {
    messages?: unknown;
    suggestMode?: boolean;
    /** Map af tool → confirmation-token, sendt fra klient når admin har klikket
     *  bekræft på et plan-card. Server slår op i pending-map for at validere. */
    confirmations?: Record<string, string>;
  };
  if (!Array.isArray(messages)) {
    return Response.json(
      { error: "Missing 'messages' array in body" },
      { status: 400 },
    );
  }

  // 4. Resolver provider/model. chatModelResolved kaster hvis konfigurationen
  // er ufuldstændig (fx provider=local uden endpoint, eller ingen Anthropic-key
  // når provider=anthropic). Vi vil gerne fange den fejl og returnere en pæn
  // 503 i stedet for at lade streamText eksplodere.
  let resolved: Awaited<ReturnType<typeof chatModelResolved>>;
  try {
    resolved = await chatModelResolved("chat");
  } catch (err) {
    return Response.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Operatør-AI er ikke konfigureret. Gå til /admin/integrations.",
      },
      { status: 503 },
    );
  }

  const actor = `operator-chat:${session.user.id}` as const;
  const ip = request.headers.get("x-forwarded-for") ?? null;
  const userAgent = request.headers.get("user-agent") ?? null;

  let toolCallCount = 0;

  async function executeAdminTool(
    name: string,
    args: unknown,
  ): Promise<unknown> {
    // Budget-loft
    if (toolCallCount >= ADMIN_MAX_TOOL_CALLS_PER_SESSION) {
      return {
        error:
          "Tool-budget brugt op for denne session. Refresh siden for at starte forfra.",
      };
    }
    toolCallCount++;

    // Defense-in-depth: bekræft tool er på allowlist
    if (!isAdminTool(name)) {
      await prisma.auditLog.create({
        data: {
          actor,
          tool: name,
          argsJson: JSON.stringify(redactSensitive(args)),
          ok: false,
          errorMsg: "Operatør-chat forsøgte at kalde ikke-tilladt tool",
          requestId: randomUUID(),
          ip,
          userAgent,
        },
      });
      return { error: "Det værktøj er ikke tilgængeligt for operatør-chat." };
    }

    // Suggest-mode: bloker alle write-tools (CONFIRM_REQUIRED = vores write-set)
    if (suggestMode && CONFIRM_REQUIRED.has(name as never)) {
      return {
        error:
          "Suggest mode er aktiv — write-tools er disabled. Slå suggest mode fra for at udføre handlingen.",
      };
    }

    // Plan-først: write-tools kræver server-state-baseret confirmation-token.
    // AI'en kan ALDRIG generere et gyldigt token selv — det udstedes af
    // serveren, gemmes i memory-map med (tool, argsHash, adminId, expiry),
    // og kan kun konsumeres af klienten via request-body 'confirmations'-map
    // efter at admin har klikket Bekræft på plan-card.
    if (CONFIRM_REQUIRED.has(name as never)) {
      // Strip eventuel AI-genereret 'confirm:true' fra args så den ikke kan
      // overleve consumeConfirmation's hash-tjek (vi compare'r mod args UDEN
      // confirm-felt for at få deterministisk hash uanset AI's adfærd).
      const cleanArgs = stripConfirm(args);

      // Tjek om klienten har sendt et token for dette tool
      const token = confirmations?.[name];

      if (!token) {
        // INGEN token: returnér plan-card med nyt token → klienten viser
        // bekræft-knap → ved klik sender klient request igen med token
        const newToken = createPendingConfirmation({
          tool: name,
          toolArgs: cleanArgs,
          ownerId: session!.user.id,
        });
        return {
          requiresConfirmation: true,
          tool: name,
          args: cleanArgs,
          preview: buildPlanPreview(name, cleanArgs),
          confirmationToken: newToken,
        };
      }

      // Token sendt: verificér + consume
      const verify = consumeConfirmation({
        token,
        tool: name,
        toolArgs: cleanArgs,
        ownerId: session!.user.id,
      });
      if (!verify.ok) {
        return { error: `Bekræftelse afvist: ${verify.reason}` };
      }
      // Verified → tilføj confirm:true til args. Tools' Zod-schema kræver
      // dette flag for at beskytte MCP/REST-konsumenter; her ER det
      // legitimt at sætte det fordi vi lige har konsumeret et token.
      args = { ...(cleanArgs as Record<string, unknown>), confirm: true };
    }

    const result = await invokeTool(
      name,
      args,
      { actor, requestId: randomUUID(), ip, userAgent },
      ADMIN_CHAT_SCOPES,
    );
    return result.ok ? result.result : { error: result.error };
  }

  // Local-AI plan (Fase 1.4): cap tool-listen baseret på modellens capability-
  // tier. Gemma 3 4B → 10 read-only tools; 12B → +3 low-risk writes; 27B+ → alle 37.
  // Anthropic-modeller har capability="all", så ingenting filtreres væk for cloud.
  const allowedToolNames = filterToolsForCapability(
    ADMIN_TOOL_ALLOWLIST,
    resolved.capabilities,
  );

  // Anthropic API kræver tool-navne der matcher /^[a-zA-Z0-9_-]{1,128}$/.
  // Vores registry bruger "domain.verb" — vi konverterer "." → "_" når vi
  // registrerer med AI SDK og oversætter tilbage i executor. Reverse-lookup
  // bruger en pre-bygget map så vi ikke gætter på ambiguous navne.
  const apiNameToRegistryName: Record<string, string> = {};
  for (const registryName of allowedToolNames) {
    apiNameToRegistryName[registryName.replace(/\./g, "_")] = registryName;
  }

  // Byg tool-table — én entry per tool i allowlist (med api-safe navne)
  const aiTools = Object.fromEntries(
    allowedToolNames
      .map((registryName) => {
        const reg = getTool(registryName);
        if (!reg) return [registryName, undefined];
        const apiName = registryName.replace(/\./g, "_");
        return [
          apiName,
          tool({
            description: reg.description,
            inputSchema: reg.input as unknown as z.ZodObject<z.ZodRawShape>,
            execute: (args: unknown) =>
              executeAdminTool(apiNameToRegistryName[apiName] ?? apiName, args),
          }),
        ];
      })
      .filter(([, v]) => v !== undefined),
  ) as Record<string, ReturnType<typeof tool>>;

  const modelMessages = await convertToModelMessages(messages);

  // Local-AI plan (Fase 1.5): switch til compact-prompt for små modeller så vi
  // har plads til tool-schemas + messages i Gemma 3 4B's 8k context.
  const basePrompt =
    resolved.capabilities.maxTokens < 16384
      ? OPERATOR_SYSTEM_PROMPT_COMPACT
      : OPERATOR_SYSTEM_PROMPT;

  // Local-AI plan (Fase 2.2): injicér current setup-state så copilot kan
  // svare "hvad mangler jeg?" uden at skulle kalde tools. Tilføjes ovenpå
  // base-prompt så directive-rækkefølgen forbliver intakt.
  const setupContext = await buildSetupContext();
  const systemPrompt = `${basePrompt}\n\n${setupContext}`;

  // Local-AI plan: wrap streamText i withAuditContext så alle tool-calls
  // under denne session får provider+model stamps på deres audit-rows.
  // AsyncLocalStorage propagerer gennem streamText's async tool.execute callbacks.
  return withAuditContext(
    {
      provider: resolved.provider,
      model: resolved.model,
      modality: "text",
    },
    () => {
      const result = streamText({
        model: resolved.handle,
        system: systemPrompt,
        messages: modelMessages,
        tools: aiTools,
        stopWhen: stepCountIs(ADMIN_MAX_TOOL_CALLS_PER_SESSION),
        onError({ error }) {
          console.error(
            `[admin/chat] streamText error (provider=${resolved.provider} model=${resolved.model}):`,
            error,
          );
        },
      });
      return result.toUIMessageStreamResponse();
    },
  );
}

/**
 * Menneske-læseligt resume af et tool-kald til plan-card-rendering.
 * Skal være ÉN linje — admin scanner planen hurtigt før klik.
 */
function buildPlanPreview(name: string, args: unknown): string {
  const a = (args ?? {}) as Record<string, unknown>;
  switch (name) {
    case "products.delete":
      return `Slet (soft-delete) produktet '${a.slug}'`;
    case "products.create":
      return `Opret produkt '${a.name}' (slug: ${a.slug}) til ${formatPrice(a.priceDkk)}`;
    case "products.update":
      return `Opdater produkt '${a.slug}' med ændringer: ${JSON.stringify(a.patch ?? {})}`;
    case "orders.update_status":
      return `Sæt ordre ${a.orderId} til status '${a.status}'`;
    case "discounts.create":
      return `Opret rabatkode '${a.code}' (${a.type === "percent" ? `${a.value}%` : `${formatPrice(a.value)}`})`;
    case "discounts.toggle":
      return `Toggle rabatkode '${a.code}' aktiv/inaktiv`;
    case "categories.upsert":
      return `Opret/opdater kategori '${a.slug}' ('${a.name}')`;
    case "categories.delete":
      return `Slet kategori '${a.slug}'`;
    case "pages.upsert":
      return `Opret/opdater /info/${a.slug} ('${a.title}')`;
    case "pages.delete":
      return `Slet side /info/${a.slug}`;
    case "settings.update_shipping":
      return `Sæt fragt: ${formatPrice(a.shippingFeeOere)} | gratis over ${formatPrice(a.freeShippingThresholdOere)}`;
    case "settings.update_branding":
      return `Opdater branding (butiksnavn '${a.storeName}', announcement '${a.announcement}')`;
    case "marketing.create_campaign":
      return `KAMPAGNE: rabatkode '${a.discountCode}' (${a.discountType === "percent" ? `${a.discountValue}%` : `${formatPrice(a.discountValue)}`}) + nyt banner '${a.announcement}'`;
    case "audit.revert":
      return `RUL TILBAGE audit-entry ${a.auditLogId}`;
    default:
      return `Udfør ${name}`;
  }
}

function formatPrice(v: unknown): string {
  if (typeof v !== "number") return String(v);
  return `${(v / 100).toFixed(2).replace(".", ",")} kr`;
}
