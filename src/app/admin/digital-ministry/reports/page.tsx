import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DmKpiCard, DmPageHeader } from '@/components/admin/digital-ministry/dm-ui'
import { ReportsClient } from '@/components/admin/digital-ministry/reports-client'
import { listDmReports } from '@/lib/digital-ministry/analytics'

export default async function ReportsPage() {
  const reports = await listDmReports(40)

  const byPeriod = reports.reduce<Record<string, number>>((acc, r) => {
    acc[r.period] = (acc[r.period] ?? 0) + 1
    return acc
  }, {})

  const latest = reports[0]
  const thisWeek = reports.filter((r) => {
    const age = Date.now() - new Date(r.created_at).getTime()
    return age < 7 * 24 * 60 * 60 * 1000
  }).length

  return (
    <div className="space-y-6">
      <DmPageHeader
        title="Reports"
        description="Generate daily-to-yearly ministry snapshots with CSV export — stored for leadership review and planning."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/digital-ministry/growth-coach">Growth Coach</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/digital-ministry">Dashboard</Link>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <DmKpiCard
          label="Total reports"
          value={reports.length}
          hint="Stored in archive"
        />
        <DmKpiCard
          label="This week"
          value={thisWeek}
          hint="Generated in last 7 days"
        />
        <DmKpiCard
          label="Latest period"
          value={latest ? latest.period : '—'}
          hint={
            latest
              ? `${latest.period_start} → ${latest.period_end}`
              : 'Generate your first report'
          }
        />
        <DmKpiCard
          label="Coverage"
          value={Object.keys(byPeriod).length || '—'}
          hint={
            Object.keys(byPeriod).length
              ? Object.entries(byPeriod)
                  .map(([k, v]) => `${k} ${v}`)
                  .join(' · ')
              : 'daily · weekly · monthly…'
          }
        />
      </div>

      <ReportsClient
        reports={reports.map((r) => ({
          id: r.id,
          period: r.period,
          period_start: r.period_start,
          period_end: r.period_end,
          title: r.title,
          summary: r.summary,
          created_at: r.created_at,
          payload: (r.payload ?? null) as Record<string, unknown> | null,
        }))}
        periodCounts={byPeriod}
      />
    </div>
  )
}
