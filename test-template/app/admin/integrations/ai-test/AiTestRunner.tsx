"use client";

import { useState, useTransition } from "react";
import { testAiProviderAction } from "../actions";

type Props = {
  anthropicConfigured: boolean;
  localConfigured: boolean;
  currentProvider: "anthropic" | "local" | "auto";
};

type TestRun = {
  ok: boolean;
  provider?: string;
  model?: string;
  response?: string;
  latencyMs?: number;
  error?: string;
};

const PROMPTS = [
  {
    id: "greeting",
    label: "Hej-test",
    description: "Simpelt en-ord svar. Måler latency og at provider svarer.",
    prompt: "Sig præcis: OK",
  },
  {
    id: "reasoning",
    label: "Reasoning",
    description:
      "Multi-step problem. Tester at modellen kan ræsonnere uden tools.",
    prompt:
      "En kunde spørger om vi har gratis fragt på en ordre på 450 kr når vores gratis-fragt-threshold er 499 kr. Svar kort med (a) ja/nej og (b) hvor meget mere de skal købe for at få gratis fragt.",
  },
  {
    id: "structured",
    label: "Structured (vibe)",
    description:
      "Beder modellen returnere JSON. Tester structured-output kvalitet — KRITISK forskel mellem providers.",
    prompt:
      'Returnér KUN gyldig JSON, intet andet: {"recommendation": "<en-sætning produkt-anbefaling for en aktiv 35-årig kvinde>", "category": "<kort kategorinavn>"}',
  },
];

export default function AiTestRunner({
  anthropicConfigured,
  localConfigured,
  currentProvider,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [runs, setRuns] = useState<Record<string, TestRun | "loading">>({});
  const [comparison, setComparison] = useState(false);

  function runPrompt(promptId: string) {
    const prompt = PROMPTS.find((p) => p.id === promptId);
    if (!prompt) return;

    setRuns((r) => ({ ...r, [promptId]: "loading" }));

    startTransition(async () => {
      const r = await testAiProviderAction("chat", prompt.prompt);
      setRuns((cur) => ({
        ...cur,
        [promptId]: r.ok
          ? {
              ok: true,
              provider: r.provider,
              model: r.model,
              response: r.response,
              latencyMs: r.latencyMs,
            }
          : { ok: false, error: r.error },
      }));
    });
  }

  function runAll() {
    PROMPTS.forEach((p) => runPrompt(p.id));
  }

  const canCompare = anthropicConfigured && localConfigured;

  return (
    <div className="space-y-6">
      {/* Header bar med global actions */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sol-ink/10 bg-white p-4 shadow-sm">
        <div className="text-sm text-sol-muted">
          Provider:{" "}
          <strong className="font-bold text-sol-ink">{currentProvider}</strong>
          {" · "}
          Anthropic:{" "}
          <span
            className={
              anthropicConfigured ? "text-green-700" : "text-amber-700"
            }
          >
            {anthropicConfigured ? "konfigureret" : "mangler key"}
          </span>
          {" · "}
          Local:{" "}
          <span
            className={localConfigured ? "text-green-700" : "text-amber-700"}
          >
            {localConfigured ? "konfigureret" : "mangler endpoint"}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {canCompare && (
            <label className="flex items-center gap-2 text-xs font-bold text-sol-muted">
              <input
                type="checkbox"
                checked={comparison}
                onChange={(e) => setComparison(e.target.checked)}
                className="h-4 w-4 rounded border-sol-ink/20 accent-sol-accent"
              />
              Sammenlign-mode (kør side om side)
            </label>
          )}
          <button
            type="button"
            onClick={runAll}
            disabled={pending}
            className="rounded-full bg-sol-accent px-4 py-2 text-xs font-black uppercase tracking-wider text-white transition hover:bg-sol-accent/90 disabled:opacity-50"
          >
            Kør alle 3
          </button>
        </div>
      </section>

      {/* Per-prompt sektioner */}
      <div className="space-y-4">
        {PROMPTS.map((prompt) => {
          const run = runs[prompt.id];
          return (
            <section
              key={prompt.id}
              className="rounded-2xl border border-sol-ink/10 bg-white p-5 shadow-sm"
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-black text-sol-ink">
                    {prompt.label}
                  </h2>
                  <p className="mt-1 text-sm text-sol-muted">
                    {prompt.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => runPrompt(prompt.id)}
                  disabled={run === "loading"}
                  className="shrink-0 rounded-full border border-sol-ink/15 bg-white px-3 py-1.5 text-xs font-black uppercase tracking-wider text-sol-ink transition hover:bg-sol-accent hover:text-white hover:border-sol-accent disabled:opacity-50"
                >
                  {run === "loading" ? "Kører…" : "Kør"}
                </button>
              </div>

              <details className="mb-3 text-xs">
                <summary className="cursor-pointer text-sol-muted">
                  Vis prompt
                </summary>
                <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-sol-cream px-3 py-2 font-mono text-[11px] text-sol-ink">
                  {prompt.prompt}
                </pre>
              </details>

              {run && run !== "loading" && <ResultCard run={run} />}
            </section>
          );
        })}
      </div>

      {comparison && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Sammenlign-mode: skift provider i{" "}
          <a
            href="/admin/integrations"
            className="font-bold underline"
          >
            /admin/integrations
          </a>{" "}
          mellem kørsler, og hold svarene oppe så du kan sammenligne side om
          side. (Native side-by-side rendering kommer i v2 — kræver at vi
          extender testAiProviderAction til at acceptere explicit provider-
          override, hvilket bypasser den nuværende settings-cache.)
        </p>
      )}
    </div>
  );
}

function ResultCard({ run }: { run: TestRun }) {
  if (!run.ok) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
        ✗ {run.error}
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-green-300 bg-green-50 px-3 py-2">
      <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-green-800">
        <span>✓ {run.provider}</span>
        <span>·</span>
        <span>{run.model}</span>
        <span>·</span>
        <span>{run.latencyMs}ms</span>
      </div>
      <pre className="mt-2 whitespace-pre-wrap rounded bg-white/60 p-2 font-mono text-xs text-sol-ink">
        {run.response}
      </pre>
    </div>
  );
}
