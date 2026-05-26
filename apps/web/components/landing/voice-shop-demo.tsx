import Link from "next/link";
import { VoiceShopDemoClient } from "./voice-shop-demo-client";

/**
 * Voice-shop demo wrapper for cartwright.app homepage.
 *
 * Server-component der gater den interaktive demo bag env-flags:
 *   - VOICE_DEMO_ENABLED=1
 *   - GOOGLE_GENAI_API_KEY sat
 *
 * Hvis enten mangler: render et statisk marketing-card med link til
 * /docs/ai/voice-shop. Ingen broken "click the mic"-knap der bare siger
 * "Demo not available right now" — det er værre end ingen demo.
 *
 * Når begge env-vars er sat: render den fulde interaktive demo-client.
 */
export function VoiceShopDemo() {
  const demoEnabled =
    process.env.VOICE_DEMO_ENABLED === "1" &&
    !!process.env.GOOGLE_GENAI_API_KEY;

  return (
    <section className="relative overflow-hidden border-y border-cw-stone-200 bg-cw-paper dark:border-cw-stone-800 dark:bg-cw-ink">
      <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
        <div className="flex flex-col items-center text-center">
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-cw-terracotta/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cw-terracotta">
            <span className="size-1.5 rounded-full bg-cw-terracotta" />{" "}
            {demoEnabled ? "live demo" : "now in beta"}
          </span>
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50 sm:text-4xl">
            Voice + vision shopping for your store
          </h2>
          <p className="mt-3 max-w-xl text-sm text-cw-stone-600 dark:text-cw-stone-300">
            {demoEnabled
              ? "Click the mic. Ask for “coffee” or “a reading lamp”. Hear the demo store talk back. 30 seconds, no signup."
              : "Customers can talk directly to your shop via Gemini Live. Floating mic-FAB on the storefront, server-side tool dispatch with the same audit-log + scope-guards as your text chat."}
          </p>

          {demoEnabled ? (
            <VoiceShopDemoClient />
          ) : (
            <StaticVoiceMarketing />
          )}
        </div>
      </div>
    </section>
  );
}

function StaticVoiceMarketing() {
  return (
    <div className="mt-8 flex flex-col items-center gap-6">
      <div className="grid w-full max-w-2xl grid-cols-1 gap-3 text-left sm:grid-cols-3">
        <Feature
          title="Brand-bound"
          body="Compile-time gate per shop via brand.features.voiceShop. Default off — zero overhead unless you opt in."
        />
        <Feature
          title="Cost-capped"
          body="Per-session minute cap + daily cap configurable in admin. BotID + per-IP rate-limit on token mint."
        />
        <Feature
          title="Auditable"
          body="Every voice tool-call logged with modality=voice, provider=google, model — same scope-guards as text chat."
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/docs/ai/voice-shop"
          className="rounded-full bg-cw-terracotta px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cw-terracotta-strong"
        >
          Read the voice-shop docs →
        </Link>
        <code className="rounded-md bg-cw-stone-900 px-4 py-2 font-mono text-xs text-cw-stone-50 dark:bg-cw-stone-800">
          npx create-cartwright@latest
        </code>
      </div>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-cw-stone-200 bg-white p-4 dark:border-cw-stone-800 dark:bg-cw-stone-900">
      <div className="text-sm font-semibold text-cw-stone-900 dark:text-cw-stone-50">
        {title}
      </div>
      <p className="mt-1 text-xs text-cw-stone-600 dark:text-cw-stone-300">
        {body}
      </p>
    </div>
  );
}
