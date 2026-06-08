import { NextResponse } from 'next/server';
import { getAllLikes, likesConfigured } from '@/lib/likes';

/**
 * GET /api/designs/likes — all design like counts + whether the store is
 * configured. Used by the gallery (sort-by-popular + counts) and the like
 * button (initial count). Graceful: returns {} when no store is provisioned.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const likes = await getAllLikes();
  return NextResponse.json(
    { configured: likesConfigured(), likes },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
