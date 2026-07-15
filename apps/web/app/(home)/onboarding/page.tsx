import type { Metadata } from 'next';
import AgenticOnboarding from './onboarding-client';

// The interactive demo is a client component (onboarding-client.tsx), which
// cannot export metadata — this server wrapper owns the page identity so the
// tab/OG title describes the page truthfully instead of falling back.
export const metadata: Metadata = {
  title: 'Agentic onboarding (Plus preview)',
  description:
    'An interactive preview of the Plus migration agent: paste a Shopify or WooCommerce URL and watch a five-agent AI workforce rebuild it as a Cartwright shop. Demo only — the real agent is in development; Hoptify import and product CSV import are available self-hosted today.',
};

export default function OnboardingPage() {
  return <AgenticOnboarding />;
}
