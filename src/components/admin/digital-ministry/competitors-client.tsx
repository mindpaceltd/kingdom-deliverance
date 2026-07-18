'use client'

import { useState, useTransition } from 'react'
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
import { Loader2 } from 'lucide-react'

type Comp = {
  id: string
  name: string
  website_url: string | null
  notes: string | null
  platforms: Record<string, string> | null
}

export function CompetitorsClient({
  competitors,
  latestById,
}: {
  competitors: Comp[]
  latestById: Record<string, { titles: string[]; captured_at: string; platform: string }>
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [website, setWebsite] = useState('')
  const [rss, setRss] = useState('')
  const [notes, setNotes] = useState('')
  const [compare, setCompare] = useState<{
    theyDoBetter: string[]
    kdcDoesBetter: string[]
    opportunities: string[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  function add() {
    setError(null)
    if (!name.trim()) {
      setError('Name required')
      return
    }
    startTransition(async () => {
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
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-6">
      <DmCard className="space-y-3 p-5">
        <p className="text-sm font-semibold">Add competitor (public RSS / website only)</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input placeholder="Name (e.g. Watoto Church)" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Website URL" value={website} onChange={(e) => setWebsite(e.target.value)} />
          <Input
            placeholder="Optional RSS/Atom feed URL"
            value={rss}
            onChange={(e) => setRss(e.target.value)}
            className="sm:col-span-2"
          />
          <Textarea
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="sm:col-span-2 min-h-[80px]"
          />
        </div>
        <Button size="sm" onClick={add} disabled={pending}>
          {pending ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : null}
          Save competitor
        </Button>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </DmCard>

      <div className="space-y-3">
        {competitors.map((c) => {
          const snap = latestById[c.id]
          return (
            <DmCard key={c.id} className="p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold">{c.name}</p>
                  {c.website_url ? (
                    <a
                      href={c.website_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs underline underline-offset-2"
                    >
                      {c.website_url}
                    </a>
                  ) : null}
                  {snap ? (
                    <div className="mt-2">
                      <p className="text-[11px] text-muted-foreground">
                        Last snapshot · {snap.platform} · {new Date(snap.captured_at).toLocaleString()}
                      </p>
                      <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                        {snap.titles.slice(0, 5).map((t) => (
                          <li key={t}>• {t}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">No snapshot yet</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const r = await captureCompetitorSnapshot(c.id)
                        if (r.error) setError(r.error)
                        else router.refresh()
                      })
                    }
                  >
                    Capture
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await deleteCompetitor(c.id)
                        router.refresh()
                      })
                    }
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </DmCard>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={pending || !competitors.length}
          onClick={() =>
            startTransition(async () => {
              const r = await compareCompetitorsWithAi()
              if ('error' in r) setError(r.error)
              else if ('data' in r) setCompare(r.data)
            })
          }
        >
          AI comparison
        </Button>
      </div>

      {compare ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {(
            [
              ['They do better', compare.theyDoBetter],
              ['KDC does better', compare.kdcDoesBetter],
              ['Opportunities', compare.opportunities],
            ] as const
          ).map(([label, items]) => (
            <DmCard key={label} className="p-4">
              <p className="text-sm font-semibold">{label}</p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {(items ?? []).map((i) => (
                  <li key={i}>• {i}</li>
                ))}
              </ul>
            </DmCard>
          ))}
        </div>
      ) : null}
    </div>
  )
}
