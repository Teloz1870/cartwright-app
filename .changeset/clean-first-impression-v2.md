---
"create-cartwright": patch
---

Scaffold overlay v2 — remove the last three Teloz/Danish traces from a cold scaffold's /en welcome page: neutralize the Teloz agency paragraph in messages/{en,da}.json (SaaSHome.cartwrightDesc2), set footer.githubUrl to "" and gate the footer "GitHub Profile" block on it, and route the AI assistant button's website-mode texts through brand.ai.* instead of hardcoded Danish fallbacks. All patches are fail-soft (anchored exact-string, warn on template drift) in the established applyFirstImpressionPatches style.
