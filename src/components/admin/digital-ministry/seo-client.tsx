'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DmCard } from '@/components/admin/digital-ministry/dm-ui'
import { runSeoAudit } from '@/lib/digital-ministry/ops'
import { Loader2 } from 'lucide-react'

export function SeoClient({
  audits,
}: {
  audits: Array<{
    id: string
    target_url: string
    score: number | null
    findings: unknown
    recommendations: unknown
    created_at: string
  }>
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [url, setUrl] = useState('https://kdcuganda.org')
  const [error, setError] = useState<string | null>(null)
  const [lastScore, setLastScore] = useState<number | null>(null)

  return (
    <div className="space-y-6">
      <DmCard className="space-y-3 p-5">
        <p className="text-sm font-semibold">Run page audit</p>
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                setError(null)
                const r = await runSeoAudit(url)
                if ('error' in r) setError(r.error)
                else {
                  setLastScore(r.score)
                  router.refresh()
                }
              })
            }
          >
            {pending ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : null}
            Audit URL
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href="/admin/seo-tools">SEO Tools</Link>
          </Button>
        </div>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        {lastScore != null ? (
          <p className="text-sm text-emerald-700">Latest score: {lastScore}/100</p>
        ) : null}
      </DmCard>

      <div className="space-y-2">
        {audits.map((a) => (
          <DmCard key={a.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{a.target_url}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(a.created_at).toLocaleString()}
                </p>
              </div>
              <span className="tabular-nums text-lg font-semibold">{a.score ?? '—'}</span>
            </div>
            {Array.isArray(a.findings) && a.findings.length ? (
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {(a.findings as Array<{ message?: string }>).slice(0, 6).map((f, i) => (
                  <li key={i}>• {f.message}</li>
                ))}
              </ul>
            ) : null}
          </DmCard>
        ))}
      </div>
    </div>
  )
}
