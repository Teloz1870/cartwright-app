import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import {
  Palette,
  Mic,
  Wand2,
  SlidersHorizontal,
  PanelTop,
  Blocks,
  Box,
  Shapes,
  Sparkles,
  Image as ImageIcon,
  GraduationCap,
  Rocket,
  Plug,
  Briefcase,
  GitCompare,
  BookOpen,
  History,
} from 'lucide-react';
import { Wordmark } from '@/components/wordmark';
import { XLogo } from '@/components/x-logo';
import { DESIGNS } from './designs-data';
import { appName, gitConfig, social } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <Wordmark />,
      url: '/',
    },
    links: [
      // Explore ▾ — the "what you build with" cluster (designs, voices, looks, parts, 3D, Pro).
      {
        type: 'menu',
        text: 'Explore',
        items: [
          // Count derived from the vendored marketplace manifest (same source
          // as the /designs gallery) so the nav stays honest as packs ship.
          { icon: <Palette className="size-4" />, text: 'Designs', url: '/designs', description: `${DESIGNS.length} whole-page design packs` },
          { icon: <Mic className="size-4" />, text: 'Voices', url: '/verticals', description: 'Re-tone any design for your industry' },
          { icon: <Wand2 className="size-4" />, text: 'Looks', url: '/looks', description: 'Curated Skin × Voice combinations' },
          { icon: <SlidersHorizontal className="size-4" />, text: 'Mixer', url: '/mixer', description: 'Compose a Skin × Voice live' },
          { icon: <PanelTop className="size-4" />, text: 'Chrome', url: '/chrome', description: 'Headers & footers — mix any chrome' },
          { icon: <Blocks className="size-4" />, text: 'Parts', url: '/parts', description: 'Swappable page sections' },
          { icon: <Box className="size-4" />, text: '3D scenes', url: '/scenes', description: 'Live-Canvas WebGL heroes' },
          { icon: <Blocks className="size-4" />, text: 'Elements', url: '/elements', description: 'Pro 3D & cinematic building blocks' },
          { icon: <Shapes className="size-4" />, text: 'SVG items', url: '/svg-items', description: 'Hand-crafted palette-adaptive marks & illustrations' },
          { icon: <Sparkles className="size-4" />, text: 'Pro', url: '/pro', description: 'Breakthrough premium elements' },
          { icon: <ImageIcon className="size-4" />, text: 'Showcase', url: '/showcase', description: 'Real sites built with Cartwright' },
        ],
      },
      // Docs — promoted to a direct, prominent top-level item.
      { text: 'Docs', url: '/docs' },
      // Resources ▾ — the "learn & help" cluster (adopts the orphaned routes too).
      {
        type: 'menu',
        text: 'Resources',
        items: [
          { icon: <GraduationCap className="size-4" />, text: 'Learn', url: '/learn', description: 'Guides & deep-dives' },
          { icon: <Rocket className="size-4" />, text: 'Onboarding', url: '/onboarding', description: 'From zero to live' },
          { icon: <Plug className="size-4" />, text: 'Integrations', url: '/integrations', description: 'Stripe, Resend, Turso & more' },
          { icon: <Briefcase className="size-4" />, text: 'Use cases', url: '/use-cases', description: 'Cartwright by industry' },
          { icon: <GitCompare className="size-4" />, text: 'Compare', url: '/compare', description: 'Cartwright vs the alternatives' },
          { icon: <BookOpen className="size-4" />, text: 'Glossary', url: '/glossary', description: 'Terms, defined' },
          { icon: <History className="size-4" />, text: 'Changelog', url: '/changelog', description: "What's new in the engine" },
        ],
      },
      { text: 'Pricing', url: '/pricing' },
      // Primary CTA — sits on the right, next to the GitHub icon.
      {
        type: 'button',
        text: 'Get started',
        url: '/docs/getting-started/quick-start',
        secondary: true,
      },
      // Official X profile — icon button in the secondary strip, next to GitHub.
      {
        type: 'icon',
        label: 'X / Twitter',
        icon: <XLogo className="size-4" />,
        text: 'X / Twitter',
        url: social.x,
        external: true,
      },
    ],
    // The open-source engine template — public + MIT since v0.35.0.
    githubUrl: social.templateRepo,
  };
}

export { appName, gitConfig };
