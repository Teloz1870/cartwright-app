---
"create-cartwright": patch
---

Personalize the v2 AI shop's homepage hero with the brief's brand.

The active homepage (designs/webshop-classic/homepage.tsx) hardcoded "Your shop starts here" and the hero sub-headline only showed a generic default, so a v2 shop's landing didn't reflect the brand even after the palette + catalog were applied. `injectBriefFiles` now seeds `BrandingSettings.tagline` from the brief (drives the hero sub-headline) and swaps the hardcoded H1 for the brief's store name. The landing now reads e.g. "KaffeMekka" / "Din destination for kvalitetskaffe." in the brand palette.
