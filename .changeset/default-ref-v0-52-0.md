---
"create-cartwright": minor
---

Scaffold from engine v0.52.2.

This is a prerequisite, not a routine bump. v0.52.0 is where the currency and
locale work landed — and the country/currency prompt this release adds is what
lets a user pick USD in the first place. Measured against the two refs: a USD
scaffold from v0.51.1 fails 25 assertions, from v0.52.2 it fails none. Shipping
the prompt while still pointing at v0.51.1 would have handed a new user a red
suite for choosing the option we just gave them.
