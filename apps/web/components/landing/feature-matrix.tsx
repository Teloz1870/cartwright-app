import React from 'react';
import { CheckIcon, MinusIcon } from 'lucide-react';

type Cell = boolean | string;

interface Row {
  name: string;
  selfHosted: Cell;
  plus: Cell;
  cloud: Cell;
  enterprise: Cell;
}

interface Section {
  category: string;
  features: Row[];
}

const featureMatrix: Section[] = [
  {
    category: 'Core template',
    features: [
      { name: 'MIT-licensed source code',           selfHosted: true, plus: true, cloud: true, enterprise: true },
      { name: 'Next.js 16 + React 19',              selfHosted: true, plus: true, cloud: true, enterprise: true },
      { name: 'Built-in MCP server',                selfHosted: true, plus: true, cloud: true, enterprise: true },
      { name: '0% platform transaction fee',        selfHosted: true, plus: true, cloud: true, enterprise: true },
      { name: 'All 15 service integrations',        selfHosted: true, plus: true, cloud: true, enterprise: true },
    ],
  },
  {
    category: 'Premium integrations',
    features: [
      { name: 'Industry packs (fashion, beauty, electronics, home, food)', selfHosted: false, plus: true, cloud: true, enterprise: true },
      { name: 'Klaviyo + Mailchimp + QuickBooks + Notion MCP',             selfHosted: false, plus: true, cloud: true, enterprise: true },
      { name: 'Shopify migration toolkit',                                  selfHosted: false, plus: true, cloud: true, enterprise: true },
      { name: 'cartwright upgrade tooling',                                 selfHosted: false, plus: true, cloud: true, enterprise: true },
    ],
  },
  {
    category: 'Managed hosting',
    features: [
      { name: 'Vercel + Turso provisioned for you',  selfHosted: false, plus: false, cloud: true, enterprise: true },
      { name: 'Automated DB backups + monitoring',   selfHosted: false, plus: false, cloud: true, enterprise: true },
      { name: 'Free SSL + custom domain setup',      selfHosted: false, plus: false, cloud: true, enterprise: true },
      { name: 'White-glove Shopify migration',       selfHosted: false, plus: false, cloud: true, enterprise: true },
    ],
  },
  {
    category: 'Enterprise',
    features: [
      { name: 'Multi-shop / multi-tenant',          selfHosted: false, plus: false, cloud: false, enterprise: true },
      { name: 'Custom MCP tools + integrations',    selfHosted: false, plus: false, cloud: false, enterprise: true },
      { name: 'Support SLA',                        selfHosted: 'community', plus: '24h email', cloud: '24h email', enterprise: '4h dedicated' },
      { name: 'Security review + DPA on request',   selfHosted: false, plus: false, cloud: false, enterprise: true },
    ],
  },
];

function renderCell(value: Cell, accent: boolean) {
  if (typeof value === 'boolean') {
    return value ? (
      <CheckIcon className={`mx-auto size-5 ${accent ? 'text-cw-terracotta' : 'text-cw-stone-700 dark:text-cw-stone-300'}`} />
    ) : (
      <MinusIcon className="mx-auto size-5 text-cw-stone-300 dark:text-cw-stone-700" />
    );
  }
  return (
    <span className={`text-xs font-medium ${accent ? 'text-cw-terracotta' : 'text-cw-stone-600 dark:text-cw-stone-300'}`}>
      {value}
    </span>
  );
}

export function FeatureMatrix() {
  return (
    <div className="w-full mt-24">
      <div className="max-w-2xl mb-12">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-cw-terracotta">
          Tier by tier
        </p>
        <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
          What you get at each level.
        </h2>
        <p className="mt-4 text-base sm:text-lg leading-relaxed text-cw-stone-500 dark:text-cw-stone-400">
          The tier cards above are the summary. This is the line-by-line breakdown.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-cw-stone-200 dark:border-cw-stone-800 bg-cw-stone-50/50 dark:bg-cw-stone-900/50 backdrop-blur-sm">
        <table className="w-full text-left text-sm min-w-[720px]">
          <thead className="bg-cw-stone-100 dark:bg-cw-stone-900/80 border-b border-cw-stone-200 dark:border-cw-stone-800">
            <tr>
              <th className="px-6 py-4 font-semibold text-cw-stone-900 dark:text-cw-stone-50 w-2/5">Feature</th>
              <th className="px-4 py-4 font-semibold text-cw-stone-500 dark:text-cw-stone-400 text-center">Self-hosted</th>
              <th className="px-4 py-4 font-semibold text-cw-terracotta text-center">Plus</th>
              <th className="px-4 py-4 font-semibold text-cw-stone-700 dark:text-cw-stone-200 text-center">Cloud</th>
              <th className="px-4 py-4 font-semibold text-cw-stone-700 dark:text-cw-stone-200 text-center">Enterprise</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cw-stone-200 dark:divide-cw-stone-800">
            {featureMatrix.map((section) => (
              <React.Fragment key={section.category}>
                <tr className="bg-cw-stone-100/50 dark:bg-cw-stone-800/30">
                  <td colSpan={5} className="px-6 py-3 font-semibold text-cw-stone-900 dark:text-cw-stone-50 text-xs uppercase tracking-wider">
                    {section.category}
                  </td>
                </tr>
                {section.features.map((row) => (
                  <tr key={row.name} className="transition-colors hover:bg-cw-stone-100/40 dark:hover:bg-cw-stone-800/40">
                    <td className="px-6 py-4 font-medium text-cw-stone-700 dark:text-cw-stone-300">
                      {row.name}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {renderCell(row.selfHosted, false)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {renderCell(row.plus, true)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {renderCell(row.cloud, false)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {renderCell(row.enterprise, false)}
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
