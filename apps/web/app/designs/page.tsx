import { HomeLayout } from 'fumadocs-ui/layouts/home';
import type { Metadata } from 'next';
import { SiteFooter } from '@/components/landing/cta-footer';
import { Section, SectionHeader } from '@/components/landing/section';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { baseOptions } from '@/lib/layout.shared';
import { DESIGNS } from '@/lib/designs-data';
import { DesignsGallery } from '@/components/designs/designs-gallery';

export const metadata: Metadata = {
  title: 'Design marketplace',
  description:
    'A slaraffenland of premium Cartwright designs — whole-page, code-owned, three.js-ready. Search, preview, copy the prompt that built it, or have an AI agent build your own. Free + Pro.',
};

export default function DesignsPage() {
  return (
    <HomeLayout {...baseOptions()}>
      <Section className="relative overflow-hidden">
        <Badge tone="terracotta" className="mb-6">
          Design marketplace
        </Badge>
        <SectionHeader
          title="A slaraffenland of designs"
          description="Whole-page, code-owned, three.js-ready designs for your Cartwright store. Pick one for premium-from-day-one, or copy the prompt and have an AI agent build a bespoke one in minutes. Every design is real code you own — switch any time in /admin/designs or in brand.config.ts."
        />
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/docs/designs/build-with-an-ide-agent" variant="primary">
            Build your own with an AI agent →
          </ButtonLink>
          <ButtonLink href="/designs/prompts" variant="secondary">
            Browse the prompt library
          </ButtonLink>
        </div>
      </Section>

      <Section className="bg-cw-stone-50 dark:bg-cw-stone-900/30">
        <SectionHeader
          eyebrow={`${DESIGNS.length} designs`}
          title="Browse designs"
          description="Search and filter by mode, tier, or 3D. Open any design for its palette, what's inside, and the exact prompt that builds it."
        />
        <div className="mt-10">
          <DesignsGallery designs={DESIGNS} />
        </div>
      </Section>

      <Section>
        <SectionHeader
          eyebrow="Build your own"
          title="Describe it, ship it"
          description="Paste a prompt to your IDE agent (Claude Code, Codex, …) — it reads the cartwright-premium-design skill and builds a real design pack in your repo. Or scaffold a fresh project and start from one."
        />
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/designs/prompts" variant="primary">
            Prompt library →
          </ButtonLink>
          <ButtonLink href="/docs/designs/build-with-an-ide-agent" variant="secondary">
            IDE-agent guide
          </ButtonLink>
        </div>
      </Section>

      <Section className="bg-cw-stone-50 dark:bg-cw-stone-900/30">
        <SectionHeader
          eyebrow="Share"
          title="Share your design"
          description="Designs are portable. Download any design as a cartwright-design-v1 design.md from your admin (Settings → Designs → Download design.md), then re-import it on another shop — or submit it back to the community and see it in this marketplace."
        />
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/designs/submit" variant="primary">
            Submit your design →
          </ButtonLink>
          <ButtonLink href="/docs/designs/design-md-spec" variant="ghost">
            The design.md format
          </ButtonLink>
        </div>
      </Section>

      <SiteFooter />
    </HomeLayout>
  );
}
