import { NextResponse } from 'next/server';
import { likeDesign, likesConfigured } from '@/lib/likes';

/**
 * POST /api/designs/<slug>/like — anonymous like (INCR). Returns the new count.
 * 503 when no store is provisioned; 404 for an unknown design. Client-side
 * localStorage dedup prevents obvious double-likes (likes are low-stakes).
 */
export const runtime = 'nodejs';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!likesConfigured()) {
    return NextResponse.json(
      { error: 'Likes are not configured on this deployment.' },
      { status: 503 },
    );
  }
  const count = await likeDesign(slug);
  if (count === null) {
    return NextResponse.json({ error: `Unknown design: ${slug}` }, { status: 404 });
  }
  return NextResponse.json({ slug, count }, { headers: { 'Cache-Control': 'no-store' } });
}
