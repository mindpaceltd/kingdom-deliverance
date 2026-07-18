'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DmCard } from '@/components/admin/digital-ministry/dm-ui'
import {
  captureCompetitorSnapshot,
  compareCompetitorsWithAi,
  deleteCompetitor,
  upsertCompetitor,
} from '@/lib/digital-ministry/competitors'
import { cn } from '@/lib/utils'
import {
  ExternalLink,
  Loader2,
  Plus,
  Radio,
  RefreshCw,
  Sparkles,
  Trash2,
  Globe2,
  ShieldCheck,
  Lightbulb,
  TrendingUp,
  Award,
} from 'lucide-react'

type Comp = {
  id: string
  name: string
  website_url: string | null
  notes: string | null
  platforms: Record<string, string> | null
}

type Snapshot = {
  titles: string[]
  captured_at: string
  platform: string
  excerpt?: string
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

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

function hostname(url: string | null | undefined) {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0]
  }
}

export function CompetitorsClient({
  competitors,
  latestById,
}: {
  competitors: Comp[]
  latestById: Record<string, Snapshot>
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [website, setWebsite] = useState('')
  const [rss, setRss] = useState('')
  const [notes, setNotes] = useState('')
  const [showForm, setShowForm] = useState(competitors.length === 0)
  const [compare, setCompare] = useState<{
    theyDoBetter: string[]
    kdcDoesBetter: string[]
    opportunities: string[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [capturingId, setCapturingId] = useState<string | null>(null)

  const sorted = useMemo(
    () =>
      [...competitors].sort((a, b) => {
        const aT = latestById[a.id]?.captured_at ? new Date(latestById[a.id].captured_at).getTime() : 0
        const bT = latestById[b.id]?.captured_at ? new Date(latestById[b.id].captured_at).getTime() : 0
        if (aT !== bT) return bT - aT
        return a.name.localeCompare(b.name)
      }),
    [competitors, latestById]
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

  function add() {
    if (!name.trim()) {
      setError('Ministry name is required')
      return
    }
    run(async () => {
      const result = await upsertCompetitor({
        name,
        websiteUrl: website,
        notes,
        platforms: rss ? { rss } : {},
      })
      if (result.error) setError(result.error)
      else {
        setName('')
        setWebsite('')
        setRss('')
        setNotes('')
        setShowForm(false)
        setMessage('Peer added to watchlist')
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Watchlist</h2>
              <p className="text-xs text-muted-foreground">
                Public RSS and website headlines only — refresh when you want fresh signals.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={pending || !competitors.length}
                onClick={() =>
                  run(async () => {
                    const r = await compareCompetitorsWithAi()
                    if ('error' in r) setError(r.error)
                    else if ('data' in r) {
                      setCompare(r.data)
                      setMessage('AI comparison ready')
                    }
                  })
                }
              >
                {pending ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="mr-1.5 size-3.5" />
                )}
                AI comparison
              </Button>
              <Button size="sm" variant={showForm ? 'secondary' : 'default'} onClick={() => setShowForm((v) => !v)}>
                <Plus className="mr-1.5 size-3.5" />
                {showForm ? 'Hide form' : 'Add peer'}
              </Button>
            </div>
          </div>

          {showForm ? (
            <DmCard className="space-y-4 p-5">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <Plus className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Add peer ministry</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Prefer an RSS/Atom feed when available — cleaner titles than a homepage scrape.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Name
                  </label>
                  <Input
                    placeholder="e.g. Watoto Church"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Website
                  </label>
                  <Input
                    placeholder="https://…"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    RSS / Atom feed (optional)
                  </label>
                  <Input
                    placeholder="https://…/feed"
                    value={rss}
                    onChange={(e) => setRss(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Notes
                  </label>
                  <Textarea
                    placeholder="Why track them? Focus themes, strengths…"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[72px]"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={add} disabled={pending}>
                  {pending ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : null}
                  Save to watchlist
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </DmCard>
          ) : null}

          {sorted.length === 0 ? (
            <DmCard className="flex flex-col items-center px-6 py-14 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
                <Globe2 className="size-5 text-muted-foreground" />
              </div>
              <p className="mt-4 text-sm font-semibold">No peers on the watchlist yet</p>
              <p className="mt-1.5 max-w-sm text-xs text-muted-foreground">
                Add ministries you respect or compete with for attention online. We’ll pull public headlines
                so your team can learn patterns — not copy.
              </p>
              <Button size="sm" className="mt-5" onClick={() => setShowForm(true)}>
                <Plus className="mr-1.5 size-3.5" />
                Add first peer
              </Button>
            </DmCard>
          ) : (
            <ul className="space-y-3">
              {sorted.map((c) => {
                const snap = latestById[c.id]
                const feed = c.platforms?.rss || c.platforms?.feed
                const host = hostname(c.website_url)
                const isCapturing = capturingId === c.id && pending

                return (
                  <li key={c.id}>
                    <DmCard className="overflow-hidden p-0">
                      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                        <div className="flex min-w-0 gap-3">
                          <div
                            className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-700 to-teal-900 text-sm font-semibold text-white"
                            aria-hidden
                          >
                            {initials(c.name) || 'P'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate text-sm font-semibold">{c.name}</h3>
                              {feed ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-800">
                                  <Radio className="size-2.5" />
                                  RSS
                                </span>
                              ) : c.website_url ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                  <Globe2 className="size-2.5" />
                                  Website
                                </span>
                              ) : (
                                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                                  Needs URL
                                </span>
                              )}
                            </div>
                            {host || c.website_url ? (
                              <a
                                href={c.website_url || undefined}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                              >
                                {host || c.website_url}
                                <ExternalLink className="size-3 opacity-60" />
                              </a>
                            ) : null}
                            {c.notes ? (
                              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                                {c.notes}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={pending || (!c.website_url && !feed)}
                            onClick={() =>
                              run(async () => {
                                setCapturingId(c.id)
                                const r = await captureCompetitorSnapshot(c.id)
                                setCapturingId(null)
                                if (r.error) setError(r.error)
                                else {
                                  setMessage(
                                    `Captured ${'titles' in r ? r.titles : 0} public title${
                                      'titles' in r && r.titles === 1 ? '' : 's'
                                    } for ${c.name}`
                                  )
                                  router.refresh()
                                }
                              })
                            }
                          >
                            {isCapturing ? (
                              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="mr-1.5 size-3.5" />
                            )}
                            Capture
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-muted-foreground hover:text-destructive"
                            disabled={pending}
                            onClick={() => {
                              if (!window.confirm(`Remove ${c.name} from the watchlist?`)) return
                              run(async () => {
                                const r = await deleteCompetitor(c.id)
                                if (r.error) setError(r.error)
                                else {
                                  setMessage(`${c.name} removed`)
                                  router.refresh()
                                }
                              })
                            }}
                          >
                            <Trash2 className="mr-1.5 size-3.5" />
                            Remove
                          </Button>
                        </div>
                      </div>

                      <div className="border-t border-border/60 bg-muted/25 px-4 py-3 sm:px-5">
                        {snap ? (
                          <div className="space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Latest public themes
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {snap.platform} · {relativeTime(snap.captured_at)}
                              </p>
                            </div>
                            {snap.excerpt ? (
                              <p className="text-xs italic leading-relaxed text-muted-foreground">
                                “{snap.excerpt}”
                              </p>
                            ) : null}
                            {snap.titles.length ? (
                              <ul className="space-y-1.5">
                                {snap.titles.slice(0, 5).map((t) => (
                                  <li
                                    key={t}
                                    className="flex gap-2 text-xs leading-snug text-foreground/90"
                                  >
                                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-teal-700/70" />
                                    <span className="min-w-0">{t}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                Snapshot saved, but no titles were found.
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            No snapshot yet — click Capture to pull the latest public headlines.
                          </p>
                        )}
                      </div>
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
              <ShieldCheck className="size-4 text-teal-800" />
              <p className="text-sm font-semibold">Ethical sourcing</p>
            </div>
            <ul className="space-y-2 text-xs leading-relaxed text-muted-foreground">
              <li className="flex gap-2">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/50" />
                Only public RSS/Atom feeds and public website metadata.
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/50" />
                No login walls, private APIs, or follower scrapes.
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/50" />
                Use insights to inspire KDC’s voice — never to copy sermons or branding.
              </li>
            </ul>
          </DmCard>

          <DmCard className="space-y-3 p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-teal-800" />
              <p className="text-sm font-semibold">How to use this</p>
            </div>
            <ol className="list-decimal space-y-2 pl-4 text-xs leading-relaxed text-muted-foreground">
              <li>Add 3–8 peer ministries with an RSS feed when possible.</li>
              <li>Capture snapshots before planning weekly Content Studio posts.</li>
              <li>Run AI comparison to surface gaps and opportunities for KDC.</li>
            </ol>
          </DmCard>

          {compare ? (
            <div className="space-y-3">
              {(
                [
                  {
                    label: 'Peers lead on',
                    items: compare.theyDoBetter,
                    icon: TrendingUp,
                    tone: 'border-sky-200/80 bg-sky-50/50',
                  },
                  {
                    label: 'KDC strengths',
                    items: compare.kdcDoesBetter,
                    icon: Award,
                    tone: 'border-emerald-200/80 bg-emerald-50/50',
                  },
                  {
                    label: 'Opportunities',
                    items: compare.opportunities,
                    icon: Lightbulb,
                    tone: 'border-amber-200/80 bg-amber-50/50',
                  },
                ] as const
              ).map(({ label, items, icon: Icon, tone }) => (
                <DmCard key={label} className={cn('space-y-2.5 p-4', tone)}>
                  <div className="flex items-center gap-2">
                    <Icon className="size-3.5 text-foreground/70" />
                    <p className="text-xs font-semibold uppercase tracking-wider">{label}</p>
                  </div>
                  <ul className="space-y-1.5">
                    {(items ?? []).length ? (
                      (items ?? []).map((i) => (
                        <li key={i} className="flex gap-2 text-xs leading-snug text-foreground/90">
                          <span className="mt-1.5 size-1 shrink-0 rounded-full bg-foreground/40" />
                          <span>{i}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-muted-foreground">No items returned.</li>
                    )}
                  </ul>
                </DmCard>
              ))}
            </div>
          ) : (
            <DmCard className="border-dashed p-5 text-center">
              <p className="text-xs text-muted-foreground">
                Capture a few peers, then run <span className="font-medium text-foreground">AI comparison</span>{' '}
                for a strategy brief.
              </p>
            </DmCard>
          )}
        </aside>
      </div>
    </div>
  )
}
