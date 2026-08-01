import { NextResponse } from 'next/server'
import { runCompetitorCaptureCron } from '@/lib/digital-ministry/competitor-intelligence/cron'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * Scheduled competitor captures (daily).
 * Authorize with Authorization: Bearer $CRON_SECRET or ?secret=
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

  const result = await runCompetitorCaptureCron()
  if ('error' in result) {
    return NextResponse.json(result, { status: 500 })
  }
  return NextResponse.json(result)
}

export async function POST(request: Request) {
  return GET(request)
}
