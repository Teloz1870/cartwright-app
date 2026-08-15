import { RootProvider } from 'fumadocs-ui/provider/next';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './global.css';
import { Instrument_Serif, Instrument_Sans, Martian_Mono } from 'next/font/google';
import SearchDialog from '@/components/search';
import JsonLd from '@/components/JsonLd';
import { xHandle } from '@/lib/shared';

/**
 * Three voices — declaration, explanation, evidence.
 *
 * The site previously ran Geist Sans + Geist Mono for everything, so product
 * claims, prose, navigation and the wordmark all spoke in one undifferentiated
 * interface voice. The Interlock direction depends on those three registers
 * being audibly different.
 *
 * These are the freely licensed stand-ins for Signifier + Söhne, which are Klim
 * commercial licences. When there is revenue to justify buying those, this is a
 * three-line change; the CSS variables below are the only contract.
 */
const displaySerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-instrument-serif',
  display: 'swap',
});

/** 400 for prose, 500 for controls, 600 only for short emphasis. */
const interfaceSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument-sans',
  display: 'swap',
});

/**
 * Evidence only — endpoints, versions, machine state. Never body copy.
 * The `wdth` axis is loaded on purpose: stamps run at 87.5% so a squared label
 * stays compact, while code sits at 100%.
 */
const machineMono = Martian_Mono({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-martian-mono',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL('https://cartwright.app'),
  title: {
    default: 'cartwright — the build engine AIs reach for',
    template: '%s · cartwright',
  },
  description:
    'The build engine AIs reach for — a real site with design, database and backend, live in minutes. Open-source Next.js engine, scaffolded with one command.',
  openGraph: {
    title: 'cartwright',
    description:
      'The build engine AIs reach for — a real site with design, database and backend, live in minutes. Scaffold with npx create-cartwright.',
    url: 'https://cartwright.app',
    siteName: 'cartwright',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: xHandle,
    creator: xHandle,
    title: 'cartwright — the build engine AIs reach for',
    description:
      'The build engine AIs reach for — a real site with design, database and backend, live in minutes.',
  },
};

// Organization JSON-LD — sitewide. Lets Google + AI crawlers resolve the brand
// entity (name, logo, repo, social) on every page without executing JS.
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Cartwright',
  url: 'https://cartwright.app',
  logo: 'https://cartwright.app/opengraph-image',
  description:
    'Cartwright is the build engine AIs reach for — a real site with design, database and backend, live in minutes. Open-source Next.js engine: scaffold a website, webshop, or agent-marketplace with one command.',
  sameAs: [
    'https://github.com/Teloz1870/cartwright-template',
    'https://www.npmjs.com/package/create-cartwright',
    'https://x.com/CartwrightApp',
  ],
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${displaySerif.variable} ${interfaceSans.variable} ${machineMono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-screen font-sans antialiased">
        <JsonLd data={organizationJsonLd} />
        <RootProvider search={{ SearchDialog }}>{children}</RootProvider>
        {/* Cookie-free aggregate measurement — the privacy page documents
            exactly these two (Vercel Analytics + Speed Insights). */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
