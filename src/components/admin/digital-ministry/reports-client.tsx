'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DmCard } from '@/components/admin/digital-ministry/dm-ui'
import { generateDmReport } from '@/lib/digital-ministry/analytics'
import { Loader2 } from 'lucide-react'

export function ReportsClient({
  reports,
}: {
  reports: Array<{
    id: string
    period: string
    period_start: string
    period_end: string
    title: string
    summary: string | null
    created_at: string
  }>
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [csv, setCsv] = useState<{ title: string; csv: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  function run(period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly') {
    setError(null)
    startTransition(async () => {
      const result = await generateDmReport(period)
      if ('error' in result) setError(result.error)
      else {
        setCsv({ title: result.title, csv: result.csv })
        router.refresh()
      }
    })
  }

  function downloadCsv() {
    if (!csv) return
    const blob = new Blob([csv.csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${csv.title.replace(/\s+/g, '-').toLowerCase()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <DmCard className="p-5">
        <p className="text-sm font-semibold">Generate report</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] as const).map((p) => (
            <Button key={p} size="sm" variant="outline" disabled={pending} onClick={() => run(p)}>
              {pending ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : null}
              {p}
            </Button>
          ))}
        </div>
        {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
        {csv ? (
          <Button size="sm" className="mt-3" onClick={downloadCsv}>
            Download CSV
          </Button>
        ) : null}
      </DmCard>

      <div className="space-y-2">
        {reports.length === 0 ? (
          <DmCard className="p-8 text-center text-sm text-muted-foreground">
            No reports yet. Generate one to store it in <code>dm_reports</code>.
          </DmCard>
        ) : (
          reports.map((r) => (
            <DmCard key={r.id} className="p-4">
              <p className="font-semibold tracking-tight">{r.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {r.period} · {r.period_start} → {r.period_end} ·{' '}
                {new Date(r.created_at).toLocaleString()}
              </p>
              {r.summary ? (
                <p className="mt-2 text-sm text-muted-foreground">{r.summary}</p>
              ) : null}
            </DmCard>
          ))
        )}
      </div>
    </div>
  )
}
