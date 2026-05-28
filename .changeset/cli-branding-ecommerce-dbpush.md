---
"create-cartwright": patch
---

Make a fresh scaffold's identity, DB setup and config internally consistent.

- **Branding leak:** the scaffolder only replaced `storeName`/`storeSlug`, so every project (including the v2 AI path) shipped the upstream template's Teloz identity — `metadata.title: "Teloz Agency"`, `domain`/`url` `teloz.net`, and `@teloz.net` contact + seeded-admin emails (the seed creates its admin user from `brand.emails.admin`). `patchBrandConfigContent` now also neutralizes the SEO title/description, domain, URL and email addresses based on the project name (`example.com` placeholders).
- **Inconsistent ecommerce flag:** a `webshop`/`generic` scaffold left `ecommerceEnabled: false` while `mode: "webshop"`, so the storefront rendered with cart + product nav gated off. `ecommerceEnabled` now tracks the template's `webshop` feature.
- **DB setup:** the printed next steps used `prisma migrate deploy`, which fails on a fresh DB due to migration-history drift. They now use `prisma db push` (the correct path for a brand-new project), and an "Admin login" hint explains the magic-link `.mail-previews/` flow.
