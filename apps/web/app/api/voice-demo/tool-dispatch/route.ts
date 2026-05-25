import { NextRequest } from "next/server";
import { z } from "zod";
import { DEMO_PRODUCTS, type DemoProduct } from "../catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 5;

const bodySchema = z.object({
  sessionId: z.string().min(1).max(128),
  toolCallId: z.string().min(1).max(128),
  toolName: z.enum(["products_search", "products_get"]),
  args: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Voice-plan Fase 3: tool-dispatch for forside-demo.
 *
 * Simpel naïv search mod hardcoded DEMO_PRODUCTS — ingen DB, ingen registry.
 * Browser POSTer per tool-call og forwarder svaret tilbage via WS.
 */
export async function POST(request: NextRequest) {
  if (process.env.VOICE_DEMO_ENABLED !== "1") {
    return Response.json(
      { error: "Demo not available." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const { toolCallId, toolName, args = {} } = parsed.data;

  let result: unknown;
  if (toolName === "products_search") {
    const query = String(args.query ?? "").toLowerCase();
    result = naiveSearch(query, DEMO_PRODUCTS).slice(0, 5);
  } else if (toolName === "products_get") {
    const id = String(args.id ?? "");
    const product = DEMO_PRODUCTS.find((p) => p.id === id);
    result = product ?? { error: "not_found" };
  }

  return Response.json({
    kind: "result",
    functionResponses: [
      {
        id: toolCallId,
        name: toolName,
        response: { result },
      },
    ],
  });
}

function naiveSearch(query: string, products: DemoProduct[]): DemoProduct[] {
  if (!query) return products.slice(0, 5);
  const terms = query.split(/\s+/).filter(Boolean);
  return products
    .map((p) => ({
      product: p,
      score: terms.reduce(
        (acc, term) =>
          acc +
          (p.name.toLowerCase().includes(term) ? 3 : 0) +
          (p.description.toLowerCase().includes(term) ? 2 : 0) +
          (p.tags.some((t) => t.toLowerCase().includes(term)) ? 1 : 0),
        0,
      ),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.product);
}
