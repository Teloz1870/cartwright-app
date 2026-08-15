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
} from 'lucide-react';
import { Wordmark } from '@/components/wordmark';
import { XLogo } from '@/components/x-logo';
import { DESIGNS } from './designs-data';
import { appName, gitConfig, social } from './shared';

/**
 * The top-level navigation.
 *
 * It used to open with an eleven-item "Explore" menu — designs, voices, looks,
 * mixer, chrome, parts, scenes, elements, SVG items, Pro, showcase — followed
 * by a seven-item "Resources". The first thing a visitor met was therefore a
 * catalogue of design assets, which made Cartwright read as a marketplace
 * rather than an engine you would trust to run a business.
 *
 * Now it leads with the argument: what makes it safe, what it costs, and how
 * to work it. The design library keeps one entry, honestly named, because it
 * IS part of the appeal and burying it would be its own mistake — just not the
 * first thing said.
 *
 * Nothing was orphaned. Everything removed from here lives in the footer's
 * link columns and in `app/sitemap.ts`; see `components/landing/cta-footer.tsx`
 * before deleting an entry from either.
 */
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <Wordmark />,
      url: '/',
    },
    links: [
      // The differentiator, and the hero's second call to action — it needs
      // somewhere to land from every page, not just the homepage.
      { text: 'Safety', url: '/security' },
      { text: 'Docs', url: '/docs' },
      // The library, as one entry rather than eleven competing with the pitch.
      {
        type: 'menu',
        text: 'Designs',
        items: [
          // Count derived from the vendored marketplace manifest (same source
          // as the /designs gallery) so the nav stays honest as packs ship.
          { icon: <Palette className="size-4" />, text: 'Design packs', url: '/designs', description: `${DESIGNS.length} whole-page designs` },
          { icon: <Mic className="size-4" />, text: 'Voices', url: '/verticals', description: 'Re-tone any design for your industry' },
          { icon: <Wand2 className="size-4" />, text: 'Looks', url: '/looks', description: 'Curated Skin × Voice combinations' },
          { icon: <SlidersHorizontal className="size-4" />, text: 'Mixer', url: '/mixer', description: 'Compose a Skin × Voice live' },
          { icon: <PanelTop className="size-4" />, text: 'Chrome', url: '/chrome', description: 'Headers & footers — mix any chrome' },
          { icon: <Blocks className="size-4" />, text: 'Parts', url: '/parts', description: 'Swappable page sections' },
          { icon: <Box className="size-4" />, text: '3D scenes', url: '/scenes', description: 'Live-Canvas WebGL heroes' },
          { icon: <Blocks className="size-4" />, text: 'Elements', url: '/elements', description: 'Pro 3D & cinematic building blocks' },
          { icon: <Shapes className="size-4" />, text: 'SVG items', url: '/svg-items', description: 'Palette-adaptive marks & illustrations' },
          { icon: <Sparkles className="size-4" />, text: 'Pro', url: '/pro', description: 'Breakthrough premium elements' },
          { icon: <ImageIcon className="size-4" />, text: 'Showcase', url: '/showcase', description: 'Real sites built with Cartwright' },
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
