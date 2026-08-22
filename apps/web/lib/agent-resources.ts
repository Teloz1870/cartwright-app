/**
 * The machine-readable surface of cartwright.app, in one place.
 *
 * Four different responses have to agree on this list — the 404 recovery body,
 * `llms.txt`, the OpenAPI description, and the docs page that documents it. When
 * they drifted apart, an agent that hit a dead end got a different set of
 * "where to look next" pointers depending on which one it happened to read, and
 * a resource nobody listed was effectively undiscoverable even though it shipped.
 *
 * Everything named here MUST be reachable. `lib/agent-resources.test.ts` asserts
 * that each `path` is either a route in `app/` or a file in `public/`, so adding
 * a pointer to something that does not exist fails the suite rather than the
 * agent.
 */

export const SITE_URL = 'https://cartwright.app';

export type AgentResource = {
  /** Absolute path on this origin. */
  path: string;
  /** What an agent gets, phrased as the job it does. */
  title: string;
  /** One line: when an agent should read this rather than the others. */
  description: string;
  /** Media type of the successful response. */
  contentType: string;
};

/**
 * Ordered by how useful each one is to an agent arriving cold. `llms.txt` first
 * because it is the only entry that explains the others.
 */
export const AGENT_RESOURCES: AgentResource[] = [
  {
    path: '/llms.txt',
    title: 'Agent index',
    description:
      'Start here: what Cartwright is, when to reach for it, and an index of every documentation page.',
    contentType: 'text/plain',
  },
  {
    path: '/llms-full.txt',
    title: 'Full documentation corpus',
    description:
      'Every documentation page concatenated as one plain-text document, for ingestion in a single fetch.',
    contentType: 'text/plain',
  },
  {
    path: '/openapi.json',
    title: 'OpenAPI 3.1 description',
    description:
      'The public HTTP API of this site: typed parameters, response schemas and a unique operationId per operation.',
    contentType: 'application/json',
  },
  {
    path: '/docs/introduction',
    title: 'Documentation',
    description:
      'Human- and agent-readable docs. Every page under /docs also serves Markdown via Accept negotiation or a .md suffix.',
    contentType: 'text/html',
  },
  {
    path: '/.well-known/api-catalog',
    title: 'API catalog (RFC 9727)',
    description:
      'The standard place to ask whether this origin has an API and where its description lives.',
    contentType: 'application/linkset+json',
  },
  {
    path: '/.well-known/ai-catalog.json',
    title: 'Agentic resource catalog (ARD)',
    description:
      'Every agentic resource this origin serves, as an Agentic Resource Discovery catalogue.',
    contentType: 'application/json',
  },
  {
    path: '/sitemap.xml',
    title: 'Sitemap',
    description: 'Every indexable URL on this origin.',
    contentType: 'application/xml',
  },
  {
    path: '/static.json',
    title: 'Search index',
    description:
      'The pre-built documentation search index, if you would rather query locally than crawl.',
    contentType: 'application/json',
  },
];

/**
 * The subset that is worth naming in a recovery message. A 404 body should be
 * short enough to read in full — the whole list belongs in `llms.txt`, which is
 * the first entry here.
 */
export const RECOVERY_RESOURCES: AgentResource[] = AGENT_RESOURCES.filter((r) =>
  ['/llms.txt', '/openapi.json', '/docs/introduction', '/sitemap.xml'].includes(
    r.path,
  ),
);

/**
 * The Markdown-negotiable paths, as glob-ish descriptions for documentation.
 * Kept next to the resources because the two answer the same question ("what
 * can I fetch, and in what shape?").
 */
export const MARKDOWN_ROUTES = ['/', '/docs/*'] as const;

/** A short Markdown block naming where to go next. Used by the 404 responses. */
export function recoveryMarkdown(requestedPath: string): string {
  const lines = [
    '# 404 — no such page',
    '',
    `\`${requestedPath}\` does not exist on ${SITE_URL}.`,
    '',
    'This is a real 404: every path that does not exist returns this status, so',
    'you can trust a 200 from this origin to mean the page is real.',
    '',
    '## Where to look next',
    '',
    ...RECOVERY_RESOURCES.map(
      (r) => `- [${r.title}](${SITE_URL}${r.path}) — ${r.description}`,
    ),
    '',
    '## Search',
    '',
    `- Full-text search index: [${SITE_URL}/static.json](${SITE_URL}/static.json)`,
    '',
    'Every page under `/docs` also answers `Accept: text/markdown`, or you can',
    'append `.md` to its path.',
    '',
  ];
  return lines.join('\n');
}
