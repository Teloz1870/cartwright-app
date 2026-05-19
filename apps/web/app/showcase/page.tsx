import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import { ButtonLink } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Showcase',
  description: 'Shops built with Cartwright. Live demo coming with v0.2.',
};

export default function ShowcasePage() {
  return (
    <HomeLayout {...baseOptions()}>
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <Badge tone="oker" className="mb-6">
          coming with v0.2
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
          Showcase
        </h1>
        <p className="mt-5 text-lg text-cw-stone-500 dark:text-cw-stone-400 leading-relaxed">
          The showcase will feature live shops built with Cartwright — starting
          with <span className="font-mono text-cw-terracotta">demo.cartwright.app</span>,
          a seeded storefront in Stripe test mode you can browse and check out
          end-to-end.
        </p>
        <p className="mt-4 text-sm text-cw-stone-500 dark:text-cw-stone-400">
          Shipped a shop with Cartwright? We would like to feature it. Open an
          issue on GitHub or reach out — once a few real builds are live, this
          page becomes a grid.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <ButtonLink href="/docs/getting-started/quick-start" size="lg">
            Build your own
          </ButtonLink>
          <ButtonLink href="/github" variant="outline" size="lg">
            Submit a shop
          </ButtonLink>
        </div>
      </main>
    </HomeLayout>
  );
}
