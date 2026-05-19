import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Geist, Geist_Mono } from 'next/font/google';
import SearchDialog from '@/components/search';

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
    default: 'cartwright — the AI-first webshop template you actually own',
    template: '%s · cartwright',
  },
  description:
    'A production-shaped Next.js commerce template with an AI-native admin, MCP server, and Stripe checkout. Scaffold with one command.',
  openGraph: {
    title: 'cartwright',
    description:
      'The AI-first webshop template you actually own. Scaffold with npx create-cartwright.',
    url: 'https://cartwright.app',
    siteName: 'cartwright',
    type: 'website',
  },
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-screen font-sans antialiased">
        <RootProvider search={{ SearchDialog }}>{children}</RootProvider>
      </body>
    </html>
  );
}
