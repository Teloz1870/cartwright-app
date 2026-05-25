/**
 * Local-AI plan Fase 2.1: focused prompts til ExplainButton.
 *
 * Hver prompt er ~200-400 tokens — sikker margin selv på Gemma 3 4B's
 * 8k effective context. Vi bruger no-tool single-turn streamText så vi
 * ikke betaler for tool-schema-injection.
 *
 * Pattern: tag context, returnér klartekst (1-3 sætninger). Ingen markdown,
 * ingen lister — voice-friendly hvis vi senere TTS'er svaret.
 */

export type ExplainContextType =
  | "dns-check-fail"
  | "setup-item-missing"
  | "error-message"
  | "field-help";

export type ExplainPromptInput = {
  contextType: ExplainContextType;
  /** Domain-specifik data, typed per contextType i client */
  contextData: unknown;
};

const SYSTEM_PROMPT = `Du er Cartwright's hjælpsomme tekniske assistent.

Din opgave: forklar i KORT, klar dansk hvad et problem betyder og hvad shop-ejeren skal gøre.

Regler:
- 2-4 sætninger maks. Ingen lister, ingen markdown.
- Først HVAD problemet er (1 sætning), så HVORDAN det løses (1-3 sætninger).
- Skriv som du taler til en travl shop-ejer der ikke er teknisk.
- Hvis du er usikker, sig "tjek docs på cartwright.app/docs" frem for at gætte.
- Brug aldrig "AI" eller "model" om dig selv — bare svar.`;

export function buildExplainPrompt({
  contextType,
  contextData,
}: ExplainPromptInput): { system: string; user: string } {
  return {
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(contextType, contextData),
  };
}

function buildUserPrompt(
  contextType: ExplainContextType,
  data: unknown,
): string {
  switch (contextType) {
    case "dns-check-fail": {
      const c = (data ?? {}) as {
        label?: string;
        status?: string;
        expectedHint?: string;
        found?: string[];
        detail?: string;
        domain?: string;
      };
      return `Min DNS-tjek for "${c.label ?? "ukendt record"}" på domænet ${c.domain ?? "(ukendt)"} fejlede med status "${c.status ?? "ukendt"}".

Forventet: ${c.expectedHint ?? "(ikke specificeret)"}
Fundet: ${c.found?.join(", ") ?? "(ingen)"}
Detail: ${c.detail ?? "(ingen)"}

Forklar i klartekst hvad jeg skal gøre.`;
    }

    case "setup-item-missing": {
      const c = (data ?? {}) as {
        label?: string;
        description?: string;
        category?: string;
      };
      return `Et setup-item i min Cartwright-shop er ikke konfigureret endnu:

Item: ${c.label ?? "ukendt"}
Kategori: ${c.category ?? "ukendt"}
Beskrivelse: ${c.description ?? "(ingen)"}

Forklar kort hvorfor det er vigtigt og hvad jeg konkret skal gøre for at fixe det.`;
    }

    case "error-message": {
      const c = (data ?? {}) as {
        action?: string;
        message?: string;
        context?: string;
      };
      return `Jeg fik en fejl mens jeg prøvede at: ${c.action ?? "(ukendt handling)"}

Fejlbesked: ${c.message ?? "(ingen)"}
Yderligere context: ${c.context ?? "(ingen)"}

Forklar hvad der gik galt og hvordan jeg løser det.`;
    }

    case "field-help": {
      const c = (data ?? {}) as {
        fieldName?: string;
        currentValue?: string;
        purpose?: string;
      };
      return `Hjælp mig forstå feltet "${c.fieldName ?? "(ukendt)"}" i Cartwright admin.

Nuværende værdi: ${c.currentValue ?? "(tomt)"}
Hvad det bruges til: ${c.purpose ?? "(ikke beskrevet)"}

Forklar kort hvad jeg skal skrive der og hvorfor det matter.`;
    }
  }
}
