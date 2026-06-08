import type { Metadata } from 'next';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { SiteFooter } from '@/components/landing/cta-footer';
import { Section, SectionHeader } from '@/components/landing/section';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { baseOptions } from '@/lib/layout.shared';
import { SubmitForm } from '@/components/designs/submit-form';

export const metadata: Metadata = {
  title: 'Submit a design',
  description:
    'Share your Cartwright design with the community. Paste your design.md, affirm the license, and submit — it opens a pre-filled GitHub issue for review. No account needed here.',
};

export default function SubmitDesignPage() {
  return (
    <HomeLayout {...baseOptions()}>
      <Section>
        <Badge tone="terracotta" className="mb-6">
          Community
        </Badge>
        <SectionHeader
          title="Submit a design"
          description="Built something good? Share it. Paste your design.md below — it's checked, you affirm the license, and submitting opens a pre-filled GitHub issue we review before it joins the marketplace. Designs are portable code (cartwright-design-v1), so anyone can import yours."
        />
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/docs/designs/design-md-spec" variant="secondary">
            The design.md format
          </ButtonLink>
          <ButtonLink href="/docs/designs/build-with-an-ide-agent" variant="ghost">
            Don&rsquo;t have one? Build it with an agent →
          </ButtonLink>
        </div>
      </Section>

      <Section className="bg-cw-stone-50 dark:bg-cw-stone-900/30">
        <div className="max-w-3xl">
          <SubmitForm />
        </div>
      </Section>

      <Section>
        <SectionHeader
          eyebrow="How it works"
          title="From submission to marketplace"
          description="1) Paste your design.md + affirm the license. 2) Submitting opens a pre-filled GitHub issue from your account. 3) We validate (cartwright-design-v1) and add it — credited to you. Export any existing design as a design.md from your admin (Settings → Designs → Download)."
        />
        <div className="mt-8">
          <ButtonLink href="/designs" variant="primary">
            ← Back to the marketplace
          </ButtonLink>
        </div>
      </Section>

      <SiteFooter />
    </HomeLayout>
  );
}
