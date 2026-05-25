import { requireAdmin } from "@/lib/admin";
import { getAiSettingsForUi } from "../actions";
import AiTestRunner from "./AiTestRunner";

export const dynamic = "force-dynamic";

/**
 * Local-AI plan Fase 1.8: AI-test page.
 *
 * 3 canned prompts der spænder fra simpel read til kompleks reasoning.
 * Admin kan køre dem mod den configured provider, eller sammenligne side om
 * side hvis både Anthropic og local er configured.
 *
 * Hvorfor det her er det mest credibility-byggende stykke i hele Local-AI
 * planen: AI-engineers tror på det de ser virke live, ikke på arkitektur-
 * diagrammer. En sammenligning af "list mine 3 nyeste produkter" på Claude
 * Haiku 4.5 vs Gemma 3 12B er den 30-sek demo der overbeviser dem om at
 * provider-abstraktion ikke er marketing-fluff.
 */
export default async function AiTestPage() {
  await requireAdmin();
  const aiSettings = await getAiSettingsForUi();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-black text-sol-ink">AI-test</h1>
        <p className="mt-2 max-w-2xl text-sm font-medium text-sol-muted">
          Kør canned prompts mod den configured AI-provider. Hver test viser
          model, latency og output — så du kan sammenligne providers live på
          dine egne data inden du committer til en model.
        </p>
      </header>

      <AiTestRunner
        anthropicConfigured={aiSettings.anthropicConfigured}
        localConfigured={aiSettings.localConfigured}
        currentProvider={aiSettings.provider}
      />
    </div>
  );
}
