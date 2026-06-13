'use client';

import { useEffect, useId, useRef, useState } from 'react';

let initialized = false;

export function Mermaid({ chart }: { chart: string }) {
  const id = useId().replace(/:/g, '');
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        if (!initialized) {
          mermaid.initialize({
            startOnLoad: false,
            theme: 'base',
            themeVariables: {
              fontFamily:
                'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
              primaryColor: '#fafaf9',
              primaryTextColor: '#262626',
              primaryBorderColor: '#d6d3d1',
              lineColor: '#737373',
              secondaryColor: '#f3f1ff',
              tertiaryColor: '#f5f5f4',
              clusterBkg: '#f5f5f4',
              clusterBorder: '#d6d3d1',
              edgeLabelBackground: '#fafaf9',
              actorBkg: '#f3f1ff',
              actorBorder: '#7c5cff',
              actorTextColor: '#262626',
              activationBkgColor: '#f3f1ff',
              sequenceNumberColor: '#262626',
              noteBkgColor: '#f3f1ff',
              noteBorderColor: '#7c5cff',
            },
            securityLevel: 'loose',
          });
          initialized = true;
        }
        const { svg } = await mermaid.render(`m-${id}`, chart.trim());
        if (!cancelled) setSvg(svg);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (error) {
    return (
      <pre className="overflow-x-auto rounded-md border border-red-300 bg-red-50 p-4 text-xs text-red-800">
        Mermaid render error: {error}
      </pre>
    );
  }

  return (
    <div
      ref={ref}
      className="my-6 flex justify-center overflow-x-auto rounded-lg border border-fd-border bg-fd-card p-6 [&_svg]:max-w-full"
       
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
