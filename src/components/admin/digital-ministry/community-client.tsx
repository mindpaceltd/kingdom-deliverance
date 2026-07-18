'use client'

import { useState, useTransition } from 'react'
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
import { Loader2 } from 'lucide-react'

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

export function CommunityClient({ comments }: { comments: Comment[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [manualBody, setManualBody] = useState('')
  const [manualAuthor, setManualAuthor] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() =>
            startTransition(async () => {
              setError(null)
              const r = await syncWebsiteCommunityInbox()
              if ('error' in r) setError(r.error)
              else router.refresh()
            })
          }
          disabled={pending}
        >
          {pending ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : null}
          Sync website inbox
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <DmCard className="space-y-3 p-4">
        <p className="text-sm font-semibold">Add manual comment</p>
        <Input
          placeholder="Author"
          value={manualAuthor}
          onChange={(e) => setManualAuthor(e.target.value)}
        />
        <Textarea
          placeholder="Comment body"
          value={manualBody}
          onChange={(e) => setManualBody(e.target.value)}
        />
        <Button
          size="sm"
          variant="secondary"
          disabled={pending || !manualBody.trim()}
          onClick={() =>
            startTransition(async () => {
              const r = await addManualComment({
                platform: 'manual',
                authorName: manualAuthor,
                body: manualBody,
              })
              if (r.error) setError(r.error)
              else {
                setManualBody('')
                router.refresh()
              }
            })
          }
        >
          Add
        </Button>
      </DmCard>

      <div className="space-y-3">
        {comments.length === 0 ? (
          <DmCard className="p-8 text-center text-sm text-muted-foreground">
            Inbox empty. Sync website contact/prayer queues or add a manual item.
          </DmCard>
        ) : (
          comments.map((c) => (
            <DmCard key={c.id} className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase">
                  {c.platform}
                </span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                    c.status === 'new' ? 'bg-amber-50 text-amber-800' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {c.status}
                </span>
                {c.category ? (
                  <span className="text-[10px] uppercase text-muted-foreground">{c.category}</span>
                ) : null}
                {c.sentiment ? (
                  <span className="text-[10px] uppercase text-muted-foreground">{c.sentiment}</span>
                ) : null}
              </div>
              <p className="mt-2 text-sm font-medium">{c.author_name || 'Anonymous'}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{c.body}</p>

              {(drafts[c.id] || c.ai_draft_reply) && (
                <div className="mt-3 rounded-xl border bg-muted/30 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    AI draft reply
                  </p>
                  <Textarea
                    className="mt-1.5 min-h-[80px]"
                    value={drafts[c.id] ?? c.ai_draft_reply ?? ''}
                    onChange={(e) => setDrafts((d) => ({ ...d, [c.id]: e.target.value }))}
                  />
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const r = await draftCommentReply(c.id)
                      if ('error' in r) setError(r.error)
                      else {
                        if (r.draft) setDrafts((d) => ({ ...d, [c.id]: r.draft }))
                        router.refresh()
                      }
                    })
                  }
                >
                  Draft AI reply
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await updateCommentStatus(
                        c.id,
                        'approved',
                        drafts[c.id] ?? c.ai_draft_reply ?? undefined
                      )
                      router.refresh()
                    })
                  }
                >
                  Approve draft
                </Button>
                <Button
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await updateCommentStatus(c.id, 'replied')
                      router.refresh()
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
                    startTransition(async () => {
                      await updateCommentStatus(c.id, 'ignored')
                      router.refresh()
                    })
                  }
                >
                  Ignore
                </Button>
              </div>
            </DmCard>
          ))
        )}
      </div>
    </div>
  )
}
