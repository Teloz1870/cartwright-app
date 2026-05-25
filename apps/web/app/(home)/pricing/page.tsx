import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { WaitlistForm } from '@/components/landing/waitlist-form';
import { contactEmail } from '@/lib/shared';
import {
  CheckIcon,
  Wrench,
  Sparkles,
  Cloud,
  Building2,
  Zap,
  Globe,
  Cpu,
} from 'lucide-react';
import { ComparisonTable } from '@/components/landing/comparison-table';
import { FeatureMatrix } from '@/components/landing/feature-matrix';

export const metadata = {
  title: 'Pricing',
  description:
    'Cartwright is MIT and free, forever. Optional paid tiers (Plus $49/mo, Cloud $199/mo, Enterprise) layer hosted services on top.',
};

type Tier = {
  name: string;
  description: string;
  price: string;
  period: string;
  icon: typeof Wrench;
  features: string[];
  popular?: boolean;
  comingSoon?: string;
  cta:
    | { kind: 'link'; href: string; label: string; variant: 'primary' | 'secondary' | 'outline' }
    | { kind: 'waitlist'; tier: 'plus' | 'cloud'; label: string };
};

const tiers: Tier[] = [
  {
    name: 'Self-hosted',
    description: 'The full template, MIT-licensed, forever. You wire your own services.',
    price: '$0',
    period: '',
    icon: Wrench,
    features: [
      '100% MIT, full source ownership',
      'Scaffold via `create-cartwright` CLI',
      'Storefront, admin, MCP server',
      'Bring your own Vercel, DB, Stripe, AI key',
      'Community Discord + GitHub Issues',
    ],
    cta: {
      kind: 'link',
      href: '/docs/getting-started/quick-start',
      label: 'Read the docs',
      variant: 'outline',
    },
  },
  {
    name: 'Cartwright Plus',
    description: 'Premium integrations, support, and tooling. You still self-host.',
    price: '$49',
    period: '/mo',
    icon: Sparkles,
    popular: true,
    comingSoon: 'Launching Q3 2026',
    features: [
      'Everything in Self-hosted, plus:',
      'Premium industry packs (fashion, beauty, electronics, home, food)',
      'Premium MCP integrations (Klaviyo, Mailchimp, QuickBooks, Notion sync)',
      'Shopify migration toolkit',
      'Priority email support (24h SLA)',
      'Unified analytics dashboard',
      'Auto-upgrade tooling (`cartwright upgrade`)',
    ],
    cta: { kind: 'waitlist', tier: 'plus', label: 'Join waitlist' },
  },
  {
    name: 'Cartwright Cloud',
    description: 'We run your shop for you. You ship products.',
    price: '$199',
    period: '/mo',
    icon: Cloud,
    comingSoon: 'Launching Q4 2026',
    features: [
      'Everything in Plus, plus:',
      'Fully managed Vercel + Turso',
      'Automated DB backups + monitoring',
      'Free SSL + custom domain setup',
      'White-glove migration from Shopify',
      'Hosted admin at admin.cartwright.app',
    ],
    cta: { kind: 'waitlist', tier: 'cloud', label: 'Join waitlist' },
  },
  {
    name: 'Enterprise',
    description: 'Multi-shop, SLA, custom integrations — built around your team.',
    price: 'Custom',
    period: '',
    icon: Building2,
    features: [
      'Everything in Cloud, plus:',
      'Multi-shop / multi-tenant',
      '4h support SLA',
      'Custom MCP tools + integrations',
      'Dedicated success manager',
      'Security review + DPA on request',
    ],
    cta: {
      kind: 'link',
      href: `mailto:${contactEmail}?subject=Cartwright%20Enterprise%20inquiry`,
      label: 'Contact us',
      variant: 'primary',
    },
  },
];

type Addon = {
  name: string;
  description: string;
  price: string;
  period: string;
  icon: typeof Wrench;
  includes: string[];
  cta: { href: string; label: string };
};

