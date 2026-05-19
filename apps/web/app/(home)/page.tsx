import { Hero } from '@/components/landing/hero';
import { ValueProps } from '@/components/landing/value-props';
import { HowItWorks } from '@/components/landing/how-it-works';
import { FeatureGrid } from '@/components/landing/feature-grid';
import { StackGrid } from '@/components/landing/stack-grid';
import { LivePreview } from '@/components/landing/live-preview';
import { CodePeek } from '@/components/landing/code-peek';
import { InstallBand } from '@/components/landing/install-band';
import { Faq } from '@/components/landing/faq';
import { CtaFooter } from '@/components/landing/cta-footer';

export default function HomePage() {
  return (
    <div className="flex-1 bg-cw-paper dark:bg-cw-ink text-cw-stone-700 dark:text-cw-stone-300">
      <Hero />
      <ValueProps />
      <HowItWorks />
      <FeatureGrid />
      <StackGrid />
      <LivePreview />
      <CodePeek />
      <InstallBand />
      <Faq />
      <CtaFooter />
    </div>
  );
}
