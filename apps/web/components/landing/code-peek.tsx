'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import { Section, SectionHeader } from '@/components/landing/section';

const tabs = [
  {
    key: 'brand',
    label: 'brand.config.ts',
    code: `import type { BrandConfig } from '@cartwright/shared';

export const brand: BrandConfig = {
  slug: 'my-shop',
  name: 'My Shop',
  industry: 'eyewear',
  theme: 'terracotta',
  locale: 'en-US',
  currency: 'USD',
  ai: {
    enabled: true,
    provider: 'anthropic',
    model: 'claude-opus-4-7',
  },
  policies: {
    pricing: { showVAT: true, decimals: 2 },
    shipping: { freeOver: 50_00 },
  },
};`,
  },
  {
    key: 'theme',
    label: 'themes/<slug>.css',
    code: `@theme {
  --color-brand-50:  #f3f1ff;
  --color-brand-100: #e7e2ff;
  --color-brand-200: #cdc1ff;
  --color-brand-300: #a890ff;
  --color-brand-400: #7c5cff; /* primary */
  --color-brand-500: #6b4ce6;
  --color-brand-600: #5836c4;
  --color-brand-700: #432a93;
  --color-brand-800: #2d1c61;
  --color-brand-900: #1a1038;
}`,
  },
  {
    key: 'mcp',
    label: 'mcp/tools/products.ts',
    code: `import { defineTool } from '@cartwright/mcp';
import { z } from 'zod';
import { prisma } from '@/lib/db';

export const findProducts = defineTool({
  name: 'products.search',
  description: 'Find products by free-text query',
  input: z.object({ query: z.string().min(2) }),
  async run({ query }) {
    return prisma.product.findMany({
      where: { name: { contains: query } },
      take: 20,
    });
  },
});`,
  },
] as const;

export function CodePeek() {
  const [active, setActive] = useState<(typeof tabs)[number]['key']>('brand');
  const current = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <Section>
      <SectionHeader
        eyebrow="It's just code"
        title="Not a CMS. Not a config UI you'll outgrow."
        description="One file is the brand. One file is the theme. One file is an MCP tool. If you can read TypeScript, you can run a shop."
      />

      <div className="mt-10 overflow-hidden rounded-xl border border-cw-stone-200 dark:border-cw-stone-800 bg-cw-stone-900 dark:bg-cw-code-bg">
        <div
          role="tablist"
          aria-label="Code examples"
          className="flex items-center gap-1 border-b border-cw-stone-800 bg-cw-stone-900 px-2"
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={active === t.key}
              onClick={() => setActive(t.key)}
              className={cn(
                'relative font-mono text-xs px-3 py-3 transition-colors',
                active === t.key
                  ? 'text-cw-stone-50'
                  : 'text-cw-stone-400 hover:text-cw-stone-200',
              )}
            >
              {t.label}
              {active === t.key && (
                <span className="absolute inset-x-2 -bottom-px h-px bg-cw-terracotta" />
              )}
            </button>
          ))}
        </div>
        <pre className="overflow-x-auto px-6 py-6 text-[13px] leading-relaxed font-mono text-cw-stone-200">
          <code>{current.code}</code>
        </pre>
      </div>
    </Section>
  );
}