const addons: Addon[] = [
  {
    name: 'AI Credits Pack',
    description:
      'Anthropic + Gemini credits delivered via Vercel AI Gateway. Skip the BYOK setup and the per-provider quota juggling. Stack on any tier.',
    price: '$25',
    period: '/mo',
    icon: Cpu,
    includes: [
      'Pooled credits across Claude and Gemini',
      'Routed through Vercel AI Gateway',
      'Usage dashboard + spend alerts',
      'No vendor account setup required',
      'Cancel anytime',
    ],
    cta: {
      href: `mailto:${contactEmail}?subject=AI%20Credits%20Pack%20-%20%2425%2Fmo`,
      label: 'Request access',
    },
  },
  {
    name: 'Concierge Setup',
    description:
      'We set up your entire stack and hand over the keys: Vercel, Turso, Stripe, Upstash, GitHub, brand theme. You start at a working shop.',
    price: '$249',
    period: ' one-time',
    icon: Zap,
    includes: [
      'Vercel + Turso DB provisioning',
      'Stripe + Upstash configuration',
      'GitHub repository setup',
      'Brand + theme customization',
      'Priority email support for 14 days',
    ],
    cta: {
      href: `mailto:${contactEmail}?subject=Concierge%20Setup%20Inquiry`,
      label: 'Get setup help',
    },
  },
  {
    name: 'Domain Migration',
    description:
      'Already have a domain elsewhere? We handle the full DNS transfer, SSL setup, and email routing so your site goes live without downtime.',
    price: '$199',
    period: ' one-time',
    icon: Globe,
    includes: [
      'Full DNS migration + configuration',
      'SSL certificate provisioning',
      'Email routing preservation (MX records)',
      'Zero-downtime cutover',
      'Post-migration verification + monitoring',
    ],
    cta: {
      href: `mailto:${contactEmail}?subject=Domain%20Migration%20-%20%24199`,
      label: 'Request migration',
    },
  },
];

