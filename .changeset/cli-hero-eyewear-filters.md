---
"create-cartwright": patch
---

Polish the default storefront: no hero-video 404, no empty eyewear filters.

- The template's `HeroVideo` hardcodes `<source>` tags for `/hero/hero-v4.webm`+`.mp4`, demo-specific assets not shipped in the base template, so a fresh scaffold 404s twice on the homepage. The scaffolder now removes those `<source>` tags from the customer copy, leaving a poster-only hero (no network request, no 404).
- The catalog filters rendered "Frame color" / "Lens color" selects unconditionally — eyewear-specific fields that appear as empty dropdowns on non-eyewear shops. They're now wrapped in a length guard, so they only show when the shop actually has those attributes.

Both are wrapping/removal edits that keep all referenced variables in use, so the customer's build is unaffected.
