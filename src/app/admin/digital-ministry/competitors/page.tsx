import { DmPageHeader } from '@/components/admin/digital-ministry/dm-ui'
import { CompetitorsClient } from '@/components/admin/digital-ministry/competitors-client'
import { listCompetitors, listCompetitorSnapshots } from '@/lib/digital-ministry/competitors'

export default async function CompetitorsPage() {
  const competitors = await listCompetitors()
  const latestById: Record<string, { titles: string[]; captured_at: string; platform: string }> = {}

  for (const c of competitors) {
    const snaps = await listCompetitorSnapshots(c.id, 1)
    const s = snaps[0]
    if (!s) continue
    const titles = Array.isArray(s.top_content)
      ? (s.top_content as Array<{ title?: string }>).map((t) => t.title || '').filter(Boolean)
      : []
    latestById[c.id] = {
      titles,
      captured_at: s.captured_at,
      platform: s.platform,
    }
  }

  return (
    <div className="space-y-6">
      <DmPageHeader
        title="Competitor Intelligence"
        description="Track peer ministries using public RSS and website signals only — no private scraping."
      />
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
