import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DmKpiCard, DmPageHeader } from '@/components/admin/digital-ministry/dm-ui'
import { CampaignsClient } from '@/components/admin/digital-ministry/campaigns-client'
import { listCampaigns } from '@/lib/digital-ministry/ops'

export default async function CampaignsPage() {
  const campaigns = await listCampaigns()

  const now = Date.now()
  const active = campaigns.filter((c) => c.status === 'active')
  const endingSoon = active.filter((c) => {
    if (!c.end_date) return false
    const days = (new Date(c.end_date).getTime() - now) / (24 * 60 * 60 * 1000)
    return days >= 0 && days <= 7
  })
  const nextDeadline = active
    .filter((c) => c.end_date && new Date(c.end_date).getTime() >= now)
    .sort((a, b) => new Date(a.end_date!).getTime() - new Date(b.end_date!).getTime())[0]

  return (
    <div className="space-y-6">
      <DmPageHeader
        title="Campaigns"
        description="Plan multi-platform campaigns around events, conferences, and outreach themes."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/digital-ministry">Dashboard</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/digital-ministry/calendar">Calendar</Link>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <DmKpiCard label="Active" value={active.length} hint="Currently running" />
        <DmKpiCard
          label="Ending this week"
          value={endingSoon.length}
          hint={endingSoon.length ? 'Push the final call' : 'Nothing closing soon'}
        />
        <DmKpiCard label="Total tracked" value={campaigns.length} hint="Excluding archived" />
        <DmKpiCard
          label="Next deadline"
          value={
            nextDeadline?.end_date
              ? new Date(nextDeadline.end_date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })
              : '—'
          }
          hint={nextDeadline ? nextDeadline.name : 'No dated campaigns'}
        />
      </div>

      <CampaignsClient campaigns={campaigns} />
    </div>
  )
}
