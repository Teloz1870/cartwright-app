import Image from 'next/image';
import Link from 'next/link';
import { Section, SectionHeader } from '@/components/landing/section';

/**
 * Landing teaser for /showcase — proof the engine runs real shops, not
 * screenshots of a demo seed. The three sites here are the live canaries
 * every release passes before it ships.
 */
const sites = [
  {
    name: 'Solbrillen.dk',
    domain: 'solbrillen.dk',
    blurb:
      'The eyewear store the engine was extracted from — now running the latest template with every feature flag on.',
    image: '/showcase/solbrillen-hero.jpg',
  },
  {
    name: 'Northbound Coffee',
    domain: 'demo.cartwright.app',
    blurb:
      'The open demo shop: full storefront loop in Stripe test mode, nightly reset. Browse, edit, order freely.',
    image: '/showcase/northbound-hero.jpg',
  },
  {
    name: 'Teloz',
    domain: 'teloz.net',
    blurb:
      'The company site behind Cartwright — the same engine in website mode: no cart, just pages, run from the same admin.',
    image: null,
  },
];

export function ShowcaseTeaser() {
  return (
    <Section>
      <SectionHeader
        eyebrow="Built with Cartwright"
        title="Real sites, running the engine today."
        description="Every release ships only after these three live sites pass it — a max-features webshop, an open demo shop, and a website-mode company site."
      />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {sites.map((site) => (
          <Link
            key={site.name}
            href="/showcase"
            className="group flex flex-col overflow-hidden rounded-xl border border-cw-stone-200 dark:border-cw-stone-800 bg-cw-paper dark:bg-cw-stone-900/40 transition-colors hover:border-cw-terracotta/50"
          >
            {site.image ? (
              <div className="relative aspect-[16/9] overflow-hidden border-b border-cw-stone-200 dark:border-cw-stone-800">
                <Image
                  src={site.image}
                  alt={`${site.name} homepage`}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
            ) : (
              <div
                aria-hidden
                className="flex aspect-[16/9] items-center justify-center border-b border-cw-stone-200 dark:border-cw-stone-800 bg-cw-stone-50 dark:bg-cw-stone-900/60"
              >
                <span className="font-mono text-sm text-cw-stone-400 dark:text-cw-stone-500">
                  website mode · no cart
                </span>
              </div>
            )}
            <div className="flex flex-1 flex-col p-6">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-base font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
                  {site.name}
                </h3>
                <span className="font-mono text-xs text-cw-stone-400 dark:text-cw-stone-500 truncate">
                  {site.domain}
                </span>
              </div>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-cw-stone-500 dark:text-cw-stone-400">
                {site.blurb}
              </p>
              <p className="mt-4 text-sm font-medium text-cw-terracotta">
                See it in the showcase →
              </p>
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}
