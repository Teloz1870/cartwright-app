import { HomeLayout } from 'fumadocs-ui/layouts/home';
import type { Metadata } from 'next';
import { SiteFooter } from '@/components/landing/cta-footer';
import { Section, SectionHeader } from '@/components/landing/section';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CopyCommand } from '@/components/landing/copy-command';
import { baseOptions } from '@/lib/layout.shared';
import { DESIGNS, type DesignEntry } from '@/lib/designs-data';

export const metadata: Metadata = {
  title: 'Design marketplace',
  description:
    'A slaraffenland of premium Cartwright designs — whole-page, code-owned, three.js-ready. Pick one for instant premium from day one, or have an AI agent build your own. Free + Pro.',
};

const STARTER_PROMPTS = [
  'Build me a dark-luxe agency homepage as a Cartwright design pack: deep navy canvas, warm cream text, one mint-teal accent, a three.js aurora hero, editorial display type, glassmorphism nav, a bento services grid, and a bold CTA. English copy. Register it and show it.',
  'Create a light editorial / magazine design pack: warm paper, ink text, a characterful serif display, generous whitespace, a big pull-quote, asymmetric columns. No 3D. Then set it as my homepage.',
  'Build a neo-brutalist design pack: stark black on paper, thick borders, an acid-lime accent, monospace labels, hard shadows, a marquee. Make it loud but usable.',
  'Give my homepage a 3D hero: add <DesignHero /> behind the hero content with a CSS gradient fallback, and keep prefers-reduced-motion working.',
];

function Swatches({ palette }: { palette: DesignEntry['palette'] }) {
  if (!palette) return null;
  const order = [palette.accent, palette.accentDeep, palette.ink, palette.sand, palette.cream, palette.muted];
  return (
    <div className="flex gap-1.5" aria-hidden>
      {order.map((hex, i) => (
        <span
          key={i}
          className="h-5 w-5 rounded-full border border-cw-stone-200 dark:border-cw-stone-700"
          style={{ backgroundColor: hex }}
          title={hex}
        />
      ))}
    </div>
  );
}

function DesignCard({ d }: { d: DesignEntry }) {
  return (
    <Card className="flex flex-col gap-4">
      <Swatches palette={d.palette} />
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-semibold text-cw-stone-900 dark:text-cw-stone-50">
          {d.name}
        </h3>
        {d.premium && <Badge tone="oker">Pro</Badge>}
        {d.threeD && <Badge tone="terracotta">3D</Badge>}
        <Badge>{d.mode}</Badge>
      </div>
      <p className="flex-1 text-sm leading-relaxed text-cw-stone-500 dark:text-cw-stone-400">
        {d.description}
      </p>
      <div className="rounded-lg bg-cw-stone-100 px-3 py-2 font-mono text-xs text-cw-stone-700 dark:bg-cw-stone-800/60 dark:text-cw-stone-300">
        designSlug: <span className="text-cw-terracotta">&quot;{d.slug}&quot;</span>
      </div>
    </Card>
  );
}

export default function DesignsPage() {
  const premium = DESIGNS.filter((d) => d.premium);
  const free = DESIGNS.filter((d) => !d.premium);

  return (
    <HomeLayout {...baseOptions()}>
      <Section className="relative overflow-hidden">
        <Badge tone="terracotta" className="mb-6">
          Design marketplace
        </Badge>
        <SectionHeader
          title="A slaraffenland of designs"
          description="Whole-page, code-owned, three.js-ready designs for your Cartwright store. Pick one for premium-from-day-one, or have an AI agent build a bespoke one in minutes. Every design is real code you own — switch any time in /admin/designs or in brand.config.ts."
        />
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/docs/designs/build-with-an-ide-agent" variant="primary">
            Build your own with an AI agent →
          </ButtonLink>
          <ButtonLink href="/docs/designs/overview" variant="secondary">
            How designs work
          </ButtonLink>
        </div>
      </Section>

      <Section className="bg-cw-stone-50 dark:bg-cw-stone-900/30">
        <SectionHeader
          eyebrow={`Premium · ${premium.length} designs`}
          title="Pro designs"
          description="Hand-built, opinionated whole-page designs — locked themes (no OS dark-mode flip), distinctive type, optional three.js heroes."
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {premium.map((d) => (
            <DesignCard key={d.slug} d={d} />
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeader
          eyebrow={`Free · ${free.length} designs`}
          title="Built-in defaults"
          description="Palette-adaptive flagship designs (Aurora) and mode-specific defaults — free, and they adopt your brand colours automatically."
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {free.map((d) => (
            <DesignCard key={d.slug} d={d} />
          ))}
        </div>
      </Section>

      <Section className="bg-cw-stone-50 dark:bg-cw-stone-900/30">
        <SectionHeader
          eyebrow="Build your own"
          title="Starter prompts"
          description="Paste one of these to your IDE agent (Claude Code, Codex, …). It reads the cartwright-premium-design skill and builds a real design pack in your repo."
        />
        <div className="mt-8 flex flex-col gap-4">
          {STARTER_PROMPTS.map((p, i) => (
            <pre
              key={i}
              className="overflow-x-auto whitespace-pre-wrap rounded-xl border border-cw-stone-200 bg-white p-4 text-sm leading-relaxed text-cw-stone-700 dark:border-cw-stone-700 dark:bg-cw-stone-900 dark:text-cw-stone-300"
            >
              {p}
            </pre>
          ))}
        </div>
        <div className="mt-8">
          <CopyCommand command="npx create-cartwright@latest my-store" />
        </div>
      </Section>

      <Section>
        <SectionHeader
          eyebrow="Share"
          title="Share your design"
          description="Designs are portable. Download any design as a cartwright-design-v1 design.md from your admin (Settings → Designs → Download design.md), then re-import it on another shop — or share it back with the community."
        />
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink
            href="https://github.com/Teloz1870/cartwright-template"
            variant="secondary"
          >
            Submit a design on GitHub →
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
