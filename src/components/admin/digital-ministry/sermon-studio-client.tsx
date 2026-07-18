'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DmCard } from '@/components/admin/digital-ministry/dm-ui'
import {
  generateSermonPack,
  pushSermonPackToStudio,
  type SermonPack,
} from '@/lib/digital-ministry/sermon-studio'
import { Loader2 } from 'lucide-react'

export function SermonStudioClient({
  sermonId,
  sermonTitle,
  initialPack,
  segments,
}: {
  sermonId: string
  sermonTitle: string
  initialPack: SermonPack | null
  segments: Array<{
    id: string
    kind: string
    label: string | null
    transcript_excerpt: string | null
    start_seconds: number | null
    end_seconds: number | null
  }>
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [pack, setPack] = useState(initialPack)
  const [segs, setSegs] = useState(segments)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function onGenerate() {
    setError(null)
    setMessage(null)
    startTransition(async () => {
      const result = await generateSermonPack(sermonId)
      if ('error' in result) setError(result.error)
      else {
        setPack(result.pack)
        setSegs(
          (result.pack.segments ?? []).map((s, i) => ({
            id: `tmp-${i}`,
            kind: s.kind,
            label: s.label,
            transcript_excerpt: s.transcript_excerpt,
            start_seconds: s.start_seconds ?? null,
            end_seconds: s.end_seconds ?? null,
          }))
        )
        setMessage(`Pack ready · ${result.segmentCount} clips`)
        router.refresh()
      }
    })
  }

  function onPush() {
    setError(null)
    startTransition(async () => {
      const result = await pushSermonPackToStudio(sermonId)
      if ('error' in result) setError(result.error)
      else {
        setMessage(`Created ${result.created} Studio drafts`)
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button onClick={onGenerate} disabled={pending}>
          {pending ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : null}
          Generate pack + clips
        </Button>
        <Button variant="secondary" onClick={onPush} disabled={pending || !pack}>
          Push to Content Studio
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/admin/sermons/${sermonId}`}>Edit in CMS</Link>
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      {segs.length > 0 ? (
        <DmCard className="p-4 sm:p-5">
          <h3 className="text-sm font-semibold">Clip segments · {sermonTitle}</h3>
          <ul className="mt-3 space-y-3">
            {segs.map((s) => (
              <li key={s.id} className="rounded-xl border border-border/60 px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase">
                    {s.kind}
                  </span>
                  <span className="text-sm font-medium">{s.label}</span>
                  {s.start_seconds != null ? (
                    <span className="text-[11px] text-muted-foreground">
                      {s.start_seconds}s–{s.end_seconds ?? '?'}s
                    </span>
                  ) : null}
                </div>
                {s.transcript_excerpt ? (
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {s.transcript_excerpt}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </DmCard>
      ) : null}

      {pack ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <DmCard className="p-4 sm:p-5">
            <p className="text-sm font-semibold">Summary</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pack.summary}</p>
            {pack.keyVerses?.length ? (
              <ul className="mt-3 space-y-1 text-xs">
                {pack.keyVerses.map((v) => (
                  <li key={v}>• {v}</li>
                ))}
              </ul>
            ) : null}
          </DmCard>
          <DmCard className="p-4 sm:p-5">
            <p className="text-sm font-semibold">Prayer & discussion</p>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {(pack.prayerPoints ?? []).map((p) => (
                <li key={p}>🙏 {p}</li>
              ))}
              {(pack.discussionQuestions ?? []).map((q) => (
                <li key={q}>❓ {q}</li>
              ))}
            </ul>
          </DmCard>
          {(
            [
              ['Tweets / X', pack.formats?.tweets],
              ['Facebook', pack.formats?.facebookPosts],
              ['Shorts ideas', pack.formats?.shortsIdeas],
              ['Reels', pack.formats?.reelsIdeas],
              ['TikTok scripts', pack.formats?.tiktokScripts],
            ] as const
          ).map(([label, items]) =>
            items?.length ? (
              <DmCard key={label} className="p-4 sm:p-5">
                <p className="text-sm font-semibold">{label}</p>
                <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
                  {items.map((t) => (
                    <li key={t.slice(0, 40)} className="rounded-lg bg-muted/40 px-2 py-1.5">
                      {t}
                    </li>
                  ))}
                </ul>
              </DmCard>
            ) : null
          )}
          {pack.formats?.newsletterBlurb ? (
            <DmCard className="p-4 sm:p-5 lg:col-span-2">
              <p className="text-sm font-semibold">Newsletter</p>
              <p className="mt-2 text-sm text-muted-foreground">{pack.formats.newsletterBlurb}</p>
            </DmCard>
          ) : null}
        </div>
      ) : (
        <DmCard className="p-6 text-sm text-muted-foreground">
          Generate a pack to extract clips and multi-format content from this sermon&apos;s notes.
        </DmCard>
      )}
    </div>
  )
}
