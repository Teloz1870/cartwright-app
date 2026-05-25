import { CheckIcon, XIcon } from 'lucide-react';

const comparisonData = [
  { feature: 'Source Code Ownership', cartwright: true, saas: false },
  { feature: 'Platform Transaction Fees', cartwright: '0%', saas: '2.9% + 30¢' },
  { feature: 'Monthly Base Cost', cartwright: '$0 (Self-hosted)', saas: '$39 - $399/mo' },
  { feature: 'Next.js 16 + React 19', cartwright: true, saas: false },
  { feature: 'Built-in AI Assistant Admin', cartwright: true, saas: false },
  { feature: 'Bring Your Own Database', cartwright: true, saas: false },
  { feature: 'Vendor Lock-in', cartwright: false, saas: true },
];

export function ComparisonTable() {
  return (
    <div className="w-full mt-24">
      <div className="max-w-2xl mb-12">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-cw-terracotta">
          vs hosted SaaS
        </p>
        <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
          Why own your stack?
        </h2>
        <p className="mt-4 text-base sm:text-lg leading-relaxed text-cw-stone-500 dark:text-cw-stone-400">
          Traditional SaaS platforms rent you a store and tax your success. Cartwright gives you the keys.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-cw-stone-200 dark:border-cw-stone-800 bg-cw-stone-50/50 dark:bg-cw-stone-900/50 backdrop-blur-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-cw-stone-100 dark:bg-cw-stone-900/80 border-b border-cw-stone-200 dark:border-cw-stone-800">
            <tr>
              <th className="px-6 py-4 font-semibold text-cw-stone-900 dark:text-cw-stone-50">Feature</th>
              <th className="px-6 py-4 font-semibold text-cw-terracotta text-center">Cartwright</th>
              <th className="px-6 py-4 font-semibold text-cw-stone-500 dark:text-cw-stone-400 text-center">Shopify / SaaS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cw-stone-200 dark:divide-cw-stone-800">
            {comparisonData.map((row) => (
              <tr key={row.feature} className="transition-colors hover:bg-cw-stone-100/50 dark:hover:bg-cw-stone-800/50">
                <td className="px-6 py-4 font-medium text-cw-stone-700 dark:text-cw-stone-300">
                  {row.feature}
                </td>
                <td className="px-6 py-4 text-center">
                  {typeof row.cartwright === 'boolean' ? (
                    row.cartwright ? (
                      <CheckIcon className="mx-auto size-5 text-cw-terracotta" />
                    ) : (
                      <XIcon className="mx-auto size-5 text-cw-stone-400" />
                    )
                  ) : (
                    <span className="font-semibold text-cw-stone-900 dark:text-cw-stone-50">{row.cartwright}</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  {typeof row.saas === 'boolean' ? (
                    row.saas ? (
                      <CheckIcon className="mx-auto size-5 text-cw-stone-400" />
                    ) : (
                      <XIcon className="mx-auto size-5 text-cw-stone-400" />
                    )
                  ) : (
                    <span className="text-cw-stone-500 dark:text-cw-stone-400">{row.saas}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
