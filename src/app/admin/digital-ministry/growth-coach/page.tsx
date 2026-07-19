import Link from 'next/link'
import {
  ArrowUpRight,
  CheckCircle2,
  LineChart,
  ListTodo,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DmCard, DmKpiCard, DmPageHeader } from '@/components/admin/digital-ministry/dm-ui'
import {
  getDigitalMinistryKpis,
  getOrBuildAiSummary,
} from '@/lib/digital-ministry/dashboard'
import { listGrowthReports, listOpenAiTasks } from '@/lib/digital-ministry/growth'
import { GrowthCoachActions } from '@/components/admin/digital-ministry/growth-coach-actions'
import { GrowthTasksList } from '@/components/admin/digital-ministry/growth-tasks-list'
import { cn } from '@/lib/utils'

function recText(r: unknown): string {
  if (typeof r === 'string') return r
  if (typeof r === 'object' && r && 'text' in r) return String((r as { text: string }).text)
  return JSON.stringify(r)
}

function recMeta(r: unknown): { impact?: string; effort?: string } {
  if (typeof r === 'object' && r) {
    const o = r as { impact?: string; effort?: string }
    return { impact: o.impact, effort: o.effort }
  }
  return {}
}

function scoreTone(score: number) {
  if (score >= 75) return 'text-emerald-700'
  if (score >= 55) return 'text-amber-700'
  return 'text-destructive'
}

function scoreRing(score: number) {
  if (score >= 75) return 'border-emerald-200 bg-emerald-50'
  if (score >= 55) return 'border-amber-200 bg-amber-50'
  return 'border-red-200 bg-red-50'
}

function impactTone(impact?: string) {
  switch (impact) {
    case 'high':
      return 'border-emerald-200 bg-emerald-50 text-emerald-900'
    case 'medium':
      return 'border-amber-200 bg-amber-50 text-amber-900'
    case 'low':
      return 'border-sky-200 bg-sky-50 text-sky-900'
    default:
      return 'border-border bg-muted text-muted-foreground'
  }
}

