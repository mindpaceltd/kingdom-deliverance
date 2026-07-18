import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DmCard, DmPageHeader } from '@/components/admin/digital-ministry/dm-ui'
import {
  getDigitalMinistryKpis,
  getOrBuildAiSummary,
} from '@/lib/digital-ministry/dashboard'
import { listGrowthReports } from '@/lib/digital-ministry/growth'
import { GrowthCoachActions } from '@/components/admin/digital-ministry/growth-coach-actions'

export default async function GrowthCoachPage() {
  const kpis = await getDigitalMinistryKpis()
  const summary = await getOrBuildAiSummary(kpis)
  const reports = await listGrowthReports(10)
  const latest = reports[0]

  return (
    <div className="space-y-6">
      <DmPageHeader
        title="Growth Coach"
        description="Daily score, reasons, and recommendations grounded in KDC’s real performance."
        actions={
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/digital-ministry">Back to dashboard</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
        <DmCard className="flex flex-col items-center justify-center p-8 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Growth score
          </p>
          <p className="mt-2 text-5xl font-semibold tabular-nums">
            {latest?.growth_score ?? kpis.growthScore ?? summary.confidence}
            <span className="text-xl text-muted-foreground">%</span>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {latest ? `${latest.period} · ${latest.report_date}` : 'Provisional until you generate'}
          </p>
        </DmCard>

        <DmCard className="space-y-4 p-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Briefing
            </p>
            <p className="mt-2 text-sm leading-relaxed text-foreground">
              {latest?.summary || summary.body}
            </p>
          </div>
          <div className="rounded-xl border bg-muted/40 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Recommendations
            </p>
            <ul className="mt-2 space-y-1.5 text-sm">
              {Array.isArray(latest?.recommendations) && latest.recommendations.length
                ? latest.recommendations.slice(0, 5).map((r, i) => (
                    <li key={i}>
                      {typeof r === 'string'
                        ? r
                        : typeof r === 'object' && r && 'text' in r
                          ? String((r as { text: string }).text)
                          : JSON.stringify(r)}
                    </li>
                  ))
                : [<li key="def">{summary.recommendation}</li>]}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              Expected growth:{' '}
              {latest?.expected_growth_pct != null
                ? `+${latest.expected_growth_pct}%`
                : summary.expectedImpact}
            </p>
          </div>
          <GrowthCoachActions />
          <p className="text-[11px] text-muted-foreground">
            Cron: <code>GET /api/digital-ministry/cron/growth</code> with{' '}
            <code>CRON_SECRET</code> / <code>DM_CRON_SECRET</code>.
          </p>
        </DmCard>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: 'Signal', value: `${kpis.sermonViews.toLocaleString()} sermon views` },
          { label: 'Ops', value: `${kpis.unreadPrayer} unread prayers · ${kpis.openComments} comments` },
          { label: 'Distribution', value: `${kpis.connectedAccounts} connected accounts` },
        ].map((c) => (
          <DmCard key={c.label} className="p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {c.label}
            </p>
            <p className="mt-2 text-sm font-medium">{c.value}</p>
          </DmCard>
        ))}
      </div>

      {reports.length > 1 ? (
        <DmCard className="p-5">
          <p className="text-sm font-semibold">Recent reports</p>
          <ul className="mt-3 divide-y">
            {reports.map((r) => (
              <li key={r.id} className="flex justify-between gap-3 py-2 text-sm">
                <span>
                  {r.report_date} · {r.period}
                </span>
                <span className="tabular-nums font-medium">{r.growth_score ?? '—'}%</span>
              </li>
            ))}
          </ul>
        </DmCard>
      ) : null}
    </div>
  )
}
