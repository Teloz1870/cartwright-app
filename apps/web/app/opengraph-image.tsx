import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const alt = 'cartwright — AI runs the shop. You keep the keys.';
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
          background: '#0d100e',
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
              background: '#c33f16',
            }}
          />
          <div
            style={{
              fontSize: '34px',
              fontWeight: 600,
              color: '#eceadf',
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
              color: '#eceadf',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              maxWidth: '900px',
            }}
          >
            AI runs the shop. You keep the keys.
          </div>
          <div
            style={{
              fontSize: '28px',
              color: '#a5a89d',
              maxWidth: '820px',
            }}
          >
            An AI-native commerce engine built for trusted operation — scoped
            tools, confirmation-gated writes, and a repo you can leave with.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#ff6a3d',
          }}
        >
          <span style={{ color: '#66685f' }}>$</span>
          npx create-cartwright@latest my-shop
        </div>
      </div>
    ),
    size,
  );
}
