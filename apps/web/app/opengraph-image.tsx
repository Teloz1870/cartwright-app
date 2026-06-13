import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const alt = 'cartwright — the AI-first webshop template you actually own';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0a0a0b',
          padding: '72px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '9999px',
              background: '#7c5cff',
            }}
          />
          <div
            style={{
              fontSize: '34px',
              fontWeight: 600,
              color: '#fafaf9',
              letterSpacing: '-0.02em',
            }}
          >
            cartwright
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div
            style={{
              fontSize: '68px',
              fontWeight: 600,
              color: '#fafaf9',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              maxWidth: '900px',
            }}
          >
            The AI-first webshop template you actually own.
          </div>
          <div
            style={{
              fontSize: '28px',
              color: '#a8a29e',
              maxWidth: '820px',
            }}
          >
            Next.js 16 commerce stack with an AI-native admin, MCP server, and
            Stripe checkout. Scaffold with one command.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#7c5cff',
          }}
        >
          <span style={{ color: '#737373' }}>$</span>
          npx create-cartwright@latest my-shop
        </div>
      </div>
    ),
    size,
  );
}
