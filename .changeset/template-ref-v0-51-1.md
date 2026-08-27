---
"create-cartwright": patch
---

Scaffold from engine v0.51.1. The v0.51.0 tree failed the full-profile scaffold gate (a shipped test hardcoded `webMcp === false`, which is wrong for the webshop templates that now scaffold with the flag on); v0.51.1 fixes the assertion and restores release coherence. Gate against the new ref: light/site/full 3/3.
