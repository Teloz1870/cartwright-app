/**
 * GET /api/version
 *
 * Returns the current published version of `create-cartwright` on npm, plus
 * a few related metadata fields. Used by the landing hero (and anywhere else
 * that wants to display "Current release: vX.Y.Z" without hardcoding it).
 *
 * Cached for 1 hour at the edge — npm propagation is slow enough that fresh
 * lookups every request waste bandwidth + risk rate-limits.
 *
 * The seed of the docs-automation layer: every release that publishes to
 * npm automatically becomes visible on cartwright.app within the next cache
 * miss. Eventually this endpoint can grow:
 *   - GET /api/version → latest published version + release date
 *   - GET /api/version/next → bleeding-edge from cartwright-template/next
 *   - GET /api/version/changelog → recent CHANGELOG entries
 *   - GET /api/version/features → enumerated feature manifests
 *
 * For now it's the smallest useful thing: the version string.
 */

export const runtime = "nodejs";
export const revalidate = 3600; // 1 hour ISR

type NpmDistTags = {
  latest?: string;
  beta?: string;
  next?: string;
  [tag: string]: string | undefined;
};

type NpmPackage = {
  "dist-tags"?: NpmDistTags;
  time?: Record<string, string>;
  versions?: Record<string, unknown>;
};

type VersionResponse = {
  latest: string | null;
  beta: string | null;
  next: string | null;
  publishedAt: string | null;
  source: "npm-registry";
};

export async function GET(): Promise<Response> {
  try {
    const res = await fetch("https://registry.npmjs.org/create-cartwright", {
      // Vercel honors next.revalidate for ISR caching
      next: { revalidate: 3600 },
      headers: { accept: "application/json" },
    });

    if (!res.ok) {
      return Response.json(
        { error: "npm_registry_unavailable", status: res.status },
        { status: 502 },
      );
    }

    const pkg = (await res.json()) as NpmPackage;
    const tags = pkg["dist-tags"] ?? {};
    const latest = tags.latest ?? null;
    const beta = tags.beta ?? null;
    const next = tags.next ?? null;
    const publishedAt = latest ? (pkg.time?.[latest] ?? null) : null;

    const body: VersionResponse = {
      latest,
      beta,
      next,
      publishedAt,
      source: "npm-registry",
    };

    return Response.json(body, {
      status: 200,
      headers: {
        "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    return Response.json(
      {
        error: "version_lookup_failed",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 502 },
    );
  }
}
