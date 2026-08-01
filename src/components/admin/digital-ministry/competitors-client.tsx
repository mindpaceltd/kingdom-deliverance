'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DmCard } from '@/components/admin/digital-ministry/dm-ui'
import {
  CompetitorForm,
  competitorFormFromRecord,
  emptyForm,
} from '@/components/admin/digital-ministry/competitor-form'
import {
  captureAllCompetitorsIntelligence,
  captureCompetitorIntelligence,
  deleteCompetitor,
  generateCompetitorStrategyReport,
  upsertCompetitor,
} from '@/lib/digital-ministry/competitors'
import {
  listConfiguredPlatformUrls,
  parseCompetitorPlatforms,
  type CompetitorPlatformKey,
} from '@/lib/digital-ministry/competitor-platforms'
import type { StrategyReportPayload } from '@/lib/digital-ministry/competitor-intelligence/types'
import type { CompetitorCaptureRunResult } from '@/lib/digital-ministry/competitor-intelligence/types'
import type { ContentGapMatrix } from '@/lib/digital-ministry/competitor-intelligence/types'
import { cn } from '@/lib/utils'
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Download,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-react'

const ContentGapMatrixView = dynamic(
  () =>
    import('@/components/admin/digital-ministry/content-gap-matrix').then(
      (m) => m.ContentGapMatrixHeatmap
    ),
  {
    ssr: false,
    loading: () => <p className="text-xs text-muted-foreground">Loading gap matrix…</p>,
  }
)

type Comp = {
  id: string
  name: string
  website_url: string | null
  notes: string | null
  country?: string | null
  organization_type?: string | null
  monitoring_frequency?: string | null
  last_captured_at: string | null
  urls: Partial<Record<CompetitorPlatformKey, string>>
  metrics: ReturnType<typeof parseCompetitorPlatforms>['metrics']
}

type Dashboard = {
  trackedPeers: number
  activeSources: number
  contentFound: number
  opportunities: number
  topTopics: Array<{ topic: string; count: number; share: number }>
  activityByCompetitor: Array<{
    id: string
    name: string
    contentCount: number
    lastCaptured: string | null
    monitoringFrequency: string | null
  }>
  recentInsights: Array<{ id: string; title: string; priority: string | null }>
  gapMatrix?: ContentGapMatrix
}

function activityBarWidth(count: number, max: number) {
  if (!max) return '0%'
  return `${Math.max(8, Math.round((count / max) * 100))}%`
}

