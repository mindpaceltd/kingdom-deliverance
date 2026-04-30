import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get('title') || 'Kingdom Deliverance Centre Uganda'
  const description = searchParams.get('description') || 'Experience God\'s love, healing, and deliverance.'

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          padding: '60px',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Decorative circle */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.03)',
            border: '2px solid rgba(255,255,255,0.08)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50px',
            right: '50px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        />

        {/* Site name badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '24px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '100px',
            padding: '8px 20px',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          <span style={{ color: '#e2c97e', fontSize: '14px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            KDC Uganda
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: title.length > 60 ? '36px' : '48px',
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1.2,
            marginBottom: '20px',
            maxWidth: '900px',
          }}
        >
          {title}
        </div>

        {/* Description */}
        {description && (
          <div
            style={{
              fontSize: '20px',
              color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.5,
              maxWidth: '800px',
              marginBottom: '32px',
            }}
          >
            {description.length > 120 ? description.slice(0, 120) + '…' : description}
          </div>
        )}

        {/* Domain */}
        <div style={{ fontSize: '16px', color: '#e2c97e', fontWeight: 500 }}>
          kdcuganda.org
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
