import Link from 'next/link';
import type { Metadata } from 'next';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { SiteFooter } from '@/components/landing/cta-footer';
import { Section, SectionHeader } from '@/components/landing/section';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { PromptBlock } from '@/components/designs/prompt-block';
import { baseOptions } from '@/lib/layout.shared';
import { PROMPT_LIBRARY, PROMPT_CATEGORIES } from '@/lib/design-prompts';

export const metadata: Metadata = {
  title: 'Design prompt library',
  description:
    'Copy-paste prompts that build premium Cartwright designs with an AI coding agent (Claude Code, Codex, …). Dark-luxe, editorial, brutalist, modern SaaS, 3D heroes, e-commerce.',
};

export default function DesignPromptsPage() {
  return (
    <HomeLayout {...baseOptions()}>
      <Section className="relative overflow-hidden">
        <Badge tone="terracotta" className="mb-6">
          Prompt library
        </Badge>
        <SectionHeader
          title="Prompts that build designs"
          description="Copy a prompt, paste it to your IDE agent (Claude Code, Codex, …), and it builds a real Cartwright design pack in your repo — it reads the cartwright-premium-design skill automatically. Tweak the wording to make it yours."
        />
        <div className="mt-8">
          <ButtonLink href="/designs" variant="secondary">
            ← Back to the design marketplace
          </ButtonLink>
        </div>
      </Section>

      {PROMPT_CATEGORIES.map((cat, i) => {
        const prompts = PROMPT_LIBRARY.filter((p) => p.category === cat);
        if (prompts.length === 0) return null;
        return (
          <Section key={cat} className={i % 2 === 0 ? 'bg-cw-stone-50 dark:bg-cw-stone-900/30' : ''}>
            <SectionHeader eyebrow={`${prompts.length} prompts`} title={cat} />
            <div className="mt-8 flex flex-col gap-6">
              {prompts.map((p) => (
                <div key={p.title} className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-cw-stone-900 dark:text-cw-stone-50">
                      {p.title}
                    </h3>
                    {p.designSlug && (
                      <Link
                        href={`/designs/${p.designSlug}`}
                        className="text-xs font-medium text-cw-terracotta hover:underline"
                      >
                        view design →
                      </Link>
                    )}
                  </div>
                  <PromptBlock prompt={p.prompt} />
                </div>
              ))}
            </div>
          </Section>
        );
      })}

      <Section>
        <SectionHeader
          eyebrow="New to this?"
          title="Build a design with an IDE agent"
          description="Scaffold a project with npx create-cartwright, open it in your editor, and paste a prompt above. Full walkthrough in the docs."
        />
        <div className="mt-8">
          <ButtonLink href="/docs/designs/build-with-an-ide-agent" variant="primary">
            Read the IDE-agent guide →
          </ButtonLink>
        </div>
      </Section>

      <SiteFooter />
    </HomeLayout>
  );
}
