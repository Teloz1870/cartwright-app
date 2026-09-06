import { renderEngineFacts } from '@/lib/engine-facts';
import { docs } from 'collections/server';
import { loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { docsContentRoute, docsImageRoute, docsRoute } from './shared';

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

export function getPageImage(page: (typeof source)['$inferPage']) {
  const segments = [...page.slugs, 'image.png'];

  return {
    segments,
    url: `${docsImageRoute}/${segments.join('/')}`,
  };
}

export function getPageMarkdownUrl(page: (typeof source)['$inferPage']) {
  const segments = [...page.slugs, 'content.md'];

  return {
    segments,
    url: `${docsContentRoute}/${segments.join('/')}`,
  };
}

export async function getLLMText(page: (typeof source)['$inferPage']) {
  const processed = await page.data.getText('processed');

  // The processed text still carries MDX component tags; the one that hides a
  // fact from a Markdown reader is <EngineFact/>, so resolve it here — this is
  // the single path the .md twin and /llms-full.txt share.
  const body = renderEngineFacts(processed);
  // The wiring guards itself: a refactor that drops the call above — or a tag
  // spelling the resolver misses — fails `next build`, because both callers
  // are statically generated. A unit test could not see this: it reads the raw
  // .mdx, and the escaping that broke span pairing only exists in the
  // processed text.
  if (body.includes("<EngineFact")) {
    throw new Error(
      `${page.url}: an <EngineFact/> tag survived into the Markdown representation — a reader would get markup where the page shows a number`,
    );
  }

  return `# ${page.data.title} (${page.url})

${body}`;
}
