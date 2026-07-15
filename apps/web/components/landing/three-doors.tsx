import { Card, CardBody, CardTitle } from '@/components/ui/card';
import { Section, SectionHeader } from '@/components/landing/section';

/**
 * The "three doors" section — the message-architecture spine of the landing
 * page. One owned engine, three ways in: the owner in a browser, their AI
 * coding agent in a terminal, and shopping agents over MCP/ACP. Every claim
 * here is shipping code; keep it that way.
 */
const doors = [
  {
    door: 'Door one',
    title: 'You, in a browser',
    body: 'A full admin — products, orders, content, design, integrations — plus an AI copilot that plans first and asks before it writes. Run the business end to end without a vendor dashboard in sight.',
    foot: '/admin',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
      </svg>
    ),
  },
  {
    door: 'Door two',
    title: 'Your AI coding agent, in a terminal',
    body: 'Agent rules files ship in the repo, and 86 REST tools across 35 domains let an agent design, stock, translate, and reconfigure the shop — destructive operations require explicit confirmation, and every write lands in the audit trail.',
    foot: 'POST /api/v1/tools',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="m7 9 3 3-3 3M13 15h4" />
      </svg>
    ),
  },
  {
    door: 'Door three',
    title: 'Shopping agents, over the wire',
    body: 'llms.txt, JSON-LD on every citable page, a product feed, a built-in MCP server, and ACP checkout endpoints — so AI assistants can find your shop, cite it, and buy from it.',
    foot: '/api/mcp · /api/acp',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="5" cy="12" r="2.5" />
        <circle cx="19" cy="5" r="2.5" />
        <circle cx="19" cy="19" r="2.5" />
        <path d="M7.3 10.9 16.7 6M7.3 13.1l9.4 4.9" />
      </svg>
    ),
  },
];

export function ThreeDoors() {
  return (
    <Section>
      <SectionHeader
        eyebrow="Three doors, one house"
        title="Everyone operates the same shop."
        description="A human, a coding agent, and a shopping agent all work the same engine — one database, one audit log, one repo that belongs to you."
      />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {doors.map((d) => (
          <Card key={d.title} className="flex flex-col">
            <div className="flex items-center justify-between">
              <div className="size-10 rounded-md bg-cw-terracotta/10 text-cw-terracotta inline-flex items-center justify-center">
                <span className="size-5">{d.icon}</span>
              </div>
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-cw-stone-400 dark:text-cw-stone-500">
                {d.door}
              </span>
            </div>
            <CardTitle className="mt-5">{d.title}</CardTitle>
            <CardBody className="flex-1">{d.body}</CardBody>
            <p className="mt-4 pt-4 border-t border-cw-stone-200 dark:border-cw-stone-800 font-mono text-xs text-cw-stone-500 dark:text-cw-stone-400">
              {d.foot}
            </p>
          </Card>
        ))}
      </div>
      <p className="mt-8 max-w-2xl text-sm sm:text-base text-cw-stone-600 dark:text-cw-stone-300">
        All three doors open into the same owned codebase — MIT-licensed, in
        your GitHub, on your infrastructure.{' '}
        <span className="font-semibold text-cw-stone-900 dark:text-cw-stone-50">
          Leave anytime — it&apos;s your repo.
        </span>
      </p>
    </Section>
  );
}
