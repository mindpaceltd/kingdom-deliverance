import { NextResponse } from 'next/server'
import { getAboutHeroUrl } from '@/lib/seo/page-hero'
import { getOrgOgImageUrl } from '@/lib/seo/site-branding'

export const runtime = 'nodejs'

async function fetchImage(url: string): Promise<NextResponse | null> {
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'facebookexternalhit/1.1',
      },
    })
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) return null

    const body = await res.arrayBuffer()
    return new NextResponse(body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch {
    return null
  }
}

export async function GET() {
  const [orgOgImage, aboutHero] = await Promise.all([getOrgOgImageUrl(), getAboutHeroUrl()])
  const candidates = [orgOgImage, aboutHero].filter(Boolean)

  for (const candidate of candidates) {
    const response = await fetchImage(candidate)
    if (response) return response
  }

  return NextResponse.redirect(
    'https://kdcuganda.org/og?title=About%20Us%20%7C%20Kingdom%20Deliverance%20Centre%20Uganda&type=default',
    302
  )
}
