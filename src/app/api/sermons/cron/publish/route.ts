import { NextResponse } from 'next/server'
import { publishDueSermons } from '@/lib/sermons/auto-publish'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Flip scheduled sermons whose time has passed to published.
 * Authorize with Authorization: Bearer $CRON_SECRET (or DM_CRON_SECRET) or ?secret=
 *
 * Suggested cadence: every hour via Vercel Cron / external scheduler.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET || process.env.DM_CRON_SECRET
  const auth = request.headers.get('authorization')
  const url = new URL(request.url)
  const q = url.searchParams.get('secret')
  const ok = secret && (auth === `Bearer ${secret}` || q === secret)

  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await publishDueSermons()
  if (result.error) {
    return NextResponse.json(result, { status: 500 })
  }
  return NextResponse.json(result)
}

export async function POST(request: Request) {
  return GET(request)
}
