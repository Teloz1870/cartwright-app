import type { Metadata } from 'next';
import { xHandle } from './shared';

/** The relative /og card URL for a title+description (resolved against metadataBase). */
export function ogImageUrl(title: string, description: string): string {
  return `/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}`;
}

/**
 * Per-page Open Graph + Twitter share card. Spread into a page's `metadata`
 * (or `generateMetadata` return) so sharing that URL shows a card with the
 * page's own title/description — not the homepage card from the root
 * opengraph-image.tsx. Relative `/og?...` is resolved against `metadataBase`
 * (set in app/layout.tsx) into an absolute URL for scrapers.
 *
 *   export const metadata = {
 *     title: 'Changelog',
 *     description: 'Release history …',
 *     ...pageOg('Changelog', 'Release history …'),
 *   };
 */
export function pageOg(
  title: string,
  description: string,
): Pick<Metadata, 'openGraph' | 'twitter'> {
  const url = ogImageUrl(title, description);
  return {
    openGraph: {
      title,
      description,
      images: [{ url, width: 1200, height: 630, alt: title }],
    },
    // Page-level `twitter` replaces the root layout's block wholesale in
    // Next's metadata merge — so the site handle must be repeated here.
    twitter: {
      card: 'summary_large_image',
      site: xHandle,
      title,
      description,
      images: [url],
    },
  };
}
