import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DmKpiCard, DmPageHeader } from '@/components/admin/digital-ministry/dm-ui'
import { CompetitorsClient } from '@/components/admin/digital-ministry/competitors-client'
import { fetchIntelligenceDashboard, listCompetitors } from '@/lib/digital-ministry/competitors'
import { parseCompetitorPlatforms } from '@/lib/digital-ministry/competitor-platforms'

export default async function CompetitorsPage() {
  const [competitors, dashboard] = await Promise.all([listCompetitors(), fetchIntelligenceDashboard()])

  return (
    <div className="space-y-6">
      <DmPageHeader
        title="Competitor Intelligence"
        description="Monitor peer ministries — capture public content across websites, RSS, YouTube, and linked social profiles. AI analysis uses verified data only; never invented metrics."
        actions={
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/digital-ministry">Dashboard</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <DmKpiCard label="Tracked peers" value={dashboard?.trackedPeers ?? competitors.length} hint="Active watchlist" />
        <DmKpiCard label="Active sources" value={dashboard?.activeSources ?? 0} hint="Connected public sources" />
        <DmKpiCard label="Content found" value={dashboard?.contentFound ?? 0} hint="Normalized content items" />
        <DmKpiCard
          label="Opportunities"
          value={dashboard?.opportunities ?? 0}
          hint="Content gaps from AI strategy"
        />
      </div>

      <CompetitorsClient
        dashboard={dashboard}
        competitors={competitors.map((c) => {
          const parsed = parseCompetitorPlatforms((c.platforms ?? {}) as Record<string, unknown>)
          return {
            id: c.id,
            name: c.name,
            website_url: c.website_url,
            notes: c.notes,
            country: c.country,
            organization_type: c.organization_type,
            monitoring_frequency: c.monitoring_frequency,
            last_captured_at: c.last_captured_at,
            urls: parsed.urls,
            metrics: parsed.metrics,
          }
        })}
      />
    </div>
  )
}
