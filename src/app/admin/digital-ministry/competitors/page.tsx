import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DmKpiCard, DmPageHeader } from '@/components/admin/digital-ministry/dm-ui'
import { CompetitorsClient } from '@/components/admin/digital-ministry/competitors-client'
import { listCompetitors, listCompetitorSnapshots } from '@/lib/digital-ministry/competitors'

export default async function CompetitorsPage() {
  const competitors = await listCompetitors()
  const latestById: Record<
    string,
    { titles: string[]; captured_at: string; platform: string; excerpt?: string }
  > = {}

  let withSnapshots = 0
  let latestCaptureMs = 0

  for (const c of competitors) {
    const snaps = await listCompetitorSnapshots(c.id, 1)
    const s = snaps[0]
    if (!s) continue
    withSnapshots += 1
    const captured = new Date(s.captured_at).getTime()
    if (captured > latestCaptureMs) latestCaptureMs = captured

    const titles = Array.isArray(s.top_content)
      ? (s.top_content as Array<{ title?: string }>).map((t) => t.title || '').filter(Boolean)
      : []
    const excerpt =
      s.raw && typeof s.raw === 'object' && 'excerpt' in s.raw
        ? String((s.raw as { excerpt?: string }).excerpt || '')
        : ''

    latestById[c.id] = {
      titles,
      captured_at: s.captured_at,
      platform: s.platform,
      excerpt: excerpt || undefined,
    }
  }

  const lastCaptureHint = latestCaptureMs
    ? new Date(latestCaptureMs).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'No captures yet'
  const lastCaptureValue = latestCaptureMs
    ? (() => {
        const hrs = Math.floor((Date.now() - latestCaptureMs) / 3600000)
        if (hrs < 1) return '<1h'
        if (hrs < 48) return `${hrs}h`
        return `${Math.floor(hrs / 24)}d`
      })()
    : '—'

  return (
    <div className="space-y-6">
      <DmPageHeader
        title="Competitor Intelligence"
        description="Watch peer ministries from public RSS feeds and websites only — ethical signals for content strategy, never private scraping."
        actions={
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/digital-ministry">Dashboard</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <DmKpiCard label="Tracked peers" value={competitors.length} hint="Active watchlist" />
        <DmKpiCard
          label="With snapshots"
          value={withSnapshots}
          hint={
            competitors.length
              ? `${Math.round((withSnapshots / competitors.length) * 100)}% covered`
              : 'Capture public content'
          }
        />
        <DmKpiCard
          label="Needs capture"
          value={Math.max(0, competitors.length - withSnapshots)}
          hint="Missing latest signals"
        />
        <DmKpiCard label="Last capture" value={lastCaptureValue} hint={lastCaptureHint} />
      </div>

      <CompetitorsClient
        competitors={competitors.map((c) => ({
          id: c.id,
          name: c.name,
          website_url: c.website_url,
          notes: c.notes,
          platforms: (c.platforms ?? {}) as Record<string, string>,
        }))}
        latestById={latestById}
      />
    </div>
  )
}
