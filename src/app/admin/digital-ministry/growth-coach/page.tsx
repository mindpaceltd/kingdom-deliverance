import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DmCard, DmPageHeader } from '@/components/admin/digital-ministry/dm-ui'
import {
  getDigitalMinistryKpis,
  getOrBuildAiSummary,
} from '@/lib/digital-ministry/dashboard'

export default async function GrowthCoachPage() {
  const kpis = await getDigitalMinistryKpis()
  const summary = await getOrBuildAiSummary(kpis)

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
            {kpis.growthScore ?? summary.confidence}
            <span className="text-xl text-muted-foreground">%</span>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Daily · provisional</p>
        </DmCard>

        <DmCard className="space-y-4 p-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Briefing
            </p>
            <p className="mt-2 text-sm leading-relaxed text-foreground">{summary.body}</p>
          </div>
          <div className="rounded-xl border bg-muted/40 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Recommendations
            </p>
            <p className="mt-1.5 text-sm font-medium">{summary.recommendation}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Expected growth: {summary.expectedImpact}
            </p>
          </div>
          <Button disabled className="w-full sm:w-auto">
            Persist today’s report (Phase 5)
          </Button>
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
    </div>
  )
}
