'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { DmCard } from '@/components/admin/digital-ministry/dm-ui'
import {
  addManualComment,
  draftCommentReply,
  syncWebsiteCommunityInbox,
  updateCommentStatus,
} from '@/lib/digital-ministry/community'
import { cn } from '@/lib/utils'
import {
  CheckCircle2,
  HeartHandshake,
  Inbox,
  Loader2,
  MessageSquarePlus,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  UserRound,
} from 'lucide-react'

type Comment = {
  id: string
  platform: string
  author_name: string | null
  body: string
  category: string | null
  sentiment: string | null
  status: string
  ai_draft_reply: string | null
  created_at: string
}

type FilterKey =
  | 'all'
  | 'new'
  | 'drafted'
  | 'prayer'
  | 'question'
  | 'approved'
  | 'replied'
  | 'ignored'

const FILTERS: { id: FilterKey; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'drafted', label: 'Drafted' },
  { id: 'prayer', label: 'Prayer' },
  { id: 'question', label: 'Questions' },
  { id: 'approved', label: 'Approved' },
  { id: 'replied', label: 'Replied' },
  { id: 'ignored', label: 'Ignored' },
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

function initials(name: string | null) {
  if (!name?.trim()) return '?'
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

function statusTone(status: string) {
  switch (status) {
    case 'new':
      return 'border-amber-200 bg-amber-50 text-amber-900'
    case 'drafted':
      return 'border-teal-200 bg-teal-50 text-teal-900'
    case 'approved':
      return 'border-sky-200 bg-sky-50 text-sky-900'
    case 'replied':
      return 'border-emerald-200 bg-emerald-50 text-emerald-900'
    case 'ignored':
      return 'border-border bg-muted text-muted-foreground'
    default:
      return 'border-border bg-muted text-muted-foreground'
  }
}

function categoryTone(category: string | null) {
  if (category === 'prayer') return 'border-rose-200 bg-rose-50 text-rose-900'
  if (category === 'question') return 'border-violet-200 bg-violet-50 text-violet-900'
  return 'border-border bg-muted/60 text-muted-foreground'
}

function sentimentLabel(sentiment: string | null) {
  if (!sentiment) return null
  if (sentiment === 'urgent') return 'Urgent'
  return sentiment
}

export function CommunityClient({ comments }: { comments: Comment[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [filter, setFilter] = useState<FilterKey>('all')
  const [manualBody, setManualBody] = useState('')
  const [manualAuthor, setManualAuthor] = useState('')
  const [showManual, setShowManual] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [draftingId, setDraftingId] = useState<string | null>(null)

  const counts = useMemo(() => {
    const base: Record<FilterKey, number> = {
      all: comments.length,
      new: 0,
      drafted: 0,
      prayer: 0,
      question: 0,
      approved: 0,
      replied: 0,
      ignored: 0,
    }
    for (const c of comments) {
      if (c.status in base) base[c.status as FilterKey] += 1
      if (c.category === 'prayer') base.prayer += 1
      if (c.category === 'question') base.question += 1
    }
    return base
  }, [comments])

  const visible = useMemo(() => {
    return comments.filter((c) => {
      if (filter === 'all') return true
      if (filter === 'prayer' || filter === 'question') return c.category === filter
      return c.status === filter
    })
  }, [comments, filter])

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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Inbox</h2>
              <p className="text-xs text-muted-foreground">
                Review, draft pastorally, approve — then mark replied when sent.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() =>
                  run(async () => {
                    const r = await syncWebsiteCommunityInbox()
                    if ('error' in r && r.error) setError(r.error)
                    else {
                      setMessage(
                        `Synced website inbox${
                          'imported' in r ? ` · ${r.imported} new` : ''
                        }`
                      )
                      router.refresh()
                    }
                  })
                }
              >
                {pending ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="mr-1.5 size-3.5" />
                )}
                Sync website
              </Button>
              <Button
                size="sm"
                variant={showManual ? 'secondary' : 'default'}
                onClick={() => setShowManual((v) => !v)}
              >
                <MessageSquarePlus className="mr-1.5 size-3.5" />
                {showManual ? 'Hide form' : 'Add note'}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => {
              const selected = filter === f.id
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors',
                    selected
                      ? 'border-foreground/20 bg-foreground text-background'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  {f.label}
                  <span
                    className={cn(
                      'tabular-nums',
                      selected ? 'text-background/70' : 'text-muted-foreground/80'
                    )}
                  >
                    {counts[f.id]}
                  </span>
                </button>
              )
            })}
          </div>

          {showManual ? (
            <DmCard className="space-y-3 p-5">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <MessageSquarePlus className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Manual inbox note</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Capture a phone call, WhatsApp, or in-person request so it stays in the queue.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[200px_1fr]">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Author
                  </label>
                  <Input
                    placeholder="Name"
                    value={manualAuthor}
                    onChange={(e) => setManualAuthor(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Message
                  </label>
                  <Textarea
                    placeholder="What did they ask or share?"
                    value={manualBody}
                    onChange={(e) => setManualBody(e.target.value)}
                    className="min-h-[88px]"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={pending || !manualBody.trim()}
                  onClick={() =>
                    run(async () => {
                      const r = await addManualComment({
                        platform: 'manual',
                        authorName: manualAuthor,
                        body: manualBody,
                      })
                      if (r.error) setError(r.error)
                      else {
                        setManualBody('')
                        setManualAuthor('')
                        setShowManual(false)
                        setMessage('Note added to inbox')
                        setFilter('new')
                        router.refresh()
                      }
                    })
                  }
                >
                  {pending ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : null}
                  Add to inbox
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowManual(false)}>
                  Cancel
                </Button>
              </div>
            </DmCard>
          ) : null}

          {visible.length === 0 ? (
            <DmCard className="flex flex-col items-center px-6 py-14 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
                <Inbox className="size-5 text-muted-foreground" />
              </div>
              <p className="mt-4 text-sm font-semibold">
                {comments.length === 0 ? 'Inbox is clear' : 'Nothing in this filter'}
              </p>
              <p className="mt-1.5 max-w-sm text-xs text-muted-foreground">
                {comments.length === 0
                  ? 'Sync website contact and prayer queues, or add a manual note from a call or WhatsApp.'
                  : 'Try another filter, or sync the website for new submissions.'}
              </p>
              {comments.length === 0 ? (
                <Button
                  size="sm"
                  className="mt-5"
                  disabled={pending}
                  onClick={() =>
                    run(async () => {
                      const r = await syncWebsiteCommunityInbox()
                      if ('error' in r && r.error) setError(r.error)
                      else {
                        setMessage(
                          `Synced${'imported' in r ? ` · ${r.imported} new` : ''}`
                        )
                        router.refresh()
                      }
                    })
                  }
                >
                  <RefreshCw className="mr-1.5 size-3.5" />
                  Sync website inbox
                </Button>
              ) : (
                <Button size="sm" className="mt-5" variant="outline" onClick={() => setFilter('all')}>
                  Show all
                </Button>
              )}
            </DmCard>
          ) : (
            <ul className="space-y-3">
              {visible.map((c) => {
                const draft = drafts[c.id] ?? c.ai_draft_reply ?? ''
                const hasDraft = Boolean(draft.trim())
                const isDrafting = draftingId === c.id && pending

                return (
                  <li key={c.id}>
                    <DmCard className="overflow-hidden p-0">
                      <div className="space-y-3 p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 gap-3">
                            <div
                              className={cn(
                                'flex size-10 shrink-0 items-center justify-center rounded-2xl text-xs font-semibold text-white',
                                c.category === 'prayer'
                                  ? 'bg-gradient-to-br from-rose-700 to-rose-900'
                                  : 'bg-gradient-to-br from-teal-700 to-teal-900'
                              )}
                              aria-hidden
                            >
                              {initials(c.author_name)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className={cn(
                                    'rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                                    statusTone(c.status)
                                  )}
                                >
                                  {c.status.replace(/_/g, ' ')}
                                </span>
                                <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                  {c.platform}
                                </span>
                                {c.category ? (
                                  <span
                                    className={cn(
                                      'rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                                      categoryTone(c.category)
                                    )}
                                  >
                                    {c.category}
                                  </span>
                                ) : null}
                                {sentimentLabel(c.sentiment) ? (
                                  <span
                                    className={cn(
                                      'rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                                      c.sentiment === 'urgent'
                                        ? 'border-orange-200 bg-orange-50 text-orange-900'
                                        : 'border-border bg-muted/50 text-muted-foreground'
                                    )}
                                  >
                                    {sentimentLabel(c.sentiment)}
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-1.5 truncate text-sm font-semibold">
                                {c.author_name || 'Anonymous'}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {relativeTime(c.created_at)} ·{' '}
                                {new Date(c.created_at).toLocaleString(undefined, {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })}
                              </p>
                            </div>
                          </div>
                        </div>

                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                          {c.body}
                        </p>

                        {hasDraft ? (
                          <div className="rounded-xl border border-teal-200/70 bg-teal-50/40 p-3">
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="size-3.5 text-teal-800" />
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-900/80">
                                AI draft reply · edit before approve
                              </p>
                            </div>
                            <Textarea
                              className="mt-2 min-h-[96px] border-teal-200/60 bg-white/80"
                              value={draft}
                              onChange={(e) =>
                                setDrafts((d) => ({ ...d, [c.id]: e.target.value }))
                              }
                            />
                          </div>
                        ) : null}

                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={pending}
                            onClick={() =>
                              run(async () => {
                                setDraftingId(c.id)
                                const r = await draftCommentReply(c.id)
                                setDraftingId(null)
                                if ('error' in r) setError(r.error)
                                else {
                                  if (r.draft) setDrafts((d) => ({ ...d, [c.id]: r.draft }))
                                  setMessage('Draft ready — review before approving')
                                  router.refresh()
                                }
                              })
                            }
                          >
                            {isDrafting ? (
                              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="mr-1.5 size-3.5" />
                            )}
                            {hasDraft ? 'Regenerate draft' : 'Draft AI reply'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={pending || !hasDraft}
                            onClick={() =>
                              run(async () => {
                                const r = await updateCommentStatus(
                                  c.id,
                                  'approved',
                                  drafts[c.id] ?? c.ai_draft_reply ?? undefined
                                )
                                if (r.error) setError(r.error)
                                else {
                                  setMessage('Draft approved — send via the channel, then mark replied')
                                  router.refresh()
                                }
                              })
                            }
                          >
                            <CheckCircle2 className="mr-1.5 size-3.5" />
                            Approve draft
                          </Button>
                          <Button
                            size="sm"
                            disabled={pending}
                            onClick={() =>
                              run(async () => {
                                const r = await updateCommentStatus(c.id, 'replied')
                                if (r.error) setError(r.error)
                                else {
                                  setMessage('Marked replied')
                                  router.refresh()
                                }
                              })
                            }
                          >
                            Mark replied
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={pending}
                            onClick={() =>
                              run(async () => {
                                const r = await updateCommentStatus(c.id, 'ignored')
                                if (r.error) setError(r.error)
                                else {
                                  setMessage('Moved to ignored')
                                  router.refresh()
                                }
                              })
                            }
                          >
                            Ignore
                          </Button>
                        </div>
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
              <HeartHandshake className="size-4 text-teal-800" />
              <p className="text-sm font-semibold">Pastoral care</p>
            </div>
            <ul className="space-y-2 text-xs leading-relaxed text-muted-foreground">
              <li className="flex gap-2">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/50" />
                Prayer items deserve a human touch — AI drafts are starting points only.
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/50" />
                Never auto-send replies; approve, then deliver on the real channel.
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/50" />
                Escalate urgent or crisis language to pastoral leadership immediately.
              </li>
            </ul>
          </DmCard>

          <DmCard className="space-y-3 p-5">
            <div className="flex items-center gap-2">
              <UserRound className="size-4 text-teal-800" />
              <p className="text-sm font-semibold">Suggested flow</p>
            </div>
            <ol className="list-decimal space-y-2 pl-4 text-xs leading-relaxed text-muted-foreground">
              <li>Sync website to pull contact + prayer submissions.</li>
              <li>Filter to New / Prayer and draft with AI.</li>
              <li>Edit tone, approve, send externally, then Mark replied.</li>
            </ol>
          </DmCard>

          <DmCard className="space-y-3 border-amber-200/80 bg-amber-50/40 p-5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-amber-900" />
              <p className="text-sm font-semibold text-amber-950">Privacy</p>
            </div>
            <p className="text-xs leading-relaxed text-amber-950/80">
              Treat names and messages as confidential pastoral data. Do not paste sensitive details into
              public social replies without consent.
            </p>
          </DmCard>
        </aside>
      </div>
    </div>
  )
}
