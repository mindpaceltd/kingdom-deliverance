'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DmCard } from '@/components/admin/digital-ministry/dm-ui'
import { captureCompetitorIntelligence } from '@/lib/digital-ministry/competitors'
import { ContentGapMatrix as ContentGapMatrixView } from '@/components/admin/digital-ministry/content-gap-matrix'
import type { ContentGapMatrix } from '@/lib/digital-ministry/competitor-intelligence/types'
import { cn } from '@/lib/utils'
import { ArrowLeft, BarChart3, Loader2 } from 'lucide-react'

type Tab = 'overview' | 'content' | 'topics' | 'analysis'

export function CompetitorDetailClient({
  competitor,
  content,
  sources,
  latestRun,
  topics,
  gapMatrix,
}: {
  competitor: {
    id: string
    name: string
    website_url: string | null
    country: string | null
    organization_type: string | null
    last_captured_at: string | null
  }
  content: Array<{
    id: string
    platform: string
    title: string | null
    topic: string | null
    url: string | null
    content_type: string | null
    published_at: string | null
  }>
  sources: Array<{ platform: string; discovery_status: string; profile_url: string | null }>
  latestRun: {
    content_count: number
    video_count: number
    website_posts: number
    activity_score: number | null
    ai_analysis: Record<string, unknown>
    data_limitations: string[]
    steps: Array<{ label: string; status: string; message: string }>
  } | null
  topics: Array<{ topic: string; count: number; share: number }>
  gapMatrix: ContentGapMatrix
}) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const ai = (latestRun?.ai_analysis ?? {}) as {
    insight?: string
    topPerformingThemes?: Array<{ theme: string; reason: string }>
    strengths?: string[]
    weaknesses?: string[]
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'content', label: 'Content' },
    { id: 'topics', label: 'Topics' },
    { id: 'analysis', label: 'AI Analysis' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild size="sm" variant="ghost">
          <Link href="/admin/digital-ministry/competitors">
            <ArrowLeft className="mr-1.5 size-3.5" />
            Back
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">{competitor.name}</h2>
          {competitor.website_url ? (
            <a
              href={competitor.website_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-teal-800 hover:underline"
            >
              {competitor.website_url}
            </a>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Last captured:{' '}
            {competitor.last_captured_at
              ? new Date(competitor.last_captured_at).toLocaleString()
              : 'Never'}
          </p>
        </div>
        <Button
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null)
              const r = await captureCompetitorIntelligence(competitor.id)
              if ('error' in r && r.error) setError(r.error)
              else router.refresh()
            })
          }
        >
          {pending ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : <BarChart3 className="mr-1.5 size-3.5" />}
          Capture
        </Button>
      </div>

      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium',
              tab === t.id ? 'bg-teal-900 text-white' : 'text-muted-foreground hover:bg-muted'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <DmCard className="p-4">
            <p className="text-[11px] uppercase text-muted-foreground">Content captured</p>
            <p className="mt-1 text-2xl font-semibold">{latestRun?.content_count ?? 0}</p>
          </DmCard>
          <DmCard className="p-4">
            <p className="text-[11px] uppercase text-muted-foreground">Videos</p>
            <p className="mt-1 text-2xl font-semibold">{latestRun?.video_count ?? 0}</p>
          </DmCard>
          <DmCard className="p-4">
            <p className="text-[11px] uppercase text-muted-foreground">Website / RSS</p>
            <p className="mt-1 text-2xl font-semibold">{latestRun?.website_posts ?? 0}</p>
          </DmCard>
          <DmCard className="p-4">
            <p className="text-[11px] uppercase text-muted-foreground">Posting freq.</p>
            <p className="mt-1 text-2xl font-semibold">
              {latestRun?.activity_score != null ? `${latestRun.activity_score}/day` : '—'}
            </p>
          </DmCard>
        </div>
      )}

      {tab === 'content' && (
        <DmCard className="divide-y divide-border">
          {content.length ? (
            content.slice(0, 50).map((row) => (
              <div key={row.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{row.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {row.platform} · {row.topic ?? 'General'} · {row.content_type}
                  </p>
                </div>
                {row.url ? (
                  <a href={row.url} target="_blank" rel="noreferrer" className="text-xs text-teal-800 shrink-0">
                    Open
                  </a>
                ) : null}
              </div>
            ))
          ) : (
            <p className="p-8 text-center text-sm text-muted-foreground">No content captured yet — run Capture.</p>
          )}
        </DmCard>
      )}

      {tab === 'topics' && (
        <div className="space-y-4">
          <DmCard className="p-5">
            <p className="mb-4 text-sm font-semibold">KDC vs {competitor.name}</p>
            <ContentGapMatrixView matrix={gapMatrix} compact />
          </DmCard>
          <DmCard className="p-5">
            <p className="mb-3 text-sm font-semibold">Peer topic breakdown</p>
            <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-muted-foreground">
                <th className="pb-2">Topic</th>
                <th className="pb-2 text-right">Content</th>
                <th className="pb-2 text-right">Share</th>
              </tr>
            </thead>
            <tbody>
              {topics.map((t) => (
                <tr key={t.topic} className="border-t border-border/60">
                  <td className="py-2">{t.topic}</td>
                  <td className="py-2 text-right tabular-nums">{t.count}</td>
                  <td className="py-2 text-right tabular-nums">{t.share}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          </DmCard>
        </div>
      )}

      {tab === 'analysis' && (
        <div className="space-y-4">
          {ai.insight ? (
            <DmCard className="p-5">
              <p className="text-sm font-semibold">AI insight</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{ai.insight}</p>
            </DmCard>
          ) : null}
          {ai.topPerformingThemes?.length ? (
            <DmCard className="space-y-2 p-5">
              <p className="text-sm font-semibold">Top themes (from captured titles)</p>
              {ai.topPerformingThemes.map((t) => (
                <div key={t.theme} className="text-xs">
                  <span className="font-semibold">{t.theme}</span> — {t.reason}
                </div>
              ))}
            </DmCard>
          ) : null}
          <DmCard className="p-5">
            <p className="text-sm font-semibold">Sources</p>
            <ul className="mt-2 space-y-1 text-xs">
              {sources.map((s) => (
                <li key={`${s.platform}-${s.profile_url}`}>
                  {s.platform}: {s.discovery_status}
                </li>
              ))}
            </ul>
          </DmCard>
          {(latestRun?.data_limitations?.length ?? 0) > 0 && (
            <DmCard className="border-amber-200/80 bg-amber-50/40 p-5 text-xs text-amber-950">
              <p className="font-semibold">Unavailable data (not fabricated)</p>
              <ul className="mt-2 list-disc pl-4">
                {latestRun!.data_limitations.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </DmCard>
          )}
        </div>
      )}
    </div>
  )
}
