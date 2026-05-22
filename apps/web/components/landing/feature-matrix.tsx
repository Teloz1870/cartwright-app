import React from 'react';
import { CheckIcon, MinusIcon } from 'lucide-react';

const featureMatrix = [
  {
    category: 'Core Features',
    features: [
      { name: 'MIT Open Source License', diy: true, concierge: true, managed: true },
      { name: 'Next.js 16 + React 19', diy: true, concierge: true, managed: true },
      { name: 'Built-in AI Assistant', diy: true, concierge: true, managed: true },
      { name: '0% Platform Transaction Fees', diy: true, concierge: true, managed: true },
    ]
  },
  {
    category: 'Setup & Infrastructure',
    features: [
      { name: 'Custom Domain Setup', diy: false, concierge: true, managed: true },
      { name: 'Vercel Deployment Configuration', diy: false, concierge: true, managed: true },
      { name: 'Turso Database Provisioning', diy: false, concierge: true, managed: true },
      { name: 'Stripe Webhooks Integration', diy: false, concierge: true, managed: true },
      { name: 'Transactional Email Setup', diy: false, concierge: true, managed: true },
    ]
  },
  {
    category: 'Hosting & Support',
    features: [
      { name: 'Vercel & Turso Hosting Costs', diy: false, concierge: false, managed: true },
      { name: 'Automated Database Backups', diy: false, concierge: false, managed: true },
      { name: 'Ongoing Email Support', diy: false, concierge: '14 Days', managed: true },
      { name: 'Free Minor Upgrades', diy: false, concierge: false, managed: true },
    ]
  }
];

export function FeatureMatrix() {
  return (
    <div className="w-full max-w-5xl mx-auto mt-24 px-6">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
          Compare the packages
        </h2>
        <p className="mt-4 text-cw-stone-500 dark:text-cw-stone-400">
          Everything you need to know to make the right choice for your business.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-cw-stone-200 dark:border-cw-stone-800 bg-cw-stone-50/50 dark:bg-cw-stone-900/50 backdrop-blur-sm">
        <table className="w-full text-left text-sm min-w-[600px]">
          <thead className="bg-cw-stone-100 dark:bg-cw-stone-900/80 border-b border-cw-stone-200 dark:border-cw-stone-800">
            <tr>
              <th className="px-6 py-4 font-semibold text-cw-stone-900 dark:text-cw-stone-50 w-2/5">Features</th>
              <th className="px-6 py-4 font-semibold text-cw-stone-500 dark:text-cw-stone-400 text-center w-1/5">DIY</th>
              <th className="px-6 py-4 font-semibold text-cw-stone-900 dark:text-cw-stone-50 text-center w-1/5">Concierge Setup</th>
              <th className="px-6 py-4 font-semibold text-cw-terracotta text-center w-1/5">Managed Hosting</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cw-stone-200 dark:divide-cw-stone-800">
            {featureMatrix.map((section) => (
              <React.Fragment key={section.category}>
                <tr className="bg-cw-stone-100/50 dark:bg-cw-stone-800/30">
                  <td colSpan={4} className="px-6 py-3 font-semibold text-cw-stone-900 dark:text-cw-stone-50 text-xs uppercase tracking-wider">
                    {section.category}
                  </td>
                </tr>
                {section.features.map((row) => (
                  <tr key={row.name} className="transition-colors hover:bg-cw-stone-100/50 dark:hover:bg-cw-stone-800/50">
                    <td className="px-6 py-4 font-medium text-cw-stone-700 dark:text-cw-stone-300">
                      {row.name}
                    </td>
                    
                    {/* DIY */}
                    <td className="px-6 py-4 text-center">
                      {typeof row.diy === 'boolean' ? (
                        row.diy ? <CheckIcon className="mx-auto size-5 text-cw-stone-400" /> : <MinusIcon className="mx-auto size-5 text-cw-stone-300 dark:text-cw-stone-700" />
                      ) : (
                        <span className="text-cw-stone-500 dark:text-cw-stone-400">{row.diy}</span>
                      )}
                    </td>
                    
                    {/* Concierge */}
                    <td className="px-6 py-4 text-center">
                      {typeof row.concierge === 'boolean' ? (
                        row.concierge ? <CheckIcon className="mx-auto size-5 text-cw-stone-900 dark:text-cw-stone-50" /> : <MinusIcon className="mx-auto size-5 text-cw-stone-300 dark:text-cw-stone-700" />
                      ) : (
                        <span className="font-semibold text-cw-stone-900 dark:text-cw-stone-50">{row.concierge}</span>
                      )}
                    </td>
                    
                    {/* Managed */}
                    <td className="px-6 py-4 text-center">
                      {typeof row.managed === 'boolean' ? (
                        row.managed ? <CheckIcon className="mx-auto size-5 text-cw-terracotta" /> : <MinusIcon className="mx-auto size-5 text-cw-stone-300 dark:text-cw-stone-700" />
                      ) : (
                        <span className="font-semibold text-cw-terracotta">{row.managed}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
