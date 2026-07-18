import Link from 'next/link'
import { DmCard, DmKpiCard, DmPageHeader } from '@/components/admin/digital-ministry/dm-ui'
import { Button } from '@/components/ui/button'
import { getDigitalMinistryKpis } from '@/lib/digital-ministry/dashboard'

export default async function WebsiteAnalyticsPage() {
  const kpis = await getDigitalMinistryKpis()

  return (
    <div className="space-y-6">
      <DmPageHeader
        title="Website Analytics"
        description="Site conversions and engagement proxies. Detailed GA/Search Console live under Admin Analytics."
        actions={
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/analytics">Open Google Analytics</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <DmKpiCard label="Prayer requests" value={kpis.prayerRequests} hint={`${kpis.unreadPrayer} unread`} />
        <DmKpiCard
          label="Contact messages"
          value={kpis.contactMessages}
          hint={`${kpis.unreadContact} unread`}
        />
        <DmKpiCard label="Events" value={kpis.eventCount} />
        <DmKpiCard label="Testimonies" value={kpis.testimonies} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DmKpiCard label="Published sermons" value={kpis.publishedSermons} hint={`${kpis.sermonViews.toLocaleString()} views`} />
        <DmKpiCard label="Blog posts" value={kpis.publishedPosts} />
      </div>

      <DmCard className="p-5 text-sm text-muted-foreground">
        Funnel events (Give, Prayer, Newsletter) are tracked on the public site. Connect Google under{' '}
        <Link href="/admin/analytics" className="underline underline-offset-2">
          Analytics settings
        </Link>{' '}
        for visitor sessions and Search Console coverage.
      </DmCard>
    </div>
  )
}
