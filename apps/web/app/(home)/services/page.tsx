import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { contactEmail } from '@/lib/shared';
import { CheckIcon, Zap, ShieldCheck, Wrench, Globe, Rocket } from 'lucide-react';
import { ComparisonTable } from '@/components/landing/comparison-table';
import { FeatureMatrix } from '@/components/landing/feature-matrix';

export const metadata = {
  title: 'Services & Pricing',
  description: 'Hosting plans from €9/mo, done-for-you setup, and domain migration for Cartwright.',
};

const tiers = [
  {
    name: 'DIY',
    description: 'Free & open source forever. Set it up yourself.',
    price: 'Free',
    period: '',
    icon: Wrench,
    features: [
      '100% Free & Open Source (MIT)',
      'Scaffold via CLI wizard',
      'Full source code ownership',
      'Community Discord support',
      'AI Video Banners (Bring Your Own API Key)'
    ],
    cta: 'Read the docs',
    href: '/docs/getting-started/quick-start',
    variant: 'outline' as const,
  },
  {
    name: 'Starter Hosting',
    description: 'Your own Cartwright site, fully hosted and maintained. Just add products.',
    price: '€9',
    period: '/mo',
    icon: Rocket,
    features: [
      'Everything in DIY, plus:',
      'Managed Vercel deployment',
      'Turso database included',
      'Free SSL & custom domain',
      'Automatic updates',
      'Email support',
    ],
    cta: 'Get Started',
    href: `mailto:${contactEmail}?subject=Starter%20Hosting%20%E2%80%93%20%E2%82%AC9%2Fmo`,
    variant: 'primary' as const,
  },
  {
    name: 'Concierge Setup',
    description: 'We set up your entire stack and hand over the keys.',
    price: '€249',
    period: ' one-time',
    icon: Zap,
    popular: true,
    features: [
      'Everything in Starter, plus:',
      'Vercel & Turso DB provisioning',
      'Stripe & Upstash configuration',
      'GitHub repository setup',
      'Brand & theme customization',
      'Priority email support for 14 days',
    ],
    cta: 'Get Setup Help',
    href: `mailto:${contactEmail}?subject=Concierge%20Setup%20Inquiry`,
    variant: 'primary' as const,
  },
  {
    name: 'Managed Hosting',
    description: 'Focus on selling. We handle the tech, servers, and updates.',
    price: '€49',
    period: '/mo',
    icon: ShieldCheck,
    features: [
      'Everything in Concierge, plus:',
      'Fully managed Vercel & Turso hosting',
      'Automated database backups',
      'Ongoing priority email support',
      'Free minor version upgrades',
      'Magic 1-click AI Cinematic Video Banners'
    ],
    cta: 'Subscribe to Managed',
    href: `mailto:${contactEmail}?subject=Managed%20Hosting%20Inquiry`,
    variant: 'secondary' as const,
  },
];

const addons = [
  {
    name: 'Domain Migration',
    description:
      'Already have a domain elsewhere? We handle the full DNS transfer, SSL setup, and email routing so your site goes live on your own domain without any downtime.',
    price: '€199',
    period: ' one-time',
    icon: Globe,
    includes: [
      'Full DNS migration & configuration',
      'SSL certificate provisioning',
      'Email routing preservation (MX records)',
      'Zero-downtime cutover',
      'Post-migration verification & monitoring',
    ],
    cta: 'Request Migration',
    href: `mailto:${contactEmail}?subject=Domain%20Migration%20%E2%80%93%20%E2%82%AC199`,
  },
];

