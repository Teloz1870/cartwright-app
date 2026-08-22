import { MARKDOWN_CONTENT_TYPE } from '@/lib/content-negotiation';
import { recoveryMarkdown } from '@/lib/agent-resources';

/**
 * The Markdown half of the 404.
 *
 * `proxy.ts` rewrites a Markdown-preferring request for an unknown path here,
 * passing the path it was actually after as `?path=`. The status is set
 * explicitly: a rewrite does not carry one, and a recovery body served as `200`
 * would be a soft 404 — the single worst outcome for a crawler, because it makes
 * every guessed URL look real.
 *
 * The body comes from the same `AGENT_RESOURCES` array the HTML 404 renders, so
 * the two representations cannot list different pointers.
 */

export function GET(request: Request): Response {
  const requested = new URL(request.url).searchParams.get('path') ?? '/';

  // The value is echoed into a Markdown code span. It is attacker-controlled, so
  // strip anything that could break out of the span or inject a second line —
  // backticks and newlines — and bound the length.
  const safePath = requested.replace(/[`\r\n]/g, '').slice(0, 200);

  return new Response(recoveryMarkdown(safePath), {
    status: 404,
    headers: {
      'Content-Type': MARKDOWN_CONTENT_TYPE,
      Vary: 'Accept',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}
