import { Section, SectionHeader } from '@/components/landing/section';

const steps = [
  {
    n: '01',
    title: 'Scaffold',
    body: 'Run npx create-cartwright. Pick database, AI features, and a name. The CLI clones a sanitised template, fills env, and installs.',
    code: 'npx create-cartwright@latest my-shop',
  },
  {
    n: '02',
    title: 'Setup wizard',
    body: 'Visit /admin/setup. Add Stripe, Resend, Anthropic keys through a UI. Keys persist DB-first — no env-hopping when you go to production.',
    code: 'pnpm dev → /admin/setup',
  },
  {
    n: '03',
    title: 'Deploy',
    body: 'Click "Deploy to Vercel" or push to your own repo. Cron jobs, AI gateway, and migrations are all wired into the deploy.',
    code: 'vercel --prod',
  },
];

export function HowItWorks() {
  return (
    <Section>
      <SectionHeader
        eyebrow="From zero to selling"
        title="Three steps. Five minutes."
        description="The longest part is choosing a project name."
      />
      <ol className="mt-12 grid gap-px overflow-hidden rounded-xl border border-cw-stone-200 dark:border-cw-stone-800 bg-cw-stone-200 dark:bg-cw-stone-800 sm:grid-cols-3">
        {steps.map((step) => (
          <li
            key={step.n}
            className="bg-cw-paper dark:bg-cw-stone-900/40 p-6 flex flex-col"
          >
            <span className="font-mono text-xs text-cw-stone-400">
              step {step.n}
            </span>
            <h3 className="mt-3 text-lg font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
              {step.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-cw-stone-500 dark:text-cw-stone-400 flex-1">
              {step.body}
            </p>
            <code className="mt-4 inline-block w-fit max-w-full overflow-hidden text-ellipsis whitespace-nowrap rounded bg-cw-stone-900 dark:bg-cw-code-bg px-2.5 py-1 font-mono text-xs text-cw-stone-200">
              {step.code}
            </code>
          </li>
        ))}
      </ol>
    </Section>
  );
}
