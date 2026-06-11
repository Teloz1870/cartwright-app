---
"create-cartwright": minor
---

English-first scaffolds + first-run welcome activation. Every scaffold is now born en-only (`locales: ["en"]`, `defaultLocale: "en"`, English footer copy, `"<Store> · All rights reserved."` disclaimer) with neutral website hero copy (`"Welcome to <Store>"` instead of the upstream Teloz studio pitch). The seed codemod flips `setupComplete: true → false` so the documented first-login → `/admin/setup` wizard actually fires, and `firstRunWelcome` is flipped on when the template ships it (templates ≤ v0.35.1 warn + skip — fail-soft both ways). Success output now points at `/en` and notes how to add languages back.
