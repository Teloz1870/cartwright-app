import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Does a URL path on this origin actually resolve to something we ship?
 *
 * Test-support only — nothing in the request path imports this. It exists
 * because several of the changes in this branch are *lists of URLs*: the 404
 * recovery body, `llms.txt`'s developer-resources section, the OpenAPI
 * document. A list of pointers is exactly the kind of thing that rots quietly —
 * a page gets renamed, the pointer stays, and the only person who finds out is
 * an agent following it into a 404. Which is the failure this branch set out to
 * fix, so shipping a new instance of it would be its own joke.
 *
 * The mapping mirrors Next's App Router conventions plus fumadocs' content
 * directory. It is deliberately strict: an unrecognised shape returns `false`
 * rather than a shrug, so a new kind of route has to be taught here (and then
 * the failing test is the prompt to do it).
 */

const WEB_ROOT = path.dirname(fileURLToPath(new URL('.', import.meta.url)));

/** Next metadata conventions that answer a path from a differently-named file. */
const METADATA_ROUTES: Record<string, string> = {
  '/sitemap.xml': 'app/sitemap.ts',
  '/robots.txt': 'app/robots.ts',
  '/opengraph-image': 'app/opengraph-image.tsx',
};

function fromRoot(...segments: string[]): string {
  return path.join(WEB_ROOT, ...segments);
}

/** `/api/designs/{slug}/like` → `app/api/designs/[slug]/like/route.ts` */
function routeHandlerPath(urlPath: string): string {
  const segments = urlPath
    .split('/')
    .filter(Boolean)
    .map((segment) =>
      segment.startsWith('{') && segment.endsWith('}')
        ? `[${segment.slice(1, -1)}]`
        : segment,
    );
  return fromRoot('app', ...segments, 'route.ts');
}

/** `/docs/getting-started/quick-start` → `content/docs/getting-started/quick-start.mdx` */
function docsContentPath(urlPath: string): string[] {
  const rest = urlPath.replace(/^\/docs\/?/, '');
  if (rest === '') return [fromRoot('content/docs/index.mdx')];
  return [
    fromRoot('content/docs', `${rest}.mdx`),
    // A section landing page is `<section>/index.mdx`.
    fromRoot('content/docs', rest, 'index.mdx'),
  ];
}

export function routeExists(urlPath: string): boolean {
  const clean = urlPath.split('#')[0].split('?')[0];

  if (METADATA_ROUTES[clean]) return existsSync(fromRoot(METADATA_ROUTES[clean]));
  if (clean === '/') return existsSync(fromRoot('app/(home)/page.tsx'));

  // A route handler (`/api/*`, `/llms.txt`, `/openapi.json`, `/docs/llms.txt`, …).
  // Checked BEFORE the docs content lookup: a static segment under `/docs` is a
  // real route and Next resolves it ahead of the catch-all page, so treating
  // every `/docs/*` path as MDX would report a shipped route as missing.
  if (existsSync(routeHandlerPath(clean))) return true;

  if (clean.startsWith('/docs')) return docsContentPath(clean).some(existsSync);

  // …or a rendered page, either inside a route group or not. Route groups are
  // parentheses directories that do not appear in the URL, so `/contact` may
  // live at `app/(home)/contact/page.tsx`.
  const segments = clean.split('/').filter(Boolean);
  const candidates = [
    fromRoot('app', ...segments, 'page.tsx'),
    fromRoot('app/(home)', ...segments, 'page.tsx'),
  ];
  return candidates.some(existsSync);
}
