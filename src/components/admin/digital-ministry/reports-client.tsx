'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DmCard } from '@/components/admin/digital-ministry/dm-ui'
import { generateDmReport } from '@/lib/digital-ministry/analytics'
import { cn } from '@/lib/utils'
import {
  CalendarRange,
  Download,
  FileBarChart2,
  Loader2,
  Sparkles,
} from 'lucide-react'

type Period = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'

type Report = {
  id: string
  period: string
  period_start: string
  period_end: string
  title: string
  summary: string | null
  created_at: string
  payload: Record<string, unknown> | null
}

const PERIODS: { id: Period; label: string; hint: string }[] = [
  { id: 'daily', label: 'Daily', hint: 'Last 24 hours' },
  { id: 'weekly', label: 'Weekly', hint: 'Last 7 days' },
  { id: 'monthly', label: 'Monthly', hint: 'Last month' },
  { id: 'quarterly', label: 'Quarterly', hint: 'Last 3 months' },
  { id: 'yearly', label: 'Yearly', hint: 'Last 12 months' },
]

function relativeTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 48) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 14) return `${days}d ago`
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

function periodTone(period: string) {
  switch (period) {
    case 'daily':
      return 'border-sky-200 bg-sky-50 text-sky-900'
    case 'weekly':
      return 'border-teal-200 bg-teal-50 text-teal-900'
    case 'monthly':
      return 'border-violet-200 bg-violet-50 text-violet-900'
    case 'quarterly':
      return 'border-amber-200 bg-amber-50 text-amber-900'
    case 'yearly':
      return 'border-rose-200 bg-rose-50 text-rose-900'
    default:
      return 'border-border bg-muted text-muted-foreground'
  }
}

function kpiSnapshot(payload: Record<string, unknown> | null) {
  const kpis = (payload?.kpis ?? null) as Record<string, unknown> | null
  if (!kpis) return [] as Array<{ label: string; value: string }>
  const rows: Array<{ key: string; label: string }> = [
    { key: 'sermonViews', label: 'Sermon views' },
    { key: 'publishedSermons', label: 'Sermons' },
    { key: 'publishedPosts', label: 'Posts' },
    { key: 'connectedAccounts', label: 'Accounts' },
    { key: 'unreadPrayer', label: 'Unread prayer' },
    { key: 'openComments', label: 'Open comments' },
    { key: 'testimonies', label: 'Testimonies' },
    { key: 'growthScore', label: 'Growth score' },
    { key: 'donations', label: 'Gifts' },
  ]
  return rows
    .filter((r) => kpis[r.key] != null && kpis[r.key] !== '')
    .map((r) => ({
      label: r.label,
      value:
        typeof kpis[r.key] === 'number'
          ? Number(kpis[r.key]).toLocaleString()
          : String(kpis[r.key]),
    }))
}

