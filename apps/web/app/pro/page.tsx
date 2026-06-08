import type { Metadata } from 'next';
import Link from 'next/link';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { SiteFooter } from '@/components/landing/cta-footer';
import { Section, SectionHeader } from '@/components/landing/section';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { baseOptions } from '@/lib/layout.shared';
import { PARTS } from '@/lib/parts-data';
import { PartSchematic } from '@/components/parts/part-schematic';

export const metadata: Metadata = {
  title: 'Cartwright Pro — breakthrough elements',
  description:
    'Cartwright Pro is the breakthrough layer: interactive elements no $5 template has — a live "build-your-own" configurator, scroll-cinema, a 3D product showroom — plus complete super-pro designs where frontend and backend stand sharp together. $100k-feeling, priced for everyone.',
  alternates: { canonical: '/pro' },
  openGraph: {
    title: 'Cartwright Pro — breakthrough elements',
    description:
      'The breakthrough layer: a live configurator, scroll-cinema, a 3D product showroom + complete super-pro designs. $100k-feeling, priced for everyone.',
    url: 'https://cartwright.app/pro',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cartwright Pro — breakthrough elements',
    description: 'A live configurator, scroll-cinema, a 3D product showroom + complete super-pro designs.',
  },
};

const proParts = PARTS.filter((p) => p.pro);

const valuePoints = [
  {
    t: 'Living, not dead',
    b: 'Every Pro element adapts to your brand — palette, copy (Voice/genome), and palette-reactive 3D. The same element renders in each shop’s own colours, automatically.',
  },
  {
    t: 'Complete, not a homepage',
    b: 'Super-pro designs own every page — home, contact, FAQ, 404, and the shop — with matching chrome. Frontend and backend that stand sharp together.',
  },
  {
    t: 'Breakthrough, not borrowed',
    b: 'Interactive primitives no $5 template ships: a live configurator, scroll-cinema, a 3D showroom. The kind of thing people copy — and the reason they choose Cartwright.',
  },
];

export default function ProPage() {
  return (
    <HomeLayout {...baseOptions()}>
      <Section className="relative overflow-hidden">
        <Badge tone="terracotta" className="mb-6">
          ⭐ Cartwright Pro
        </Badge>
        <SectionHeader
          title="$100k design, priced for everyone."
          description="Pro is the breakthrough layer on top of Cartwright. Interactive elements no $5 template has — a live build-your-own configurator, scroll-cinema, a 3D product showroom — plus complete super-pro designs where the frontend and backend stand sharp together. Buy an element for the price of a coffee, or get them all with Pro."
        />
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/parts" variant="primary">
            Browse the Pro parts →
          </ButtonLink>
          <ButtonLink href="/designs" variant="secondary">
            See the designs
          </ButtonLink>
        </div>
      </Section>

      <Section className="bg-cw-stone-50 dark:bg-cw-stone-900/30">
        <SectionHeader
          eyebrow={`${proParts.length} Pro elements`}
          title="The breakthrough elements"
          description="Drop them onto any page in the Visual Builder. Each is palette-adaptive, accessible, and performance-safe out of the box."
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {proParts.map((p) => (
            <div
              key={p.key}
              className="flex flex-col gap-4 rounded-2xl border border-cw-stone-200 bg-white p-5 dark:border-cw-stone-700 dark:bg-cw-stone-900"
            >
              <PartSchematic shape={p.shape} />
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-cw-stone-900 dark:text-cw-stone-50">{p.label}</h3>
                <span className="rounded-full bg-cw-terracotta px-2 py-0.5 text-[11px] font-semibold text-white">
                  ⭐ Pro
                </span>
                {p.is3d ? <Badge tone="oker">3D</Badge> : null}
              </div>
              <p className="flex-1 text-sm leading-relaxed text-cw-stone-500 dark:text-cw-stone-400">
                {p.description}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeader eyebrow="Why Pro" title="Three reasons it isn’t a template." />
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {valuePoints.map((v) => (
            <div
              key={v.t}
              className="rounded-2xl border border-cw-stone-200 bg-white p-6 dark:border-cw-stone-700 dark:bg-cw-stone-900"
            >
              <h3 className="text-base font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
                {v.t}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-cw-stone-500 dark:text-cw-stone-400">{v.b}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="bg-cw-stone-50 dark:bg-cw-stone-900/30">
        <SectionHeader
          eyebrow="Pricing"
          title="$5 an element. Or all of it in Pro."
          description="Pay once for the one element you need, or unlock the whole Pro library — every breakthrough element and every super-pro design — with a single Pro upgrade. No platform tax, no per-order fee. You own the code."
        />
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/parts" variant="primary">
            Explore the parts →
          </ButtonLink>
          <Link
            href="/docs/getting-started/quick-start"
            className="inline-flex items-center rounded-full border border-cw-stone-300 px-5 py-2.5 text-sm font-medium text-cw-stone-700 transition-colors hover:border-cw-terracotta/50 dark:border-cw-stone-600 dark:text-cw-stone-300"
          >
            Start a project
          </Link>
        </div>
      </Section>

      <SiteFooter />
    </HomeLayout>
  );
}
