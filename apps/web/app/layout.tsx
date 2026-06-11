import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Geist, Geist_Mono } from 'next/font/google';
import SearchDialog from '@/components/search';
import JsonLd from '@/components/JsonLd';
import { xHandle } from '@/lib/shared';

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
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
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-screen font-sans antialiased">
        <JsonLd data={organizationJsonLd} />
        <RootProvider search={{ SearchDialog }}>{children}</RootProvider>
      </body>
    </html>
  );
}
