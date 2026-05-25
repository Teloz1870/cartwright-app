import { Section, SectionHeader } from '@/components/landing/section';

const stack = [
  'Next.js 16',
  'React 19',
  'TypeScript 6',
  'Tailwind v4',
  'Prisma',
  'Turso',
  'NextAuth',
  'Stripe',
  'Anthropic SDK',
  'Gemini SDK',
  'Ollama',
  'Vercel AI SDK',
  'Vercel Blob',
  'Resend',
  'Sentry',
  'Zod',
  'pnpm 11',
  'Turborepo',
  'Fumadocs',
  'Vitest',
  'Playwright',
  'ESLint 10',
  'Upstash',
  'PostCSS',
  'Satori',
  'next/og',
  'MCP',
  'Phone.inc',
  'Luma Dream Machine',
  'Unsplash',
  'i18nexus',
];

export function StackGrid() {
  return (
    <Section>
      <SectionHeader
        eyebrow="The stack"
        title="All current versions. No legacy."
        description="Thirty current-major dependencies — from Next 16 and React 19 to Ollama, Phone.inc, and Luma Dream Machine. We track upstream, you get the upgrades."
      />
      <ul className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px overflow-hidden rounded-xl border border-cw-stone-200 dark:border-cw-stone-800 bg-cw-stone-200 dark:bg-cw-stone-800">
        {stack.map((name) => (
          <li
            key={name}
            className="bg-cw-paper dark:bg-cw-stone-900/40 px-4 py-5 text-center font-mono text-xs text-cw-stone-700 dark:text-cw-stone-300"
          >
            {name}
          </li>
        ))}
      </ul>
    </Section>
  );
}