function csvFromPayload(report: Report) {
  const kpis = (report.payload?.kpis ?? {}) as Record<string, unknown>
  const rows: string[][] = [
    ['metric', 'value'],
    ['period', report.period],
    ['period_start', report.period_start],
    ['period_end', report.period_end],
    ['published_sermons', String(kpis.publishedSermons ?? '')],
    ['sermon_views', String(kpis.sermonViews ?? '')],
    ['published_posts', String(kpis.publishedPosts ?? '')],
    ['connected_accounts', String(kpis.connectedAccounts ?? '')],
    ['unread_prayer', String(kpis.unreadPrayer ?? '')],
    ['open_comments', String(kpis.openComments ?? '')],
    ['testimonies', String(kpis.testimonies ?? '')],
    ['media_assets', String(kpis.mediaAssets ?? '')],
    ['growth_score', String(kpis.growthScore ?? '')],
    ['donations', String(kpis.donations ?? '')],
  ]
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function ReportsClient({
  reports,
  periodCounts,
}: {
  reports: Report[]
  periodCounts: Record<string, number>
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [filter, setFilter] = useState<'all' | Period>('all')
  const [activePeriod, setActivePeriod] = useState<Period | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(reports[0]?.id ?? null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [freshCsv, setFreshCsv] = useState<{ title: string; csv: string } | null>(null)

  const visible = useMemo(() => {
    if (filter === 'all') return reports
    return reports.filter((r) => r.period === filter)
  }, [reports, filter])

  function run(period: Period) {
    setError(null)
    setMessage(null)
    setActivePeriod(period)
    startTransition(async () => {
      try {
        const result = await generateDmReport(period)
        if ('error' in result) setError(result.error)
        else {
          setFreshCsv({ title: result.title, csv: result.csv })
          setMessage(`${period} report saved`)
          setExpandedId(result.id)
          setFilter(period)
          router.refresh()
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Report failed')
      } finally {
        setActivePeriod(null)
      }
    })
  }

  return (
    <div className="space-y-6">
      {(error || message) && (
        <p
          className={cn(
            'rounded-xl border px-4 py-2.5 text-sm',
            error
              ? 'border-destructive/30 bg-destructive/5 text-destructive'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          )}
        >
          {error ?? message}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <DmCard className="space-y-4 p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                <FileBarChart2 className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">Generate report</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Snapshots live KPIs into a dated report and CSV for leadership or board packs.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {PERIODS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={pending}
                  onClick={() => run(p.id)}
                  className={cn(
                    'rounded-xl border px-3 py-3 text-left transition-colors disabled:opacity-60',
                    'border-border bg-card hover:bg-muted/50'
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    {pending && activePeriod === p.id ? (
                      <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                    ) : (
                      <Sparkles className="size-3.5 text-teal-800" />
                    )}
                    <span className="text-sm font-semibold capitalize">{p.label}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{p.hint}</p>
                </button>
              ))}
            </div>

            {freshCsv ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  downloadText(
                    `${freshCsv.title.replace(/\s+/g, '-').toLowerCase()}.csv`,
                    freshCsv.csv
                  )
                }
              >
                <Download className="mr-1.5 size-3.5" />
                Download latest CSV
              </Button>
            ) : null}
          </DmCard>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Report archive</h2>
              <p className="text-xs text-muted-foreground">Expand a report for metrics and CSV export</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={cn(
                  'rounded-full border px-3 py-1 text-[11px] font-semibold',
                  filter === 'all'
                    ? 'border-foreground/20 bg-foreground text-background'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted/60'
                )}
              >
                All {reports.length}
              </button>
              {PERIODS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setFilter(p.id)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-[11px] font-semibold capitalize',
                    filter === p.id
                      ? 'border-foreground/20 bg-foreground text-background'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted/60'
                  )}
                >
                  {p.label} {periodCounts[p.id] ?? 0}
                </button>
              ))}
            </div>
          </div>

          {visible.length === 0 ? (
            <DmCard className="flex flex-col items-center px-6 py-14 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
                <FileBarChart2 className="size-5 text-muted-foreground" />
              </div>
              <p className="mt-4 text-sm font-semibold">
                {reports.length === 0 ? 'No reports yet' : 'Nothing in this filter'}
              </p>
              <p className="mt-1.5 max-w-sm text-xs text-muted-foreground">
                {reports.length === 0
                  ? 'Start with a weekly report — useful for Sunday leadership review.'
                  : 'Try another period filter or generate a new report.'}
              </p>
              {reports.length === 0 ? (
                <Button size="sm" className="mt-5" disabled={pending} onClick={() => run('weekly')}>
                  Generate weekly report
                </Button>
              ) : (
                <Button size="sm" className="mt-5" variant="outline" onClick={() => setFilter('all')}>
                  Show all
                </Button>
              )}
            </DmCard>
          ) : (
            <ul className="space-y-3">
              {visible.map((r) => {
                const open = expandedId === r.id
                const metrics = kpiSnapshot(r.payload)

                return (
                  <li key={r.id}>
                    <DmCard className="overflow-hidden p-0">
                      <button
                        type="button"
                        className="flex w-full items-start gap-3 p-4 text-left sm:p-5"
                        onClick={() => setExpandedId(open ? null : r.id)}
                      >
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-muted">
                          <CalendarRange className="size-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                'rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                                periodTone(r.period)
                              )}
                            >
                              {r.period}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {relativeTime(r.created_at)}
                            </span>
                          </div>
                          <p className="mt-1.5 text-sm font-semibold leading-snug">{r.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {r.period_start} → {r.period_end}
                          </p>
                          {r.summary && !open ? (
                            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                              {r.summary}
                            </p>
                          ) : null}
                        </div>
                      </button>

                      {open ? (
                        <div className="space-y-4 border-t border-border/60 bg-muted/20 px-4 py-4 sm:px-5">
                          {r.summary ? (
                            <p className="text-sm leading-relaxed text-foreground/90">{r.summary}</p>
                          ) : null}

                          {metrics.length ? (
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                              {metrics.map((m) => (
                                <div
                                  key={m.label}
                                  className="rounded-xl border border-border/60 bg-background/70 px-3 py-2"
                                >
                                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    {m.label}
                                  </p>
                                  <p className="mt-0.5 text-sm font-semibold tabular-nums">{m.value}</p>
                                </div>
                              ))}
                            </div>
                          ) : null}

                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                downloadText(
                                  `${r.title.replace(/\s+/g, '-').toLowerCase()}.csv`,
                                  csvFromPayload(r)
                                )
                              }
                            >
                              <Download className="mr-1.5 size-3.5" />
                              Download CSV
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={pending}
                              onClick={() => run(r.period as Period)}
                            >
                              Regenerate {r.period}
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </DmCard>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <DmCard className="space-y-3 p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-teal-800" />
              <p className="text-sm font-semibold">Suggested cadence</p>
            </div>
            <ul className="space-y-2 text-xs leading-relaxed text-muted-foreground">
              <li className="flex gap-2">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/50" />
                Daily — quick ops pulse for the media team
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/50" />
                Weekly — Sunday leadership / pastoral review
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/50" />
                Monthly / quarterly — board or ministry planning packs
              </li>
            </ul>
          </DmCard>

          <DmCard className="space-y-3 p-5">
            <p className="text-sm font-semibold">Related</p>
            <div className="space-y-2">
              <Button asChild size="sm" variant="outline" className="w-full justify-start">
                <Link href="/admin/digital-ministry/growth-coach">Growth Coach scores</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="w-full justify-start">
                <Link href="/admin/digital-ministry/analytics">Analytics dashboard</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="w-full justify-start">
                <Link href="/admin/digital-ministry/website">Website conversions</Link>
              </Button>
            </div>
          </DmCard>

          <DmCard className="border-dashed p-5 text-xs leading-relaxed text-muted-foreground">
            Each report stores a KPI snapshot at generation time. CSV is for spreadsheets and offline
            sharing — it does not replace live Analytics.
          </DmCard>
        </aside>
      </div>
    </div>
  )
}
