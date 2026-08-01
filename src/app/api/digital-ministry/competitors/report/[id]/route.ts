import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/authz'
import { formatStrategyReportHtml } from '@/lib/digital-ministry/competitor-intelligence/report-format'
import type { StrategyReportPayload } from '@/lib/digital-ministry/competitor-intelligence/types'

export const dynamic = 'force-dynamic'

/** Print-ready HTML report (Save as PDF from browser). Staff session or cron secret. */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const secret = process.env.CRON_SECRET || process.env.DM_CRON_SECRET
  const auth = request.headers.get('authorization')
  const url = new URL(request.url)
  const q = url.searchParams.get('secret')
  const cronOk = secret && (auth === `Bearer ${secret}` || q === secret)

  if (!cronOk) {
    const staff = await requireStaff()
    if ('error' in staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('dm_competitor_strategy_reports')
    .select('payload, created_at')
    .eq('id', params.id)
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }

  const payload = data.payload as StrategyReportPayload
  const date = new Date(payload.generatedAt || data.created_at).toISOString().slice(0, 10)
  const html = formatStrategyReportHtml(payload, { forPrint: true })

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="kdc-competitor-report-${date}.html"`,
    },
  })
}
