import { DmPageHeader } from '@/components/admin/digital-ministry/dm-ui'
import { CampaignsClient } from '@/components/admin/digital-ministry/campaigns-client'
import { listCampaigns } from '@/lib/digital-ministry/ops'

export default async function CampaignsPage() {
  const campaigns = await listCampaigns()

  return (
    <div className="space-y-6">
      <DmPageHeader
        title="Campaigns"
        description="Plan multi-platform campaigns around events, conferences, and outreach themes."
      />
      <CampaignsClient campaigns={campaigns} />
    </div>
  )
}
