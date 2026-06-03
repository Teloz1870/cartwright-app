/**
 * Renders Schema.org JSON-LD as <script type="application/ld+json">.
 *
 * Use in Server Components to inject structured data that Google and AI agents
 * read (Organization, SoftwareApplication, FAQPage, BreadcrumbList, Article…).
 *
 * SECURITY: JSON.stringify does not escape "<", ">" or "&" — a value containing
 * "</script>" would otherwise break out of the <script> block. We escape those
 * to their \uXXXX form: still valid JSON-LD, but it cannot close the tag.
 *
 * Ported from the Cartwright engine (components/JsonLd.tsx) so cartwright.app
 * eats its own dog food — the marketing site uses the same structured-data
 * primitive it sells.
 */
type JsonLdProps = {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
};

export default function JsonLd({ data }: JsonLdProps) {
  const json = JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
