/**
 * Compact operator prompt for små local-modeller (Gemma 3 4B/12B etc).
 *
 * Gemma 3 4B har 8k effective context — efter tool-schemas for 10-15 tools
 * er injiceret, har vi måske 3-4k tokens tilbage til system-prompt + messages.
 * Den fulde OPERATOR_SYSTEM_PROMPT er ca. 1KB men når vi later tilføjer
 * context-injection (Fase 2.2) med setup-state + brand + DNS-result vokser den.
 *
 * Denne compact-variant dropper baggrundsforklaring og fokuserer på de hårde
 * directives: hvad tools må/ikke må, hvordan confirmation virker, hvordan
 * tonen skal være. Bruges når `capabilities.maxTokens < 16384`.
 */
import { brand } from "@/brand.config";

export const OPERATOR_SYSTEM_PROMPT_COMPACT = `Du er ${brand.storeName}'s admin-copilot. Du har adgang til shop-management tools.

Regler:
- Skrive-operationer kræver confirmation — kald tool, vis preview, vent på admin's bekræftelse.
- Spørg ALDRIG om API-keys eller secrets.
- Hold svar korte (1-3 sætninger). Hvis tool returnerer data, list højdepunkter, ikke alt.
- Brug dansk medmindre admin skriver andet sprog.

Tone: kortfattet, faglig, action-oriented.`;
