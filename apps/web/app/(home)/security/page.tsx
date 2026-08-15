import type { Metadata } from 'next';
import Link from 'next/link';
import { social } from '@/lib/shared';

/**
 * The destination for the hero's "Inspect the safety model".
 *
 * Three places already linked to `/security` — including the contact page's
 * "Coordinated vulnerability reporting" — and all three 404'd. On a product
 * whose entire position is trusted operation, a dead link behind a disclosure
 * promise is the worst one on the site.
 *
 * Every claim here is a mechanism that exists in the engine, not a posture.
 * If a control is removed from the engine, remove the row.
 */
export const metadata: Metadata = {
  title: 'Security',
  description:
    'How Cartwright constrains an AI operator: scoped tools, confirmation gates the model cannot forge, an audit log that can be reverted — and how to report a vulnerability.',
};

const CONTROLS: { stamp: string; state: string; title: string; body: string }[] = [
  {
    stamp: 'scope',
    state: 'action',
    title: 'Tools are allowlisted, not open-ended',
    body: 'The admin assistant can reach 37 named tools and nothing else. API keys carry one or more of 21 scopes, and every invocation is checked against the scope the tool declares — not against the caller’s intent.',
  },
  {
    stamp: 'confirm',
    state: 'pending',
    title: 'Writes stop and wait for a person',
    body: 'Twenty-five write tools return a preview instead of executing. Execution requires a confirmation token the server issued and the UI round-tripped. The model cannot set that flag itself — it is stripped from arguments before the first call.',
  },
  {
    stamp: 'read',
    state: '',
    title: 'Suggest mode blocks every write',
    body: 'A request flag that hard-disables the write half of the toolset, for when you want the assistant to propose and nothing else.',
  },
  {
    stamp: 'audited',
    state: 'verified',
    title: 'Every call is recorded, and reversible',
    body: 'Each invocation writes an audit row with the actor typed by origin — API key, admin user, storefront chat, voice — and sensitive values redacted. Attempts that were refused are recorded too. Mutations can be reverted from the log.',
  },
  {
    stamp: 'limit',
    state: '',
    title: 'A session cannot run away',
    body: 'Tool calls are capped per assistant session, and the AI routes are rate-limited per admin user. Voice sessions carry their own per-session and per-day minute caps.',
  },
  {
    stamp: 'gate',
    state: 'blocked',
    title: 'Agent surfaces are off unless you turn them on',
    body: 'ACP checkout, A2A, WebMCP, UCP identity linking and the voice shop all default to off, and answer 404 the way an absent path does — not 403, which would confirm the feature exists.',
  },
];

