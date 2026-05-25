"use client";

import { useEffect, useRef, useState } from "react";
import type { ExplainContextType } from "@/lib/ai/prompts/explain";

type Props = {
  contextType: ExplainContextType;
  /** Data der sendes med til prompt-builder. Typed per contextType — se prompts/explain.ts */
  contextData: unknown;
  /** Disable button (fx hvis AI ikke er konfigureret) */
  disabled?: boolean;
  /** Brand-specifik label, default "Forklar med AI" */
  label?: string;
  /** Variant: "icon" = lille rund ✨-knap, "pill" = label+icon */
  variant?: "icon" | "pill";
};

/**
 * Local-AI plan Fase 2.1: universal "Forklar med AI" knap.
 *
 * Wired ind i EmailDomainPanel (DNS-fejl), SetupRunbook (manglende items),
 * ResendKeyForm (test-mail fejl) — og kan tilføjes hvor som helst med
 *
 *   <ExplainButton contextType="error-message" contextData={{...}} />
 *
 * Når klikket: POST til /api/admin/explain → streams response → vises i
 * popover oven på knappen. Graceful "AI offline"-state hvis endpoint
 * returnerer 503 (provider ikke konfigureret).
 */
export default function ExplainButton({
  contextType,
  contextData,
  disabled,
  label = "Forklar med AI",
  variant = "icon",
}: Props) {
  const [open, setOpen] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Luk popover ved click udenfor
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (!popoverRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("mousedown", handle);
    return () => window.removeEventListener("mousedown", handle);
  }, [open]);

  async function handleClick() {
    if (streaming) return;
    if (open && text) {
      // Toggle off hvis allerede åben
      setOpen(false);
      return;
    }
    setOpen(true);
    setStreaming(true);
    setText("");
    setError(null);

    try {
      const response = await fetch("/api/admin/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contextType, contextData }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        setError(
          (errBody as { error?: string })?.error ??
            `Fejl ${response.status}: AI-svar ikke tilgængeligt`,
        );
        setStreaming(false);
        return;
      }

      if (!response.body) {
        setError("Tomt response — er AI-providertilbage online?");
        setStreaming(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setText((cur) => cur + chunk);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Forbindelse til AI fejlede",
      );
    } finally {
      setStreaming(false);
    }
  }

  const buttonClass =
    variant === "icon"
      ? "inline-flex h-7 w-7 items-center justify-center rounded-full border border-sol-ink/15 bg-white text-sm transition hover:bg-sol-accent hover:text-white hover:border-sol-accent disabled:opacity-40"
      : "inline-flex items-center gap-1.5 rounded-full border border-sol-ink/15 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider text-sol-ink transition hover:bg-sol-accent hover:text-white hover:border-sol-accent disabled:opacity-40";

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || streaming}
        title={disabled ? "AI ikke konfigureret" : label}
        aria-label={label}
        className={buttonClass}
      >
        {variant === "icon" ? "✨" : (
          <>
            <span aria-hidden>✨</span>
            <span>{streaming ? "Tænker…" : label}</span>
          </>
        )}
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="absolute right-0 top-full z-40 mt-2 w-80 rounded-xl border border-sol-ink/10 bg-white p-4 text-sm shadow-sol-lift"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-sol-muted">
              ✨ AI-forklaring
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sol-muted hover:text-sol-ink"
              aria-label="Luk"
            >
              ✕
            </button>
          </div>
          {error ? (
            <p className="text-red-700">
              {error}
              {error.includes("503") || error.includes("ikke konfigureret") ? (
                <>
                  {" "}
                  <a
                    href="/admin/integrations"
                    className="font-bold underline"
                  >
                    Gå til settings
                  </a>
                </>
              ) : null}
            </p>
          ) : (
            <p className="whitespace-pre-wrap text-sol-ink">
              {text}
              {streaming && (
                <span className="ml-1 inline-block h-3 w-1.5 animate-pulse bg-sol-accent align-middle" />
              )}
            </p>
          )}
        </div>
      )}
    </span>
  );
}
