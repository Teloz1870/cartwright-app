import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';
import { COMPARISONS } from '@/lib/comparisons';
import { USE_CASES } from '@/lib/use-cases';
import { DESIGNS } from '@/lib/designs-data';

const BASE = 'https://cartwright.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/changelog`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE}/compare`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/use-cases`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/designs`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/scenes`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/designs/prompts`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/glossary`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/legal/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE}/legal/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];

  const compareRoutes: MetadataRoute.Sitemap = COMPARISONS.map((c) => ({
    url: `${BASE}/compare/${c.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const useCaseRoutes: MetadataRoute.Sitemap = USE_CASES.map((u) => ({
    url: `${BASE}/use-cases/${u.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const docsRoutes: MetadataRoute.Sitemap = source.getPages().map((page) => ({
    url: `${BASE}${page.url}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const designRoutes: MetadataRoute.Sitemap = DESIGNS.map((d) => ({
    url: `${BASE}/designs/${d.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...compareRoutes, ...useCaseRoutes, ...docsRoutes, ...designRoutes];
}
