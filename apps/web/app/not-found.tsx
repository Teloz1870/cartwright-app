import type { Metadata } from 'next';
import { ButtonLink } from '@/components/ui/button';
import { AGENT_RESOURCES } from '@/lib/agent-resources';

/**
 * The 404 an agent can recover from.
 *
 * Next already answered a real `404` status for unknown paths before this file
 * existed — that part was never broken, and it is the property that matters
 * most: because every unknown path 404s, a `200` from this origin can be
 * trusted to mean the page is real. What was missing is the other half. The
 * default body is a bare "404" with no outbound pointers, so a crawler that
 * guessed a URL learned only that it was wrong, never where to look instead.
 *
 * So this page names the machine-readable entry points explicitly, in the HTML
 * itself (no JavaScript required to read them). An agent that prefers Markdown
 * gets the same list as Markdown — `proxy.ts` routes `Accept: text/markdown`
 * misses to `/llms.mdx/not-found`, which renders from the same
 * `AGENT_RESOURCES` array, so the two can never drift apart.
 *
 * `robots: noindex` because a soft-404 in the index is worse than no entry.
 */
export const metadata: Metadata = {
  title: 'Page not found',
  description:
    'That page does not exist on cartwright.app. Here are the documentation, sitemap, OpenAPI and llms.txt entry points.',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="relative min-h-screen overflow-hidden pb-32">
      <div aria-hidden className="absolute inset-0 cw-grid-bg opacity-50" />

      <div className="relative mx-auto max-w-2xl px-6 pt-32 sm:pt-40">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-cw-stone-500 dark:text-cw-stone-400">
          404
        </p>

        <h1 className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50">
          That page does not exist.
        </h1>

        <p className="mt-6 text-base sm:text-lg text-cw-stone-500 dark:text-cw-stone-400">
          The link may be out of date, or the path may never have existed. Every
          unknown path on this site answers a real <code>404</code> — so if you
          are a crawler, you can trust a <code>200</code> here to mean the page
          is genuinely there.
        </p>

        <h2 className="mt-12 text-sm font-mono uppercase tracking-[0.16em] text-cw-stone-500 dark:text-cw-stone-400">
          Where to look next
        </h2>

        <ul className="mt-4 divide-y divide-cw-stone-200 dark:divide-cw-stone-800 border-y border-cw-stone-200 dark:border-cw-stone-800">
          {AGENT_RESOURCES.map((resource) => (
            <li key={resource.path} className="py-4">
              <a
                href={resource.path}
                className="font-medium text-cw-stone-900 dark:text-cw-stone-50 underline underline-offset-4 decoration-cw-stone-300 dark:decoration-cw-stone-700 hover:decoration-cw-terracotta"
              >
                {resource.title}
              </a>
              <span className="ml-2 font-mono text-xs text-cw-stone-400">
                {resource.path}
              </span>
              <p className="mt-1 text-sm text-cw-stone-500 dark:text-cw-stone-400">
                {resource.description}
              </p>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-sm text-cw-stone-500 dark:text-cw-stone-400">
          Prefer Markdown? Send <code>Accept: text/markdown</code> — this page,
          the homepage and every page under <code>/docs</code> answer in
          Markdown, and docs pages also accept a <code>.md</code> suffix.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/" size="lg">
            Back to the homepage
          </ButtonLink>
          <ButtonLink href="/docs/introduction" variant="outline" size="lg">
            Read the docs
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
