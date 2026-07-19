'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DmCard } from '@/components/admin/digital-ministry/dm-ui'
import { runSeoAudit } from '@/lib/digital-ministry/ops'
import { cn } from '@/lib/utils'
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Gauge,
  Loader2,
  Search,
  Sparkles,
} from 'lucide-react'

type Finding = { id?: string; severity?: string; message?: string }

type Audit = {
  id: string
  target_url: string
  score: number | null
  findings: unknown
  recommendations: unknown
  created_at: string
}

const QUICK_URLS = [
  { label: 'Home', url: 'https://kdcuganda.org' },
  { label: 'Sermons', url: 'https://kdcuganda.org/sermons' },
  { label: 'Events', url: 'https://kdcuganda.org/events' },
  { label: 'Give', url: 'https://kdcuganda.org/give' },
  { label: 'About', url: 'https://kdcuganda.org/about' },
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

function scoreColor(score: number | null) {
  if (score == null) return 'text-muted-foreground'
  if (score >= 80) return 'text-emerald-700'
  if (score >= 60) return 'text-amber-700'
  return 'text-destructive'
}

function scoreRing(score: number | null) {
  if (score == null) return 'border-border bg-muted/40'
  if (score >= 80) return 'border-emerald-200 bg-emerald-50'
  if (score >= 60) return 'border-amber-200 bg-amber-50'
  return 'border-red-200 bg-red-50'
}

function severityTone(severity?: string) {
  switch (severity) {
    case 'high':
      return 'border-red-200 bg-red-50 text-red-900'
    case 'medium':
      return 'border-amber-200 bg-amber-50 text-amber-900'
    case 'low':
      return 'border-sky-200 bg-sky-50 text-sky-900'
    default:
      return 'border-border bg-muted text-muted-foreground'
  }
}

function pathLabel(url: string) {
  try {
    const u = new URL(url)
    return u.pathname === '/' ? u.hostname.replace(/^www\./, '') : u.pathname
  } catch {
    return url
  }
}

export function SeoClient({ audits }: { audits: Audit[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [url, setUrl] = useState('https://kdcuganda.org')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(audits[0]?.id ?? null)

  const checklist = useMemo(
    () => [
      { label: 'Title tag', hint: 'Aim ~50–60 characters' },
      { label: 'Meta description', hint: 'Aim ~150–160 characters' },
      { label: 'Single H1', hint: 'One clear page heading' },
      { label: 'Canonical URL', hint: 'Avoid duplicate indexing' },
      { label: 'Open Graph', hint: 'Better social shares' },
    ],
    []
  )

  function runAudit(target = url) {
    setError(null)
    setMessage(null)
    startTransition(async () => {
      try {
        const r = await runSeoAudit(target)
        if ('error' in r) setError(r.error)
        else {
          setMessage(`Audit complete · score ${r.score}/100`)
          setExpandedId(r.id)
          router.refresh()
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Audit failed')
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
                <Search className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">Run page audit</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Fetches the live HTML and scores on-page SEO signals for KDC public pages.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Page URL
              </label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://kdcuganda.org/…"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') runAudit()
                }}
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {QUICK_URLS.map((q) => (
                <button
                  key={q.url}
                  type="button"
                  onClick={() => setUrl(q.url)}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors',
                    url === q.url
                      ? 'border-foreground/20 bg-foreground text-background'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  {q.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={pending || !url.trim()} onClick={() => runAudit()}>
                {pending ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <Gauge className="mr-1.5 size-3.5" />
                )}
                Audit URL
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href="/admin/seo-tools">Full SEO tools</Link>
              </Button>
            </div>
          </DmCard>

          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Audit history</h2>
              <p className="text-xs text-muted-foreground">Newest first · expand for findings & fixes</p>
            </div>
          </div>

          {audits.length === 0 ? (
            <DmCard className="flex flex-col items-center px-6 py-14 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
                <Search className="size-5 text-muted-foreground" />
              </div>
              <p className="mt-4 text-sm font-semibold">No audits yet</p>
              <p className="mt-1.5 max-w-sm text-xs text-muted-foreground">
                Start with the homepage, then sermons and give pages — the ones visitors search for most.
              </p>
              <Button size="sm" className="mt-5" disabled={pending} onClick={() => runAudit('https://kdcuganda.org')}>
                Audit homepage
              </Button>
            </DmCard>
          ) : (
            <ul className="space-y-3">
              {audits.map((a) => {
                const findings = Array.isArray(a.findings) ? (a.findings as Finding[]) : []
                const recommendations = Array.isArray(a.recommendations)
                  ? (a.recommendations as string[])
                  : []
                const open = expandedId === a.id
                const high = findings.filter((f) => f.severity === 'high').length
                const medium = findings.filter((f) => f.severity === 'medium').length

                return (
                  <li key={a.id}>
                    <DmCard className="overflow-hidden p-0">
                      <button
                        type="button"
                        className="flex w-full items-start gap-3 p-4 text-left sm:p-5"
                        onClick={() => setExpandedId(open ? null : a.id)}
                      >
                        <div
                          className={cn(
                            'flex size-14 shrink-0 flex-col items-center justify-center rounded-2xl border',
                            scoreRing(a.score)
                          )}
                        >
                          <span className={cn('text-lg font-semibold tabular-nums', scoreColor(a.score))}>
                            {a.score ?? '—'}
                          </span>
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                            /100
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold">{pathLabel(a.target_url)}</p>
                            {findings.length === 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-800">
                                <CheckCircle2 className="size-2.5" />
                                Clean
                              </span>
                            ) : (
                              <>
                                {high > 0 ? (
                                  <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-red-800">
                                    {high} high
                                  </span>
                                ) : null}
                                {medium > 0 ? (
                                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-800">
                                    {medium} medium
                                  </span>
                                ) : null}
                              </>
                            )}
                          </div>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">{a.target_url}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {relativeTime(a.created_at)} ·{' '}
                            {new Date(a.created_at).toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </p>
                        </div>
                      </button>

                      {open ? (
                        <div className="space-y-4 border-t border-border/60 bg-muted/20 px-4 py-4 sm:px-5">
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" asChild>
                              <a href={a.target_url} target="_blank" rel="noreferrer">
                                <ExternalLink className="mr-1.5 size-3.5" />
                                Open page
                              </a>
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={pending}
                              onClick={() => {
                                setUrl(a.target_url)
                                runAudit(a.target_url)
                              }}
                            >
                              Re-audit
                            </Button>
                          </div>

                          {findings.length ? (
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Findings
                              </p>
                              <ul className="mt-2 space-y-2">
                                {findings.map((f, i) => (
                                  <li
                                    key={f.id || i}
                                    className="flex flex-wrap items-start gap-2 text-xs leading-snug"
                                  >
                                    <span
                                      className={cn(
                                        'rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase',
                                        severityTone(f.severity)
                                      )}
                                    >
                                      {f.severity || 'info'}
                                    </span>
                                    <span className="min-w-0 flex-1 text-foreground/90">
                                      {f.message}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <p className="flex items-center gap-2 text-xs text-emerald-800">
                              <CheckCircle2 className="size-3.5" />
                              No rule findings on this pass.
                            </p>
                          )}

                          {recommendations.length ? (
                            <div>
                              <div className="flex items-center gap-1.5">
                                <Sparkles className="size-3.5 text-teal-800" />
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                  Recommendations
                                </p>
                              </div>
                              <ul className="mt-2 space-y-1.5">
                                {recommendations.slice(0, 8).map((r, i) => (
                                  <li key={i} className="flex gap-2 text-xs leading-snug text-foreground/90">
                                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-teal-700/70" />
                                    <span>{r}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
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
              <Gauge className="size-4 text-teal-800" />
              <p className="text-sm font-semibold">What we score</p>
            </div>
            <ul className="space-y-2.5">
              {checklist.map((item) => (
                <li key={item.label} className="flex gap-2.5 text-xs">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-teal-800/70" />
                  <span>
                    <span className="font-medium text-foreground">{item.label}</span>
                    <span className="mt-0.5 block text-muted-foreground">{item.hint}</span>
                  </span>
                </li>
              ))}
            </ul>
          </DmCard>

          <DmCard className="space-y-3 p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-teal-800" />
              <p className="text-sm font-semibold">Suggested cadence</p>
            </div>
            <ol className="list-decimal space-y-2 pl-4 text-xs leading-relaxed text-muted-foreground">
              <li>Audit home, sermons, and give monthly.</li>
              <li>Re-audit after major page or CMS content edits.</li>
              <li>Fix high severity first, then medium length issues.</li>
            </ol>
          </DmCard>

          <DmCard className="space-y-3 border-amber-200/80 bg-amber-50/40 p-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-900" />
              <p className="text-sm font-semibold text-amber-950">Note</p>
            </div>
            <p className="text-xs leading-relaxed text-amber-950/80">
              Scores reflect on-page HTML only — not Google rankings, backlinks, or Core Web Vitals.
              Use{' '}
              <Link href="/admin/seo-tools" className="font-medium underline underline-offset-2">
                SEO Tools
              </Link>{' '}
              for broader workflow.
            </p>
          </DmCard>
        </aside>
      </div>
    </div>
  )
}
