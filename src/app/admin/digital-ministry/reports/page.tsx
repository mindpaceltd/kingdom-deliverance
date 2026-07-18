import { DmPageHeader } from '@/components/admin/digital-ministry/dm-ui'
import { ReportsClient } from '@/components/admin/digital-ministry/reports-client'
import { listDmReports } from '@/lib/digital-ministry/analytics'

export default async function ReportsPage() {
  const reports = await listDmReports(30)

  return (
    <div className="space-y-6">
      <DmPageHeader
        title="Reports"
        description="Daily to yearly ministry reports with CSV export, stored in dm_reports."
      />
      <ReportsClient
        reports={reports.map((r) => ({
          id: r.id,
          period: r.period,
          period_start: r.period_start,
          period_end: r.period_end,
          title: r.title,
          summary: r.summary,
          created_at: r.created_at,
        }))}
      />
    </div>
  )
}