export default function SecurityPage() {
  return (
    <div className="bg-cw-canvas text-cw-fg">
      <section className="border-b border-cw-rule">
        <div className="cw-rail-track mx-auto max-w-7xl px-6 pt-20 pb-16">
          <div className="pl-12 lg:pl-0 lg:max-w-[58%]">
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-cw-muted">
              The safety model
            </p>
            <h1 className="mt-6 font-display [font-size:clamp(2.5rem,6vw,4.5rem)] [line-height:0.95] [letter-spacing:-0.03em]">
              An operator you can audit.
            </h1>
            <p className="mt-6 max-w-[62ch] text-base sm:text-lg leading-relaxed text-cw-muted">
              Letting a machine run a shop is only reasonable if the machine
              cannot do anything you did not permit, and cannot do anything
              quietly. These are the mechanisms that make that true — each one
              is code in the engine you own, not a promise about our conduct.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-cw-rule">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <ul className="grid gap-px bg-cw-rule sm:grid-cols-2">
            {CONTROLS.map((c) => (
              <li key={c.stamp} className="bg-cw-canvas p-7">
                <span className="cw-stamp" data-state={c.state || undefined}>
                  {c.stamp}
                </span>
                <h2 className="mt-4 text-base font-medium">{c.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-cw-muted">{c.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Recorded against a real shop, not a mock: a discount is created in the
          admin and the operation appears in the audit log a few seconds later,
          with the actor that caused it and a revert beside it. The rows are
          genuine — note that some are stamped "AI (API-key)" and others
          "Admin (web)", which is the actor typing this page claims.

          The admin still wears the retired purple; the engine has not been
          through the Interlock migration yet. That is why this sits here rather
          than on the homepage, where it would show a product that looks nothing
          like the site selling it. */}
      <section className="border-b border-cw-rule">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-cw-muted">
            The log, in the actual admin
          </p>
          <p className="mt-4 max-w-[62ch] text-sm leading-relaxed text-cw-muted">
            A discount is created, and the operation lands in the audit log with
            the key that asked for it and a revert control. Nothing here is a
            mock-up.
          </p>
          <video
            className="mt-8 w-full max-w-4xl border border-cw-rule"
            poster="/admin/audit-trail.jpg"
            controls
            muted
            playsInline
            preload="none"
          >
            <source src="/admin/audit-trail.webm" type="video/webm" />
            <source src="/admin/audit-trail.mp4" type="video/mp4" />
          </video>
        </div>
      </section>

      <section className="border-b border-cw-rule">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:grid lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div>
            <h2 className="font-display [font-size:clamp(1.75rem,3vw,2.5rem)] [line-height:1] [letter-spacing:-0.02em]">
              Reporting a vulnerability
            </h2>
            <p className="mt-5 max-w-[62ch] text-sm sm:text-base leading-relaxed text-cw-muted">
              Please do not open a public issue — that discloses the flaw to
              attackers before a fix exists. Use GitHub&rsquo;s private
              vulnerability reporting on the template repository:{' '}
              <strong className="text-cw-fg">Security → Report a vulnerability</strong>.
              It opens a private thread only you and the maintainers can read.
            </p>
            <p className="mt-4 max-w-[62ch] text-sm leading-relaxed text-cw-muted">
              Include the affected version or commit — scaffolded shops carry it
              in <code className="font-mono text-xs">.cartwright/release.json</code> — plus
              impact and reproduction steps.
            </p>
            <Link
              href={`${social.templateRepo}/security`}
              className="mt-7 inline-block font-mono text-xs uppercase tracking-[0.14em] text-cw-action underline-offset-4 hover:underline"
            >
              Open a private report →
            </Link>
          </div>

          <dl className="mt-12 lg:mt-0 space-y-4 font-mono text-xs">
            {[
              ['scope', 'create-cartwright, cartwright.app, the public template'],
              ['first response', 'within 48 hours'],
              ['critical fix', 'target 7 days'],
              ['disclosure', 'GitHub advisory, after users can upgrade'],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex items-baseline justify-between gap-6 border-b border-cw-rule pb-3"
              >
                <dt className="uppercase tracking-[0.14em] text-cw-muted">{k}</dt>
                <dd className="text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-6 py-16">
          <h2 className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-cw-muted">
            Published advisories
          </h2>
          <ul className="mt-6 divide-y divide-cw-rule border-y border-cw-rule">
            {[
              {
                id: 'CW-2026-002',
                fixed: 'v0.41.0',
                text: 'Next.js 16.2.11 — the July security release, covering nine CVEs.',
              },
              {
                id: 'CW-2026-001',
                fixed: 'v0.40.0',
                text: 'Public-surface lockdown: the MCP endpoint and tool catalogue now honour the mcpPublic flag, and API keys actually expire.',
              },
            ].map((a) => (
              <li key={a.id} className="flex flex-col gap-2 py-5 sm:flex-row sm:items-baseline sm:gap-8">
                <span className="font-mono text-xs text-cw-action w-32 shrink-0">{a.id}</span>
                <span className="flex-1 text-sm text-cw-muted">{a.text}</span>
                <span className="font-mono text-xs text-cw-muted">fixed {a.fixed}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