export default function ServicesPage() {
  return (
    <main className="relative min-h-screen overflow-hidden pb-32">
      {/* Background Pattern */}
      <div aria-hidden className="absolute inset-0 cw-grid-bg opacity-50" />
      
      <div className="relative mx-auto max-w-6xl px-6 pt-24 sm:pt-32">
        <div className="flex flex-col items-center text-center">
          <Badge tone="terracotta" className="mb-6">
            <span className="size-1.5 rounded-full bg-cw-terracotta" />
            Services & Pricing
          </Badge>
          <h1 className="max-w-3xl text-4xl sm:text-5xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
            Start from{' '}
            <span className="relative inline-block text-cw-terracotta">
              <span className="relative z-10">€9/month.</span>
              <span
                aria-hidden
                className="absolute inset-x-0 -bottom-1 h-3 bg-cw-terracotta/20 dark:bg-cw-terracotta/30 -z-0"
              />
            </span>
            {' '}Or stay free forever.
          </h1>
          <p className="mt-6 max-w-2xl text-base sm:text-lg text-cw-stone-500 dark:text-cw-stone-400">
            Cartwright is always free and open source. But if you want to skip the devops 
            and jump straight to selling, we offer hosting plans starting at just €9/month, 
            done-for-you setup, and domain migration.
          </p>
        </div>

        {/* Pricing Cards */}
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
                <div className={`p-3 rounded-2xl ${tier.popular ? 'bg-cw-terracotta/10 text-cw-terracotta' : 'bg-cw-stone-100 dark:bg-cw-stone-800 text-cw-stone-600 dark:text-cw-stone-400'}`}>
                  <tier.icon className="size-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-cw-stone-900 dark:text-cw-stone-50">
                    {tier.name}
                  </h3>
                  {tier.name !== 'DIY' && (
                    <span className="text-xs font-medium text-cw-terracotta">Early Bird Offer</span>
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
              
              <ButtonLink
                href={tier.href}
                variant={tier.variant}
                size="lg"
                className="w-full justify-center"
              >
                {tier.cta}
              </ButtonLink>
            </div>
          ))}
        </div>

        {/* Domain Migration Add-on */}
        <div className="mt-24 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge tone="terracotta" className="mb-6">
              <span className="size-1.5 rounded-full bg-cw-terracotta" />
              Add-on Service
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
              Domain Migration
            </h2>
            <p className="mt-4 text-cw-stone-500 dark:text-cw-stone-400">
              Already have a domain? We move it for you — zero downtime, zero hassle.
            </p>
          </div>

          {addons.map((addon) => (
            <div
              key={addon.name}
              className="rounded-3xl border border-cw-stone-200 dark:border-cw-stone-800 bg-cw-stone-50/50 dark:bg-cw-stone-900/50 backdrop-blur-sm overflow-hidden"
            >
              <div className="grid md:grid-cols-2 gap-0">
                {/* Left: Info */}
                <div className="p-8 sm:p-10 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-2xl bg-cw-terracotta/10 text-cw-terracotta">
                      <addon.icon className="size-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-cw-stone-900 dark:text-cw-stone-50">
                        {addon.name}
                      </h3>
                    </div>
                  </div>
                  <p className="text-cw-stone-500 dark:text-cw-stone-400 mb-6">
                    {addon.description}
                  </p>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-4xl font-bold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
                      {addon.price}
                    </span>
                    <span className="text-base text-cw-stone-500 dark:text-cw-stone-400">
                      {addon.period}
                    </span>
                  </div>
                  <ButtonLink
                    href={addon.href}
                    variant="secondary"
                    size="lg"
                    className="w-full sm:w-auto justify-center"
                  >
                    {addon.cta}
                  </ButtonLink>
                </div>

                {/* Right: What's included */}
                <div className="p-8 sm:p-10 bg-cw-stone-100/50 dark:bg-cw-stone-800/30 border-t md:border-t-0 md:border-l border-cw-stone-200 dark:border-cw-stone-800">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-cw-stone-500 dark:text-cw-stone-400 mb-6">
                    What&apos;s included
                  </h4>
                  <ul className="space-y-4 text-sm text-cw-stone-600 dark:text-cw-stone-300">
                    {addon.includes.map((item) => (
                      <li key={item} className="flex gap-3">
                        <CheckIcon className="size-5 shrink-0 text-cw-terracotta" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        <ComparisonTable />
        
        <FeatureMatrix />
      </div>
    </main>
  );
}
