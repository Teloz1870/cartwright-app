import { source } from '@/lib/source';
import { llms } from 'fumadocs-core/source';
import { SITE_URL } from '@/lib/agent-resources';

export const revalidate = false;

/**
 * `GET /docs/llms.txt` — the documentation index, scoped.
 *
 * The root `/llms.txt` answers "what is Cartwright and should I use it", and
 * carries the whole documentation index as its tail. That is the right document
 * for an agent deciding whether to reach for the product at all, and the wrong
 * one for an agent that has already decided and now needs the reference: it pays
 * for the pitch, the developer-resource list and the machine-endpoint table on
 * every fetch.
 *
 * This is the same index without the preamble. Both are generated from
 * `source`, so a page added to the docs appears in both or neither — there is no
 * second list to forget to update.
 */
const INTRO = `# Cartwright documentation

> Scoped index: every documentation page for the Cartwright engine, without the
> product introduction. For what Cartwright is, when to reach for it, and the
> machine-readable endpoints this site serves, fetch ${SITE_URL}/llms.txt instead.

Every page below is also available as Markdown: append \`.md\` to its path, or
send \`Accept: text/markdown\`.

`;

export function GET() {
  return new Response(INTRO + llms(source).index(), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      Vary: 'Accept',
      Link: `<${SITE_URL}/llms.txt>; rel="index"`,
    },
  });
}
