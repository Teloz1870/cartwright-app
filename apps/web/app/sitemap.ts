import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';
import { COMPARISONS, LOVABLE } from '@/lib/comparisons';
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
    { url: `${BASE}/parts`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/verticals`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/pro`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/designs/prompts`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/glossary`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/pricing`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/security`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/integrations`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/showcase`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${BASE}/learn`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/looks`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/mixer`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/chrome`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/elements`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/svg-items`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/legal/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE}/legal/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];

  const compareRoutes: MetadataRoute.Sitemap = [LOVABLE, ...COMPARISONS].map((c) => ({
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