function CaptureResultPanel({ result }: { result: CompetitorCaptureRunResult }) {
  return (
    <DmCard className="space-y-3 p-4">
      <p className="text-sm font-semibold">Capture complete</p>
      <p className="text-xs text-muted-foreground">
        {result.contentCount} content pieces · {result.videoCount} videos · {result.websitePosts} website/RSS
      </p>
      <ul className="space-y-1.5">
        {result.steps.map((s) => (
          <li key={`${s.platform}-${s.label}`} className="flex items-start gap-2 text-xs">
            {s.status === 'ok' ? (
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
            ) : s.status === 'warning' ? (
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
            ) : (
              <XCircle className="mt-0.5 size-3.5 shrink-0 text-destructive" />
            )}
            <span>
              <span className="font-medium">{s.label}</span> — {s.message}
            </span>
          </li>
        ))}
      </ul>
      {result.dataLimitations.length > 0 && (
        <div className="rounded-lg border border-amber-200/80 bg-amber-50/50 p-3 text-[11px] text-amber-900">
          <p className="font-semibold">Data limitations (not invented)</p>
          <ul className="mt-1 list-disc pl-4">
            {result.dataLimitations.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      )}
    </DmCard>
  )
}

export function CompetitorsClient({
  competitors,
  dashboard,
}: {
  competitors: Comp[]
  dashboard: Dashboard | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(competitors.length === 0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formInitial, setFormInitial] = useState(emptyForm())
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [captureResult, setCaptureResult] = useState<CompetitorCaptureRunResult | null>(null)
  const [strategy, setStrategy] = useState<StrategyReportPayload | null>(null)

  const maxActivity = useMemo(
    () => Math.max(1, ...(dashboard?.activityByCompetitor.map((a) => a.contentCount) ?? [1])),
    [dashboard]
  )

  function run(action: () => Promise<void>) {
    setError(null)
    setMessage(null)
    startTransition(async () => {
      try {
        await action()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong')
      }
    })
  }

  function openAdd() {
    setEditingId(null)
    setFormInitial(emptyForm())
    setShowForm(true)
  }

  function openEdit(c: Comp) {
    setEditingId(c.id)
    setFormInitial(
      competitorFormFromRecord({
        name: c.name,
        website_url: c.website_url,
        notes: c.notes,
        country: c.country,
        organization_type: c.organization_type as Comp['organization_type'],
        monitoring_frequency: c.monitoring_frequency as Comp['monitoring_frequency'],
        urls: c.urls,
        metrics: c.metrics,
      })
    )
    setShowForm(true)
  }

  function saveForm(data: ReturnType<typeof emptyForm>) {
    if (!data.name.trim()) {
      setError('Ministry name is required')
      return
    }
    run(async () => {
      const urls = { ...data.urls }
      if (data.website.trim()) urls.website = data.website.trim()

      const result = await upsertCompetitor({
        id: editingId ?? undefined,
        name: data.name,
        websiteUrl: data.website,
        notes: data.notes,
        country: data.country,
        organizationType: data.organizationType,
        monitoringFrequency: data.monitoringFrequency,
        platforms: { urls, metrics: data.metrics },
      })
      if (result.error) setError(result.error)
      else {
        setShowForm(false)
        setEditingId(null)
        setMessage(editingId ? 'Competitor updated' : 'Competitor added')
        router.refresh()
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

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => (showForm && !editingId ? setShowForm(false) : openAdd())}>
          <Plus className="mr-1.5 size-3.5" />
          Add competitor
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={pending || !competitors.length}
          onClick={() =>
            run(async () => {
              const r = await captureAllCompetitorsIntelligence()
              if ('error' in r && r.error) setError(r.error)
              else if ('captured' in r) {
                setMessage(`Captured ${r.captured}/${r.total} competitors`)
                router.refresh()
              }
            })
          }
        >
          {pending ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 size-3.5" />}
          Run all captures
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={pending || !competitors.length}
          onClick={() =>
            run(async () => {
              const r = await generateCompetitorStrategyReport()
              if ('error' in r) setError(r.error)
              else if ('data' in r) {
                setStrategy(r.data)
                setMessage('AI strategy report ready')
                router.refresh()
              }
            })
          }
        >
          {pending ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : <Sparkles className="mr-1.5 size-3.5" />}
          AI strategy
        </Button>
      </div>

      {showForm ? (
        <CompetitorForm
          initial={formInitial}
          editingId={editingId ?? undefined}
          pending={pending}
          onSubmit={saveForm}
          onCancel={() => {
            setShowForm(false)
            setEditingId(null)
          }}
        />
      ) : null}

      {captureResult ? <CaptureResultPanel result={captureResult} /> : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {dashboard && dashboard.gapMatrix && (
            <DmCard className="p-5">
              <p className="mb-4 text-sm font-semibold">Content gap matrix</p>
              <ContentGapMatrixView matrix={dashboard.gapMatrix} />
            </DmCard>
          )}

          {dashboard && dashboard.activityByCompetitor.length > 0 && (
            <DmCard className="space-y-4 p-5">
              <p className="text-sm font-semibold">Competitor activity (last capture)</p>
              <div className="space-y-3">
                {dashboard.activityByCompetitor.map((a) => (
                  <div key={a.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <Link
                        href={`/admin/digital-ministry/competitors/${a.id}`}
                        className="font-medium hover:text-teal-800"
                      >
                        {a.name}
                      </Link>
                      <span className="text-muted-foreground">{a.contentCount} items</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-teal-700 transition-all"
                        style={{ width: activityBarWidth(a.contentCount, maxActivity) }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </DmCard>
          )}

          <ul className="space-y-3">
            {competitors.map((c) => {
              const sources = listConfiguredPlatformUrls(c.urls, c.website_url)
              return (
                <li key={c.id}>
                  <DmCard className="p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <Link
                          href={`/admin/digital-ministry/competitors/${c.id}`}
                          className="group flex items-center gap-1 text-sm font-semibold hover:text-teal-800"
                        >
                          {c.name}
                          <ChevronRight className="size-3.5 opacity-0 group-hover:opacity-100" />
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {sources.length} sources
                          {c.last_captured_at
                            ? ` · Last captured ${new Date(c.last_captured_at).toLocaleString()}`
                            : ' · Never captured'}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          disabled={pending}
                          onClick={() =>
                            run(async () => {
                              setCaptureResult(null)
                              const r = await captureCompetitorIntelligence(c.id)
                              if ('error' in r && r.error) setError(r.error)
                              else if ('runId' in r) {
                                setCaptureResult(r)
                                setMessage(`Captured ${c.name}`)
                                router.refresh()
                              }
                            })
                          }
                        >
                          {pending ? (
                            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                          ) : (
                            <BarChart3 className="mr-1.5 size-3.5" />
                          )}
                          Capture
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground hover:text-destructive"
                          disabled={pending}
                          onClick={() => {
                            if (!window.confirm(`Remove ${c.name}?`)) return
                            run(async () => {
                              const r = await deleteCompetitor(c.id)
                              if (r.error) setError(r.error)
                              else router.refresh()
                            })
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </DmCard>
                </li>
              )
            })}
          </ul>
        </div>

        <aside className="space-y-4">
          {dashboard && dashboard.topTopics.length > 0 && (
            <DmCard className="space-y-3 p-5">
              <p className="text-sm font-semibold">Top topics (all peers)</p>
              {dashboard.topTopics.map((t) => (
                <div key={t.topic} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{t.topic}</span>
                    <span className="text-muted-foreground">{t.share}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted">
                    <div className="h-1.5 rounded-full bg-teal-600/80" style={{ width: `${t.share}%` }} />
                  </div>
                </div>
              ))}
            </DmCard>
          )}

          {strategy ? (
            <DmCard className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold">AI strategic summary</p>
                {strategy.reportId ? (
                  <Button asChild size="sm" variant="outline" className="h-7 text-[10px]">
                    <a
                      href={`/api/digital-ministry/competitors/report/${strategy.reportId}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Download className="mr-1 size-3" />
                      PDF report
                    </a>
                  </Button>
                ) : null}
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{strategy.executiveSummary}</p>
              {strategy.contentGapMatrix ? (
                <ContentGapMatrixView matrix={strategy.contentGapMatrix} compact />
              ) : null}
              {strategy.contentGaps.slice(0, 4).map((g) => (
                <div key={g.title} className="rounded-lg border border-border/80 p-2.5 text-xs">
                  <p className="font-semibold">
                    {g.priority === 'high' ? '🔴' : g.priority === 'medium' ? '🟠' : '🟢'} {g.title}
                  </p>
                  <p className="mt-1 text-muted-foreground">{g.recommendation}</p>
                </div>
              ))}
            </DmCard>
          ) : (
            <DmCard className="border-dashed p-5 text-center text-xs text-muted-foreground">
              Run <span className="font-medium text-foreground">AI strategy</span> after capturing peers for gaps and
              recommendations.
            </DmCard>
          )}

          <DmCard className="space-y-2 p-5 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Ethical sourcing</p>
            <p>Public websites, RSS, YouTube public pages, and profile metadata only.</p>
            <p>Never login scraping, private groups, or invented engagement metrics.</p>
          </DmCard>
        </aside>
      </div>
    </div>
  )
}
