import { validateKey } from "./llm.js";

export type KeyModeResult = { type: "key"; key: string } | { type: "manual" };

export interface KeyStepDeps {
  getEnvKey: () => string | undefined;
  promptKey: () => Promise<string>;
  confirmManual: () => Promise<boolean>;
}

// Returns true (key works), false (key rejected — re-prompt), or "unavailable"
// (couldn't reach/validate the API, e.g. 404 from a retired model, 5xx, network).
// "unavailable" must never crash the scaffolder — we fall back to manual (v1).
async function check(key: string): Promise<boolean | "unavailable"> {
  try {
    return await validateKey(key);
  } catch {
    return "unavailable";
  }
}

export async function resolveKeyMode(deps: KeyStepDeps): Promise<KeyModeResult> {
  let currentKey = deps.getEnvKey();

  if (currentKey) {
    if ((await check(currentKey)) === true) return { type: "key", key: currentKey };
  }

  while (true) {
    currentKey = await deps.promptKey();
    if (!currentKey) {
      const isManualOk = await deps.confirmManual();
      if (isManualOk) return { type: "manual" };
      throw new Error("abort");
    }

    const result = await check(currentKey);
    if (result === true) return { type: "key", key: currentKey };
    if (result === "unavailable") {
      // Validation infra is down (or the model was retired) — don't loop forever
      // asking for a key we can't check. Offer the v1 manual scaffold instead.
      const isManualOk = await deps.confirmManual();
      if (isManualOk) return { type: "manual" };
      throw new Error("abort");
    }
    // result === false → key was actually rejected; loop and re-prompt.
  }
}
