import type { MetadataRoute } from 'next';

// Explicit AI-crawler allowlist (GEO signal) — mirrors the engine's app/robots.ts.
// Everyone is allowed anyway via the '*' rule; naming the AI bots is an explicit
// "yes, index + cite me" signal for AI search engines.
const AI_BOTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'ClaudeBot',
  'anthropic-ai',
  'Applebot-Extended',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      ...AI_BOTS.map((userAgent) => ({ userAgent, allow: '/' })),
    ],
    sitemap: 'https://cartwright.app/sitemap.xml',
    host: 'https://cartwright.app',
  };
}
