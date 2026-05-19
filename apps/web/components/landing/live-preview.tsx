import Link from 'next/link';
import { Section, SectionHeader } from '@/components/landing/section';
import { Badge } from '@/components/ui/badge';

export function LivePreview() {
  return (
    <Section className="bg-cw-stone-50 dark:bg-cw-stone-900/30">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] items-center">
        <div>
          <SectionHeader
            eyebrow="Live demo"
            title="A real cartwright shop, running in Stripe test mode."
            description="Browse the storefront, drop products in the cart, check out with 4242 4242 4242 4242 — and inspect the admin afterwards. It’s the same template you scaffold."
          />
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="https://demo.cartwright.app"
              className="inline-flex h-11 items-center gap-2 rounded-md bg-cw-stone-900 px-5 text-sm font-medium text-cw-stone-50 hover:bg-cw-stone-700 dark:bg-cw-stone-50 dark:text-cw-stone-900 dark:hover:bg-cw-stone-200 transition-colors"
            >
              Open demo.cartwright.app
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M6 3h7v7M13 3 4 12" />
              </svg>
            </Link>
            <Badge tone="oker">test mode — nightly reset</Badge>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-xl border border-cw-stone-200 dark:border-cw-stone-800 bg-cw-paper dark:bg-cw-stone-900 shadow-2xl shadow-cw-stone-900/10 overflow-hidden">
            <div className="flex items-center gap-2 border-b border-cw-stone-200 dark:border-cw-stone-800 bg-cw-stone-100/60 dark:bg-cw-stone-900 px-4 py-2.5">
              <span className="size-2.5 rounded-full bg-cw-stone-300 dark:bg-cw-stone-700" />
              <span className="size-2.5 rounded-full bg-cw-stone-300 dark:bg-cw-stone-700" />
              <span className="size-2.5 rounded-full bg-cw-stone-300 dark:bg-cw-stone-700" />
              <div className="ml-3 flex-1 rounded-md bg-cw-paper dark:bg-cw-ink border border-cw-stone-200 dark:border-cw-stone-800 px-2.5 py-1 text-[11px] font-mono text-cw-stone-500 dark:text-cw-stone-400">
                demo.cartwright.app/produkter
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 p-5 bg-cw-paper dark:bg-cw-stone-900">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="aspect-square rounded-lg border border-cw-stone-200 dark:border-cw-stone-800 bg-gradient-to-br from-cw-stone-100 to-cw-stone-200 dark:from-cw-stone-800 dark:to-cw-stone-900 flex items-end p-3"
                >
                  <div className="space-y-1.5 w-full">
                    <div className="h-1.5 w-3/4 rounded bg-cw-stone-300 dark:bg-cw-stone-700" />
                    <div className="h-1.5 w-1/3 rounded bg-cw-terracotta/60" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div
            aria-hidden
            className="absolute -inset-6 -z-10 bg-gradient-to-tr from-cw-terracotta/0 via-cw-terracotta/10 to-cw-oker/10 blur-3xl"
          />
        </div>
      </div>
    </Section>
  );
}
