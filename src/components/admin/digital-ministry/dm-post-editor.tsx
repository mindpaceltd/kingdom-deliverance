'use client'

import dynamic from 'next/dynamic'
import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DmCard } from '@/components/admin/digital-ministry/dm-ui'
import {
  archiveDmPost,
  markPublicationManualDone,
  publishDmPostNow,
  rewriteDmPostWithAi,
  scheduleDmPost,
  updateDmPost,
} from '@/lib/digital-ministry/posts'
import {
  DM_AI_TONES,
  DM_STUDIO_PLATFORMS,
  type DmAiTone,
  type DmPost,
  type DmPostPublication,
} from '@/lib/digital-ministry/types'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const RichTextEditor = dynamic(
  () => import('@/components/admin/rich-text-editor').then((m) => m.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[240px] animate-pulse rounded-lg border border-border bg-muted/30" />
    ),
  }
)

function toLocalInputValue(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function plainTextLength(html: string) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim().length
}

/** AI / plain drafts → simple HTML for TipTap */
function ensureHtml(content: string) {
  const trimmed = content.trim()
  if (!trimmed) return ''
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return trimmed
  return trimmed
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, '<br>')}</p>`)
    .join('')
}

export function DmPostEditor({
  post,
  publications: initialPubs,
}: {
  post: DmPost
  publications: DmPostPublication[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [title, setTitle] = useState(post.title ?? '')
  const [body, setBody] = useState(() => ensureHtml(post.body ?? ''))
  const [platforms, setPlatforms] = useState<string[]>(post.platforms ?? [])
  const [tone, setTone] = useState<DmAiTone>((post.ai_tone as DmAiTone) || 'evangelism')
  const [scheduleAt, setScheduleAt] = useState(toLocalInputValue(post.scheduled_at))
  const [pubs, setPubs] = useState(initialPubs)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const charCount = useMemo(() => plainTextLength(body), [body])

  function togglePlatform(id: string) {
    setPlatforms((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

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

  function onSave() {
    run(async () => {
      const result = await updateDmPost(post.id, {
        title,
        body,
        bodyMarkdown: body,
        platforms,
        aiTone: tone,
        scheduledAt: scheduleAt ? new Date(scheduleAt).toISOString() : null,
      })
      if (result.error) setError(result.error)
      else {
        setMessage('Saved')
        router.refresh()
      }
    })
  }

  function onSchedule() {
    if (!scheduleAt) {
      setError('Pick a schedule date and time')
      return
    }
    run(async () => {
      await updateDmPost(post.id, { title, body, bodyMarkdown: body, platforms, aiTone: tone })
      const result = await scheduleDmPost(post.id, new Date(scheduleAt).toISOString())
      if (result.error) setError(result.error)
      else {
        setMessage('Scheduled — appears on Content Calendar')
        router.refresh()
      }
    })
  }

  function onPublish() {
    run(async () => {
      await updateDmPost(post.id, { title, body, bodyMarkdown: body, platforms, aiTone: tone })
      const result = await publishDmPostNow(post.id)
      if (result.error) setError(result.error)
      else {
        setMessage(
          result.status === 'published'
            ? 'Publish finished — check per-platform status (manual where APIs require it).'
            : `Publish ended with status: ${result.status}`
        )
        router.refresh()
      }
    })
  }

  function onRewrite() {
    run(async () => {
      const result = await rewriteDmPostWithAi({
        title,
        body: body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
        tone,
        platforms,
      })
      if ('error' in result) setError(result.error)
      else {
        setTitle(result.title)
        setBody(ensureHtml(result.body))
        setMessage('AI rewrite applied — review and save')
      }
    })
  }

  function onArchive() {
    run(async () => {
      const result = await archiveDmPost(post.id)
      if (result.error) setError(result.error)
      else router.push('/admin/digital-ministry/studio')
    })
  }

  function onMarkDone(pubId: string) {
    run(async () => {
      const result = await markPublicationManualDone(pubId)
      if (result.error) setError(result.error)
      else {
        setPubs((prev) =>
          prev.map((p) => (p.id === pubId ? { ...p, status: 'published' as const } : p))
        )
        setMessage('Marked as published')
        router.refresh()
      }
    })
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <DmCard className="space-y-4 p-4 sm:p-5">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Title
            </label>
            <Input
              className="mt-1.5"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Hook or post title"
            />
          </div>
          <div>
            <div className="flex items-center justify-between gap-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Body
              </label>
              <span className="text-[11px] tabular-nums text-muted-foreground">
                {charCount} chars
              </span>
            </div>
            <div className="mt-1.5 overflow-hidden rounded-lg border border-border">
              <RichTextEditor
                value={body}
                onChange={setBody}
                placeholder="Write your social post, caption, or newsletter blurb…"
                disabled={pending}
                compact
                editorMinHeight="min-h-[240px]"
              />
            </div>
          </div>
          {(message || error) && (
            <p className={cn('text-sm', error ? 'text-destructive' : 'text-emerald-700')}>
              {error ?? message}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={onSave} disabled={pending}>
              {pending ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : null}
              Save draft
            </Button>
            <Button size="sm" variant="secondary" onClick={onSchedule} disabled={pending}>
              Schedule
            </Button>
            <Button size="sm" variant="default" onClick={onPublish} disabled={pending}>
              Publish now
            </Button>
            <Button size="sm" variant="outline" onClick={onRewrite} disabled={pending}>
              AI rewrite
            </Button>
            <Button size="sm" variant="ghost" onClick={onArchive} disabled={pending}>
              Archive
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <Link href="/admin/digital-ministry/studio">Back</Link>
            </Button>
          </div>
        </DmCard>

        {pubs.length > 0 ? (
          <DmCard className="p-4 sm:p-5">
            <h3 className="text-sm font-semibold">Per-platform publications</h3>
            <ul className="mt-3 space-y-3">
              {pubs.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-col gap-2 rounded-xl border border-border/60 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium capitalize">{p.platform}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.status.replace(/_/g, ' ')}
                      {p.error_message ? ` — ${p.error_message}` : ''}
                    </p>
                    {p.external_url ? (
                      <a
                        href={p.external_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs underline underline-offset-2"
                      >
                        View live
                      </a>
                    ) : null}
                  </div>
                  {p.status === 'manual_required' || p.status === 'failed' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => onMarkDone(p.id)}
                    >
                      Mark published
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          </DmCard>
        ) : null}
      </div>

      <aside className="space-y-4">
        <DmCard className="p-4 sm:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Status
          </p>
          <p className="mt-1 text-sm font-medium capitalize">{post.status}</p>
          {post.scheduled_at ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Scheduled: {new Date(post.scheduled_at).toLocaleString()}
            </p>
          ) : null}
        </DmCard>

        <DmCard className="p-4 sm:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Platforms
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {DM_STUDIO_PLATFORMS.map((p) => {
              const on = platforms.includes(p.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePlatform(p.id)}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-xs transition-colors',
                    on
                      ? 'border-foreground/30 bg-foreground text-background'
                      : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'
                  )}
                >
                  {p.label}
                </button>
              )
            })}
          </div>
        </DmCard>

        <DmCard className="p-4 sm:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            AI tone
          </p>
          <select
            className="mt-2 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm"
            value={tone}
            onChange={(e) => setTone(e.target.value as DmAiTone)}
          >
            {DM_AI_TONES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-muted-foreground">
            Uses Gemini (`GEMINI_API_KEY`) and logs to <code>dm_ai_generations</code>.
          </p>
        </DmCard>

        <DmCard className="p-4 sm:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Schedule
          </p>
          <Input
            type="datetime-local"
            className="mt-2"
            value={scheduleAt}
            onChange={(e) => setScheduleAt(e.target.value)}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Creates a calendar entry when you Schedule.
          </p>
        </DmCard>

        <DmCard className="p-4 text-xs text-muted-foreground">
          Rich text is saved as HTML. Facebook auto-posts as plain text. Instagram needs media
          (manual for text). X / LinkedIn / YouTube captions stay manual with Mark published.
        </DmCard>
      </aside>
    </div>
  )
}
