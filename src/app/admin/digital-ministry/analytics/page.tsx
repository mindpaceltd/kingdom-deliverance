import Link from 'next/link'
import { DmCard, DmKpiCard, DmPageHeader } from '@/components/admin/digital-ministry/dm-ui'
import { Button } from '@/components/ui/button'
import { getAnalyticsBundle } from '@/lib/digital-ministry/analytics'
import { AnalyticsCharts } from '@/components/admin/digital-ministry/analytics-charts'

export default async function AnalyticsPage() {
  const bundle = await getAnalyticsBundle()

  return (
    <div className="space-y-6">
      <DmPageHeader
        title="Analytics"
        description="Unified ministry metrics from site data, Studio activity, and community inbox."
        actions={
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/analytics">Google Analytics setup</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <DmKpiCard label="Sermon views" value={bundle.kpis.sermonViews.toLocaleString()} />
        <DmKpiCard label="Published posts" value={bundle.kpis.publishedPosts} />
        <DmKpiCard label="Connected accounts" value={bundle.kpis.connectedAccounts} />
        <DmKpiCard
          label="Growth score"
          value={bundle.kpis.growthScore != null ? `${bundle.kpis.growthScore}%` : '—'}
        />
      </div>

      <AnalyticsCharts series={bundle.series} platformMix={bundle.platformMix} />

      <DmCard className="p-4 text-sm text-muted-foreground">
        Website visitors from GA appear under{' '}
        <Link href="/admin/analytics" className="underline underline-offset-2">
          Admin → Analytics
        </Link>{' '}
        once Google is connected. This view stores daily snapshots in{' '}
        <code className="text-xs">dm_analytics_snapshots</code>.
      </DmCard>
    </div>
  )
}
