import { Card, CardBody, CardTitle } from '@/components/ui/card';
import { Section, SectionHeader } from '@/components/landing/section';

const props = [
  {
    title: 'Yours, forever',
    body: 'Not a SaaS. Not a fork. You scaffold your own repo, you ship it, you own the code. No platform lock-in, no monthly tax per order, no surprise pricing pages.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-4Z" />
      </svg>
    ),
  },
  {
    title: 'AI-native',
    body: 'MCP server, Anthropic + Gemini integrations, and an agent-driven admin shipped on day one. AI is in the spine of the template, not bolted on as a feature.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M8 2v4M16 2v4M3 11h18M9 15h.01M15 15h.01" />
      </svg>
    ),
  },
  {
    title: 'Production-shaped',
    body: 'Stripe in DB-first keys, NextAuth magiclink, Vercel Blob uploads, Resend email, Sentry — all wired and verified. Not a tutorial. A shop you can charge cards from.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12h4l3-9 4 18 3-9h4" />
      </svg>
    ),
  },
];

export function ValueProps() {
  return (
    <Section>
      <SectionHeader
        eyebrow="Why cartwright"
        title="Three promises. No asterisks."
        description="A template that takes commerce seriously — and respects that you’re the one shipping it to production."
      />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {props.map((p) => (
          <Card key={p.title}>
            <div className="size-10 rounded-md bg-cw-terracotta/10 text-cw-terracotta inline-flex items-center justify-center">
              <span className="size-5">{p.icon}</span>
            </div>
            <CardTitle className="mt-5">{p.title}</CardTitle>
            <CardBody>{p.body}</CardBody>
          </Card>
        ))}
      </div>
    </Section>
  );
}
