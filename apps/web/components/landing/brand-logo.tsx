import Image from 'next/image';

export type BrandSlug =
  | 'stripe'
  | 'vercel'
  | 'resend'
  | 'turso'
  | 'sentry'
  | 'upstash'
  | 'i18nexus'
  | 'anthropic'
  | 'gemini'
  | 'ollama'
  | 'mcp'
  | 'nextauth'
  | 'phone-inc'
  | 'luma'
  | 'unsplash'
  | 'nextjs'
  | 'react'
  | 'typescript'
  | 'tailwind'
  | 'prisma'
  | 'klaviyo'
  | 'mailchimp'
  | 'quickbooks'
  | 'notion'
  | 'shopify'
  | 'woocommerce'
  | 'magento'
  | 'squarespace'
  | 'airtable'
  | 'hubspot'
  | 'slack'
  | 'zapier'
  | 'shipstation'
  | 'algolia'
  | 'firecrawl';

type Registry = Record<
  BrandSlug,
  | { kind: 'svg'; file: string; brandColor: string; bgOnDark?: boolean }
  | { kind: 'letter'; mark: string; brandColor: string }
>;

const REGISTRY: Registry = {
  // SVG logos (live in /public/logos/)
  stripe: { kind: 'svg', file: 'stripe.svg', brandColor: '#635BFF' },
  vercel: { kind: 'svg', file: 'vercel.svg', brandColor: '#000000', bgOnDark: true },
  resend: { kind: 'svg', file: 'resend.svg', brandColor: '#000000', bgOnDark: true },
  sentry: { kind: 'svg', file: 'sentry.svg', brandColor: '#362D59', bgOnDark: true },
  upstash: { kind: 'svg', file: 'upstash.svg', brandColor: '#00E9A3' },
  anthropic: { kind: 'svg', file: 'anthropic.svg', brandColor: '#191919', bgOnDark: true },
  gemini: { kind: 'svg', file: 'gemini.svg', brandColor: '#8E75B2' },
  ollama: { kind: 'svg', file: 'ollama.svg', brandColor: '#000000', bgOnDark: true },
  unsplash: { kind: 'svg', file: 'unsplash.svg', brandColor: '#000000', bgOnDark: true },
  nextjs: { kind: 'svg', file: 'nextjs.svg', brandColor: '#000000', bgOnDark: true },
  react: { kind: 'svg', file: 'react.svg', brandColor: '#61DAFB' },
  typescript: { kind: 'svg', file: 'typescript.svg', brandColor: '#3178C6' },
  tailwind: { kind: 'svg', file: 'tailwind.svg', brandColor: '#06B6D4' },
  prisma: { kind: 'svg', file: 'prisma.svg', brandColor: '#2D3748', bgOnDark: true },
  mailchimp: { kind: 'svg', file: 'mailchimp.svg', brandColor: '#FFE01B' },
  quickbooks: { kind: 'svg', file: 'quickbooks.svg', brandColor: '#2CA01C' },
  notion: { kind: 'svg', file: 'notion.svg', brandColor: '#000000', bgOnDark: true },
  turso: { kind: 'svg', file: 'turso.svg', brandColor: '#4FF8D2' },
  mcp: { kind: 'svg', file: 'mcp.svg', brandColor: '#D97757' },
  i18nexus: { kind: 'svg', file: 'i18nexus.svg', brandColor: '#26A69A' },
  shopify: { kind: 'svg', file: 'shopify.svg', brandColor: '#7AB55C' },
  woocommerce: { kind: 'svg', file: 'woocommerce.svg', brandColor: '#7F54B3' },
  magento: { kind: 'svg', file: 'magento.svg', brandColor: '#EE672F' },
  squarespace: { kind: 'svg', file: 'squarespace.svg', brandColor: '#000000', bgOnDark: true },
  airtable: { kind: 'svg', file: 'airtable.svg', brandColor: '#18BFFF' },
  hubspot: { kind: 'svg', file: 'hubspot.svg', brandColor: '#FF7A59' },
  slack: { kind: 'svg', file: 'slack.svg', brandColor: '#4A154B', bgOnDark: true },
  zapier: { kind: 'svg', file: 'zapier.svg', brandColor: '#FF4F00' },
  algolia: { kind: 'svg', file: 'algolia.svg', brandColor: '#003DFF', bgOnDark: true },

  // letter-mark fallback for brands without an available SVG mark
  nextauth: { kind: 'letter', mark: 'A', brandColor: '#7B5CFF' },
  'phone-inc': { kind: 'letter', mark: 'P', brandColor: '#0EA5E9' },
  luma: { kind: 'letter', mark: 'L', brandColor: '#E11D48' },
  klaviyo: { kind: 'letter', mark: 'K', brandColor: '#FFD400' },
  shipstation: { kind: 'letter', mark: 'S', brandColor: '#0078D2' },
  firecrawl: { kind: 'letter', mark: 'F', brandColor: '#FA5D19' },
};

interface BrandLogoProps {
  brand: BrandSlug;
  size?: number;
  className?: string;
}

export function BrandLogo({ brand, size = 32, className }: BrandLogoProps) {
  const entry = REGISTRY[brand];

  if (entry.kind === 'svg') {
    const wrapperClass = entry.bgOnDark
      ? `inline-flex items-center justify-center rounded-md bg-cw-stone-100 dark:bg-cw-stone-50 ${className ?? ''}`
      : `inline-flex items-center justify-center ${className ?? ''}`;
    return (
      <span
        className={wrapperClass}
        style={{ width: size, height: size }}
      >
        <Image
          src={`/logos/${entry.file}`}
          alt={`${brand} logo`}
          width={Math.floor(size * 0.75)}
          height={Math.floor(size * 0.75)}
          unoptimized
        />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-md font-semibold ${className ?? ''}`}
      style={{
        width: size,
        height: size,
        backgroundColor: entry.brandColor,
        color: '#0a0a0b',
        fontSize: Math.floor(size * 0.5),
        lineHeight: 1,
      }}
      aria-label={`${brand} logo`}
    >
      {entry.mark}
    </span>
  );
}

export const BRAND_REGISTRY = REGISTRY;
