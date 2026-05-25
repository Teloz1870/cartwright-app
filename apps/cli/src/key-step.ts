import { validateKey } from "./llm.js";

export type KeyModeResult = { type: "key"; key: string } | { type: "manual" };

export interface KeyStepDeps {
  getEnvKey: () => string | undefined;
  promptKey: () => Promise<string>;
  confirmManual: () => Promise<boolean>;
}

export async function resolveKeyMode(deps: KeyStepDeps): Promise<KeyModeResult> {
  let currentKey = deps.getEnvKey();

  if (currentKey) {
    const isValid = await validateKey(currentKey);
    if (isValid) return { type: "key", key: currentKey };
  }

  while (true) {
    currentKey = await deps.promptKey();
    if (!currentKey) {
      const isManualOk = await deps.confirmManual();
      if (isManualOk) return { type: "manual" };
      throw new Error("abort");
    }

    const isValid = await validateKey(currentKey);
    if (isValid) return { type: "key", key: currentKey };
  }
}
