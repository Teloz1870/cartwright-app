"use client";

import { useState, useTransition } from "react";
import {
  setResendKeyAction,
  clearResendKeyAction,
  sendTestResendEmailAction,
} from "./actions";
import { brand } from "@/brand.config";
import ExplainButton from "@/components/admin/ExplainButton";

type Props = {
  initial: { isSet: boolean; preview: string | null };
};

export default function ResendKeyForm({ initial }: Props) {
  const [pending, startTransition] = useTransition();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savedPreview, setSavedPreview] = useState<string | null>(initial.preview);

  // Test-email state (separat fra key-form så vi kan kalde uden at gemme nyt)
  const [testTo, setTestTo] = useState("");
  const [testPending, startTestTransition] = useTransition();
  const [testResult, setTestResult] = useState<
    | { kind: "ok"; sentTo: string }
    | { kind: "error"; message: string }
    | null
  >(null);

  function handleSendTest() {
    setTestResult(null);
    const fd = new FormData();
    fd.set("to", testTo);
    startTestTransition(async () => {
      const r = await sendTestResendEmailAction(fd);
      if (r.ok) {
        setTestResult({ kind: "ok", sentTo: r.sentTo });
      } else {
        setTestResult({ kind: "error", message: r.error });
      }
    });
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const r = await setResendKeyAction(formData);
      if (r.ok) {
        setSavedPreview(r.preview);
        setInput("");
      } else {
        setError(r.error);
      }
    });
  }

  function handleClear() {
    if (
      !confirm(
        "Fjern Resend API-key? Magic-links og kvitteringer falder tilbage til preview-mode (kun lokale .mail-previews/, INGEN rigtige emails).",
      )
    ) {
      return;
    }
    startTransition(async () => {
      await clearResendKeyAction();
      setSavedPreview(null);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {savedPreview ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
            <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
            Konfigureret — rigtige emails sendes
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Preview-mode — mails skrives til <code>.mail-previews/</code>
          </span>
        )}
        {savedPreview && (
          <code className="rounded bg-sol-cream px-2 py-1 font-mono text-xs text-sol-ink">
            {savedPreview}
          </code>
        )}
      </div>

      <form action={handleSubmit} className="space-y-3">
        <label className="block">
          <span className="text-xs font-black uppercase tracking-widest text-sol-muted">
            Resend API-nøgle
          </span>
          <input
            type="password"
            name="apiKey"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            placeholder="re_..."
            className="mt-1 block w-full rounded-lg border border-sol-ink/15 bg-white px-3 py-2 font-mono text-sm text-sol-ink outline-none focus:border-sol-accent"
          />
          <span className="mt-1 block text-xs text-sol-muted">
            Få en key på{" "}
            <a
              href="https://resend.com/api-keys"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-sol-accent underline"
            >
              resend.com/api-keys
            </a>
            . Gratis tier: 3000 mails/md. Følg den komplette opsætning på{" "}
            <a
              href="https://cartwright.app/docs/email/resend-sending"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-sol-accent underline"
            >
              cartwright.app/docs/email/resend-sending
            </a>
            {" "}— SPF, DKIM, brand.config.ts og hvordan du undgår SPF-konflikt
            med din indbakke-udbyder for {brand.domain}.
          </span>
        </label>

        {error && (
          <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={pending || input.trim().length === 0}
            className="rounded-full bg-sol-accent px-5 py-2 text-sm font-black uppercase tracking-wider text-white transition hover:bg-sol-accent/90 disabled:opacity-50"
          >
            {pending ? "Gemmer…" : savedPreview ? "Erstat key" : "Gem key"}
          </button>
          {savedPreview && (
            <button
              type="button"
              onClick={handleClear}
              disabled={pending}
              className="rounded-full border border-red-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-50"
            >
              Fjern key
            </button>
          )}
        </div>
      </form>

      {/* Test-email — kun synlig når key er gemt så vi ved hvad vi tester */}
      {savedPreview && (
        <div className="rounded-lg border border-sol-ink/10 bg-sol-cream/30 p-4">
          <div className="mb-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-sol-ink">
              Test afsendelse
            </h3>
            <p className="mt-1 text-xs text-sol-muted">
              Send en testmail til din egen indbakke for at bekræfte at afsender-
              domænet er verificeret i Resend og DNS er propageret. Hvis du får
              en fejl, peger den typisk på en uverificeret from-adresse eller
              manglende SPF/DKIM — se{" "}
              <a
                href="https://cartwright.app/docs/email/troubleshooting"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-sol-accent underline"
              >
                troubleshooting
              </a>
              .
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex-1 min-w-[200px]">
              <span className="block text-[10px] font-black uppercase tracking-widest text-sol-muted">
                Modtager
              </span>
              <input
                type="email"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
                placeholder="din-egen@gmail.com"
                autoComplete="off"
                spellCheck={false}
                className="mt-1 block w-full rounded-lg border border-sol-ink/15 bg-white px-3 py-2 font-mono text-sm text-sol-ink outline-none focus:border-sol-accent"
              />
            </label>
            <button
              type="button"
              onClick={handleSendTest}
              disabled={testPending || testTo.trim().length === 0}
              className="rounded-full border border-sol-ink/15 bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-sol-ink transition hover:bg-sol-accent hover:text-white hover:border-sol-accent disabled:opacity-50"
            >
              {testPending ? "Sender…" : "Send testmail"}
            </button>
          </div>
          {testResult?.kind === "ok" && (
            <p className="mt-3 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm font-bold text-green-800">
              ✓ Testmail sendt til {testResult.sentTo}. Tjek din indbakke (og evt. spam-mappe) — verificér Authentication-Results i headerne.
            </p>
          )}
          {testResult?.kind === "error" && (
            <div className="mt-3 flex flex-wrap items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm">
              <p className="flex-1 min-w-0 font-bold text-red-700">
                {testResult.message}
              </p>
              <ExplainButton
                variant="pill"
                contextType="error-message"
                contextData={{
                  action: `Sende test-mail til ${testTo} via Resend`,
                  message: testResult.message,
                  context: `From-adresse: ${brand.emails.fromName} <${brand.emails.from}> · Domain: ${brand.domain}`,
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