export default function ServicesPage() {
  return (
    <main className="relative min-h-screen overflow-hidden pb-32">
      {/* Background pattern */}
      <div aria-hidden className="absolute inset-0 cw-grid-bg opacity-50" />

      <div className="relative mx-auto max-w-6xl px-6 pt-24 sm:pt-32">
        {/* Hero */}
        <div className="flex flex-col items-center text-center">
          <Badge tone="terracotta" className="mb-6">
            <span className="size-1.5 rounded-full bg-cw-terracotta" />
            Pricing
          </Badge>
          <h1 className="max-w-3xl text-4xl sm:text-5xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
            Free forever.{' '}
            <span className="relative inline-block text-cw-terracotta">
              <span className="relative z-10">Paid when you want it.</span>
              <span
                aria-hidden
                className="absolute inset-x-0 -bottom-1 h-3 bg-cw-terracotta/20 dark:bg-cw-terracotta/30 -z-0"
              />
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-base sm:text-lg text-cw-stone-500 dark:text-cw-stone-400">
            The Cartwright template is MIT and free, forever. If you want hosted
            services, premium integrations, or someone running it for you, layer
            on a paid tier. The template itself is never paywalled.
          </p>
        </div>

        {/* Tier grid */}
        <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-3xl p-8 backdrop-blur-sm transition-all duration-300 hover:shadow-xl ${
                tier.popular
                  ? 'bg-cw-stone-50/80 dark:bg-cw-stone-900/80 border-2 border-cw-terracotta/50 shadow-lg'
                  : 'bg-cw-stone-50/50 dark:bg-cw-stone-900/50 border border-cw-stone-200 dark:border-cw-stone-800'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 inset-x-0 flex justify-center">
                  <span className="rounded-full bg-cw-terracotta px-4 py-1 text-xs font-semibold tracking-wide text-white uppercase shadow-sm">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6 flex items-center gap-4">
                <div
                  className={`p-3 rounded-2xl ${
                    tier.popular
                      ? 'bg-cw-terracotta/10 text-cw-terracotta'
                      : 'bg-cw-stone-100 dark:bg-cw-stone-800 text-cw-stone-600 dark:text-cw-stone-400'
                  }`}
                >
                  <tier.icon className="size-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-cw-stone-900 dark:text-cw-stone-50">
                    {tier.name}
                  </h3>
                  {tier.comingSoon && (
                    <span className="text-xs font-medium text-cw-terracotta">
                      {tier.comingSoon}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm text-cw-stone-500 dark:text-cw-stone-400 min-h-[40px]">
                {tier.description}
              </p>

              <div className="my-8">
                <span className="text-4xl font-bold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
                  {tier.price}
                </span>
                {tier.period && (
                  <span className="text-base text-cw-stone-500 dark:text-cw-stone-400">
                    {tier.period}
                  </span>
                )}
              </div>

              <ul className="mb-8 flex-1 space-y-4 text-sm text-cw-stone-600 dark:text-cw-stone-300">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-3">
                    <CheckIcon className="size-5 shrink-0 text-cw-terracotta" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {tier.cta.kind === 'link' ? (
                <ButtonLink
                  href={tier.cta.href}
                  variant={tier.cta.variant}
                  size="lg"
                  className="w-full justify-center"
                >
                  {tier.cta.label}
                </ButtonLink>
              ) : (
                <WaitlistForm tier={tier.cta.tier} ctaLabel={tier.cta.label} />
              )}
            </div>
          ))}
        </div>

        {/* Add-ons */}
        <div className="mt-32 max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge tone="terracotta" className="mb-6">
              <span className="size-1.5 rounded-full bg-cw-terracotta" />
              Add-ons
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
              Stack on any tier
            </h2>
            <p className="mt-4 text-cw-stone-500 dark:text-cw-stone-400">
              One-time services and recurring extras. Works with self-hosted or
              any paid tier.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {addons.map((addon) => (
              <div
                key={addon.name}
                className="flex flex-col rounded-3xl border border-cw-stone-200 dark:border-cw-stone-800 bg-cw-stone-50/50 dark:bg-cw-stone-900/50 backdrop-blur-sm p-8"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-cw-terracotta/10 text-cw-terracotta">
                    <addon.icon className="size-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-cw-stone-900 dark:text-cw-stone-50">
                    {addon.name}
                  </h3>
                </div>

                <p className="text-sm text-cw-stone-500 dark:text-cw-stone-400 mb-4">
                  {addon.description}
                </p>

                <div className="mb-6">
                  <span className="text-3xl font-bold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
                    {addon.price}
                  </span>
                  <span className="text-sm text-cw-stone-500 dark:text-cw-stone-400">
                    {addon.period}
                  </span>
                </div>

                <ul className="mb-6 flex-1 space-y-3 text-sm text-cw-stone-600 dark:text-cw-stone-300">
                  {addon.includes.map((item) => (
                    <li key={item} className="flex gap-2">
                      <CheckIcon className="size-4 shrink-0 mt-0.5 text-cw-terracotta" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <ButtonLink
                  href={addon.cta.href}
                  variant="outline"
                  size="md"
                  className="w-full justify-center"
                >
                  {addon.cta.label}
                </ButtonLink>
              </div>
            ))}
          </div>
        </div>

        {/* Trust strip */}
        <div className="mt-24 max-w-3xl mx-auto rounded-2xl border border-cw-stone-200 dark:border-cw-stone-800 bg-cw-stone-50/50 dark:bg-cw-stone-900/50 p-8 text-center">
          <h2 className="text-xl font-semibold text-cw-stone-900 dark:text-cw-stone-50">
            The template is MIT. Always.
          </h2>
          <p className="mt-3 text-sm text-cw-stone-500 dark:text-cw-stone-400">
            Paid tiers add hosted services, premium integrations, and support.
            They never gate features inside the template itself. You can cancel
            and keep running your shop — your code, your database, your
            customers.
          </p>
        </div>

        <ComparisonTable />

        <FeatureMatrix />
      </div>
    </main>
  );
}