export default async function GrowthCoachPage() {
  const kpis = await getDigitalMinistryKpis()
  const summary = await getOrBuildAiSummary(kpis)
  const reports = await listGrowthReports(12)
  const tasks = await listOpenAiTasks(12)
  const latest = reports[0]

  const score = latest?.growth_score ?? kpis.growthScore ?? summary.confidence ?? 0
  const reasons = Array.isArray(latest?.reasons)
    ? (latest!.reasons as unknown[]).map((r) => (typeof r === 'string' ? r : JSON.stringify(r)))
    : []
  const recommendations =
    Array.isArray(latest?.recommendations) && latest!.recommendations.length
      ? (latest!.recommendations as unknown[])
      : [summary.recommendation]

  const inboxPressure = kpis.unreadPrayer + kpis.unreadContact + kpis.openComments

  return (
    <div className="space-y-6">
      <DmPageHeader
        title="Growth Coach"
        description="Daily score, reasons, and actionable recommendations grounded in KDC’s live digital performance."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/digital-ministry/analytics">Analytics</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/digital-ministry">Dashboard</Link>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <DmKpiCard
          label="Growth score"
          value={`${score}%`}
          hint={latest ? `${latest.period} · ${latest.report_date}` : 'Generate a report'}
          accent={scoreTone(score)}
        />
        <DmKpiCard
          label="Open tasks"
          value={tasks.length}
          hint={tasks.length ? 'Coach action items' : 'Generate report for tasks'}
        />
        <DmKpiCard
          label="Inbox pressure"
          value={inboxPressure}
          hint={`${kpis.unreadPrayer} prayer · ${kpis.openComments} community`}
          accent={inboxPressure > 0 ? 'text-amber-700' : 'text-emerald-700'}
        />
        <DmKpiCard
          label="Expected lift"
          value={
            latest?.expected_growth_pct != null
              ? `+${latest.expected_growth_pct}%`
              : summary.expectedImpact || '—'
          }
          hint="If recommendations are executed"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
            <DmCard
              className={cn(
                'flex flex-col items-center justify-center border p-8 text-center',
                scoreRing(score)
              )}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Today&apos;s score
              </p>
              <p className={cn('mt-2 text-5xl font-semibold tabular-nums', scoreTone(score))}>
                {score}
                <span className="text-xl text-muted-foreground">%</span>
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {latest ? `${latest.period} · ${latest.report_date}` : 'No report yet — generate one'}
              </p>
              {latest?.expected_growth_pct != null ? (
                <p className="mt-3 inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/70 px-2.5 py-1 text-[11px] font-medium">
                  <TrendingUp className="size-3" />
                  +{latest.expected_growth_pct}% potential
                </p>
              ) : null}
            </DmCard>

            <DmCard className="space-y-5 p-5 sm:p-6">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-teal-800" />
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Briefing
                  </p>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-foreground">
                  {latest?.summary || summary.body}
                </p>
              </div>

              {reasons.length > 0 ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Why this score
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {reasons.slice(0, 5).map((r, i) => (
                      <li key={i} className="flex gap-2 text-xs leading-snug text-foreground/90">
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-teal-700/70" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="rounded-xl border border-teal-200/60 bg-teal-50/40 p-4">
                <div className="flex items-center gap-2">
                  <Target className="size-3.5 text-teal-800" />
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-900/80">
                    Recommendations
                  </p>
                </div>
                <ul className="mt-3 space-y-2.5">
                  {recommendations.slice(0, 5).map((r, i) => {
                    const text = recText(r)
                    const meta = recMeta(r)
                    return (
                      <li key={i} className="text-sm leading-snug">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {meta.impact ? (
                            <span
                              className={cn(
                                'rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase',
                                impactTone(meta.impact)
                              )}
                            >
                              {meta.impact} impact
                            </span>
                          ) : null}
                          {meta.effort ? (
                            <span className="rounded-full border border-border bg-background/80 px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                              {meta.effort} effort
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-foreground/90">{text}</p>
                      </li>
                    )
                  })}
                </ul>
              </div>

              <GrowthCoachActions />
            </DmCard>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <DmCard className="p-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Signal
              </p>
              <p className="mt-2 text-sm font-medium">
                {kpis.sermonViews.toLocaleString()} sermon views
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {kpis.publishedSermons} published · {kpis.publishedPosts} posts
              </p>
            </DmCard>
            <DmCard className="p-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Ops
              </p>
              <p className="mt-2 text-sm font-medium">
                {kpis.unreadPrayer} unread prayers · {kpis.openComments} comments
              </p>
              <Button asChild size="sm" variant="ghost" className="mt-2 h-7 px-0">
                <Link href="/admin/digital-ministry/community">
                  Open inbox
                  <ArrowUpRight className="ml-1 size-3.5 opacity-60" />
                </Link>
              </Button>
            </DmCard>
            <DmCard className="p-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Distribution
              </p>
              <p className="mt-2 text-sm font-medium">
                {kpis.connectedAccounts} connected accounts
              </p>
              <Button asChild size="sm" variant="ghost" className="mt-2 h-7 px-0">
                <Link href="/admin/digital-ministry/accounts">
                  Manage accounts
                  <ArrowUpRight className="ml-1 size-3.5 opacity-60" />
                </Link>
              </Button>
            </DmCard>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <ListTodo className="size-4 text-teal-800" />
              <div>
                <h2 className="text-sm font-semibold tracking-tight">Coach tasks</h2>
                <p className="text-xs text-muted-foreground">
                  Prioritized actions from the latest report — mark done as you execute.
                </p>
              </div>
            </div>
            <GrowthTasksList
              tasks={tasks.map((t) => ({
                id: t.id,
                title: t.title,
                description: t.description,
                priority: t.priority,
                difficulty: t.difficulty,
                expected_impact: t.expected_impact,
                status: t.status,
              }))}
            />
          </div>

          {reports.length > 0 ? (
            <DmCard className="overflow-hidden p-0">
              <div className="border-b border-border/60 px-5 py-4">
                <p className="text-sm font-semibold">Report history</p>
                <p className="text-xs text-muted-foreground">Recent Growth Coach runs</p>
              </div>
              <ul className="divide-y divide-border/60">
                {reports.map((r, idx) => (
                  <li
                    key={r.id}
                    className={cn(
                      'flex items-center justify-between gap-3 px-5 py-3 text-sm',
                      idx === 0 && 'bg-muted/30'
                    )}
                  >
                    <div className="min-w-0">
                      <p className="font-medium">
                        {r.report_date}
                        <span className="ml-2 text-xs font-normal capitalize text-muted-foreground">
                          {r.period}
                          {idx === 0 ? ' · current' : ''}
                        </span>
                      </p>
                      {r.summary ? (
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{r.summary}</p>
                      ) : null}
                    </div>
                    <span
                      className={cn(
                        'shrink-0 tabular-nums font-semibold',
                        scoreTone(r.growth_score ?? 0)
                      )}
                    >
                      {r.growth_score ?? '—'}%
                    </span>
                  </li>
                ))}
              </ul>
            </DmCard>
          ) : null}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <DmCard className="space-y-3 p-5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-teal-800" />
              <p className="text-sm font-semibold">How to use Growth Coach</p>
            </div>
            <ol className="list-decimal space-y-2 pl-4 text-xs leading-relaxed text-muted-foreground">
              <li>Generate today&apos;s report (or rely on the daily cron).</li>
              <li>Read the briefing and score reasons.</li>
              <li>Work open tasks — high priority first.</li>
              <li>Re-run weekly/monthly for trend reviews.</li>
            </ol>
          </DmCard>

          <DmCard className="space-y-3 p-5">
            <div className="flex items-center gap-2">
              <LineChart className="size-4 text-teal-800" />
              <p className="text-sm font-semibold">Score inputs</p>
            </div>
            <ul className="space-y-2 text-xs leading-relaxed text-muted-foreground">
              <li className="flex gap-2">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/50" />
                Content reach (sermon views, posts)
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/50" />
                Pastoral ops (prayer & community backlog)
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/50" />
                Distribution (connected social accounts)
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/50" />
                Site conversions (contact, gifts, testimonies)
              </li>
            </ul>
          </DmCard>

          <DmCard className="space-y-2 border-dashed p-5 text-xs leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">Automation</p>
            <p>
              Cron endpoint:{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-[10px]">
                GET /api/digital-ministry/cron/growth
              </code>
            </p>
            <p>
              Auth via <code className="rounded bg-muted px-1 py-0.5 text-[10px]">CRON_SECRET</code> or{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-[10px]">DM_CRON_SECRET</code>.
            </p>
          </DmCard>
        </aside>
      </div>
    </div>
  )
}
