import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { contactEmail } from '@/lib/shared';
import { CheckIcon, Zap, ShieldCheck, Wrench } from 'lucide-react';
import { ComparisonTable } from '@/components/landing/comparison-table';
import { FeatureMatrix } from '@/components/landing/feature-matrix';

export const metadata = {
  title: 'Services & Pricing',
  description: 'Done-for-you setup and managed hosting for Cartwright.',
};

const tiers = [
  {
    name: 'DIY',
    description: 'Free & open source forever. Set it up yourself.',
    price: 'Free',
    icon: Wrench,
    features: [
      '100% Free & Open Source (MIT)',
      'Scaffold via CLI wizard',
      'Full source code ownership',
      'Community Discord support',
    ],
    cta: 'Read the docs',
    href: '/docs/getting-started/quick-start',
    variant: 'outline' as const,
  },
  {
    name: 'Concierge Setup',
    description: 'We set up your entire stack and hand over the keys.',
    price: '€499',
    icon: Zap,
    popular: true,
    features: [
      'Everything in DIY, plus:',
      'Vercel & Turso DB provisioning',
      'Stripe & Upstash configuration',
      'GitHub repository setup',
      'Priority email support for 14 days',
    ],
    cta: 'Get Setup Help',
    href: `mailto:${contactEmail}?subject=Concierge%20Setup%20Inquiry`,
    variant: 'primary' as const,
  },
  {
    name: 'Managed Hosting',
    description: 'Focus on selling. We handle the tech and servers.',
    price: '€99/mo',
    icon: ShieldCheck,
    features: [
      'Everything in Concierge, plus:',
      'Fully managed Vercel & Turso hosting',
      'Automated database backups',
      'Ongoing email support',
      'Free minor version upgrades',
    ],
    cta: 'Subscribe to Managed',
    href: `mailto:${contactEmail}?subject=Managed%20Hosting%20Inquiry`,
    variant: 'secondary' as const,
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
            Done-for-you Services
          </Badge>
          <h1 className="max-w-3xl text-4xl sm:text-5xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
            Focus on selling.{' '}
            <span className="relative inline-block text-cw-terracotta">
              <span className="relative z-10">We handle the tech.</span>
              <span
                aria-hidden
                className="absolute inset-x-0 -bottom-1 h-3 bg-cw-terracotta/20 dark:bg-cw-terracotta/30 -z-0"
              />
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-base sm:text-lg text-cw-stone-500 dark:text-cw-stone-400">
            Cartwright is always free and open source. But if you want to skip the devops 
            and jump straight to selling, we offer premium setup and managed hosting services.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mt-20 grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
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
                <h3 className="text-xl font-semibold text-cw-stone-900 dark:text-cw-stone-50">
                  {tier.name}
                </h3>
              </div>
              
              <p className="text-sm text-cw-stone-500 dark:text-cw-stone-400 min-h-[40px]">
                {tier.description}
              </p>
              
              <div className="my-8">
                <span className="text-4xl font-bold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
                  {tier.price}
                </span>
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

        <ComparisonTable />
        
        <FeatureMatrix />
      </div>
    </main>
  );
}
