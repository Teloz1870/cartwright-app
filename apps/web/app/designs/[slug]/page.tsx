import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { SiteFooter } from '@/components/landing/cta-footer';
import { Section } from '@/components/landing/section';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { PromptBlock } from '@/components/designs/prompt-block';
import { LikeButton } from '@/components/designs/like-button';
import { DesignHeroImage } from '@/components/designs/design-hero-image';
import { baseOptions } from '@/lib/layout.shared';
import { ogImageUrl } from '@/lib/og';
import { DESIGNS, type DesignEntry } from '@/lib/designs-data';
import { DESIGN_PROMPTS } from '@/lib/design-prompts';

type Props = { params: Promise<{ slug: string }> };

function getDesign(slug: string): DesignEntry | undefined {
  return DESIGNS.find((d) => d.slug === slug);
}

export function generateStaticParams() {
  return DESIGNS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const d = getDesign(slug);
  if (!d) return {};
  const og = ogImageUrl(d.name, d.description);
  return {
    title: `${d.name} — Cartwright design`,
    description: d.description,
    alternates: { canonical: `/designs/${d.slug}` },
    openGraph: {
      title: d.name,
      description: d.description,
      url: `https://cartwright.app/designs/${d.slug}`,
      type: 'article',
      images: [{ url: og, width: 1200, height: 630, alt: d.name }],
    },
    twitter: { card: 'summary_large_image', title: d.name, description: d.description, images: [og] },
  };
}

export default async function DesignDetailPage({ params }: Props) {
  const { slug } = await params;
  const d = getDesign(slug);
  if (!d) notFound();

  const prompt = DESIGN_PROMPTS[slug];
  const swatches = d.palette
    ? [d.palette.accent, d.palette.accentDeep, d.palette.ink, d.palette.sand, d.palette.cream, d.palette.muted]
    : [];

  return (
    <HomeLayout {...baseOptions()}>
      <Section>
        <Link
          href="/designs"
          className="text-sm font-medium text-cw-stone-500 hover:text-cw-terracotta dark:text-cw-stone-400"
        >
          ← All designs
        </Link>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-cw-stone-900 dark:text-cw-stone-50 sm:text-4xl">
            {d.name}
          </h1>
          {d.premium && <Badge tone="oker">Pro</Badge>}
          {d.threeD && <Badge tone="terracotta">3D</Badge>}
          <Badge>{d.mode}</Badge>
        </div>

        <p className="mt-4 max-w-2xl text-base leading-relaxed text-cw-stone-500 dark:text-cw-stone-400 sm:text-lg">
          {d.description}
        </p>

        <div className="mt-5">
          <LikeButton slug={d.slug} />
        </div>

        {/* Homepage preview screenshot */}
        <DesignHeroImage slug={d.slug} name={d.name} swatches={swatches} />

        {/* Palette */}
        {swatches.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-cw-terracotta">
              Palette
            </h2>
            <div className="flex flex-wrap gap-3">
              {swatches.map((hex, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <span
                    className="h-12 w-12 rounded-xl border border-cw-stone-200 dark:border-cw-stone-700"
                    style={{ backgroundColor: hex }}
                  />
                  <code className="font-mono text-[10px] text-cw-stone-500 dark:text-cw-stone-400">{hex}</code>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* What's inside */}
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            ['Mode', d.mode],
            ['Tier', d.premium ? 'Pro' : 'Free'],
            ['3D hero', d.threeD ? 'Yes (three.js)' : 'No'],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-cw-stone-200 p-4 dark:border-cw-stone-700">
              <div className="font-mono text-xs uppercase tracking-wide text-cw-stone-400">{k}</div>
              <div className="mt-1 font-semibold text-cw-stone-900 dark:text-cw-stone-50">{v}</div>
            </div>
          ))}
        </div>

        {/* The build prompt */}
        {prompt && (
          <div className="mt-10">
            <h2 className="mb-2 font-mono text-xs uppercase tracking-[0.16em] text-cw-terracotta">
              The prompt that builds it
            </h2>
            <p className="mb-4 max-w-2xl text-sm text-cw-stone-500 dark:text-cw-stone-400">
              Paste this to your IDE agent (Claude Code, Codex, …) — it reads the{' '}
              <code className="font-mono">cartwright-premium-design</code> skill and builds this as a real design pack.
            </p>
            <PromptBlock prompt={prompt} />
          </div>
        )}

        {/* Use it */}
        <div className="mt-10">
          <h2 className="mb-2 font-mono text-xs uppercase tracking-[0.16em] text-cw-terracotta">
            Use this design
          </h2>
          <p className="mb-3 max-w-2xl text-sm text-cw-stone-500 dark:text-cw-stone-400">
            Pick it in <code className="font-mono">/admin/designs</code>, or set it in{' '}
            <code className="font-mono">brand.config.ts</code>:
          </p>
          <div className="rounded-lg bg-cw-stone-100 px-4 py-3 font-mono text-sm text-cw-stone-700 dark:bg-cw-stone-800/60 dark:text-cw-stone-300">
            designSlug: <span className="text-cw-terracotta">&quot;{d.slug}&quot;</span>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/docs/designs/build-with-an-ide-agent" variant="primary">
              Build your own with an AI agent →
            </ButtonLink>
            <ButtonLink href="/designs/prompts" variant="secondary">
              Prompt library
            </ButtonLink>
          </div>
        </div>
      </Section>

      <SiteFooter />
    </HomeLayout>
  );
}
