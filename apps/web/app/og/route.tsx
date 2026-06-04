import { ImageResponse } from 'next/og';
import { generate as DefaultImage } from 'fumadocs-ui/og';
import { appName } from '@/lib/shared';

export const runtime = 'nodejs';

/**
 * Generic per-page Open Graph card: /og?title=...&description=...
 *
 * Reuses the same Fumadocs OG generator the docs pages use, so every marketing
 * page can ship a share-preview that reflects *its* title/description instead of
 * inheriting the root opengraph-image.tsx (the homepage card). Wire it via the
 * `pageOg()` helper in lib/og.ts.
 */
export function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title')?.slice(0, 120) || appName;
  const description = searchParams.get('description')?.slice(0, 200) || '';

  return new ImageResponse(
    <DefaultImage title={title} description={description} site={appName} />,
    { width: 1200, height: 630 },
  );
}
