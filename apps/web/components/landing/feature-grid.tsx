import { Section, SectionHeader } from '@/components/landing/section';
import { cn } from '@/lib/cn';

const features = [
  {
    title: 'Admin panel',
    body: '12 admin routes — products, orders, content, integrations, AI prompts, analytics.',
  },
  {
    title: 'Customer storefront',
    body: '11 customer routes — landing, PDP, cart, checkout, account, magic-link auth.',
  },
  {
    title: 'MCP server',
    body: 'Built-in /api/mcp with a tool registry — agents talk to your shop natively.',
  },
  {
    title: 'AI assistant',
    body: 'Anthropic and Gemini wired in. Bring your keys, swap providers in one file.',
  },
  {
    title: 'Stripe checkout',
    body: 'DB-first secret keys. Test mode and live mode toggled from the admin.',
  },
  {
    title: 'Magic-link auth',
    body: 'NextAuth with Resend. No third-party identity vendor lock-in.',
  },
  {
    title: 'Image uploads',
    body: 'Vercel Blob, signed URLs, image variants. Drop-in, no S3 buckets.',
  },
  {
    title: 'SEO automation',
    body: 'sitemap.xml, robots.txt, OG-images via Satori, JSON-LD product schema.',
  },
  {
    title: 'Email via Resend',
    body: 'Receipts, magic-link, order updates — pre-built templates you can edit.',
  },
  {
    title: 'Sentry-ready',
    body: 'Error tracking + performance traces wired with sourcemap upload.',
  },
  {
    title: 'Brand config',
    body: 'brand.config.ts is the single source of truth: colors, copy, policies.',
  },
  {
    title: 'Industry templates',
    body: 'Switch between generic, eyewear, fashion, more — without rewriting the app.',
  },
];

export function FeatureGrid() {
  return (
    <Section>
      <SectionHeader
        eyebrow="What's in the box"
        title="A real shop, not a starter kit."
        description="Every box below is shipping code — wired, typed, and verified. Not a marketing page promise."
      />
      <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-cw-stone-200 dark:border-cw-stone-800 bg-cw-stone-200 dark:bg-cw-stone-800 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, idx) => (
          <div
            key={f.title}
            className={cn(
              'bg-cw-paper dark:bg-cw-stone-900/40 p-6 transition-colors hover:bg-cw-stone-50 dark:hover:bg-cw-stone-900',
              idx % 2 === 0 && 'sm:[&]:bg-cw-paper',
            )}
          >
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-cw-terracotta" />
              <h3 className="text-sm font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
                {f.title}
              </h3>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-cw-stone-500 dark:text-cw-stone-400">
              {f.body}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
