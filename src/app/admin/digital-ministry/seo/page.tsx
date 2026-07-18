import { DmPageHeader } from '@/components/admin/digital-ministry/dm-ui'
import { SeoClient } from '@/components/admin/digital-ministry/seo-client'
import { listSeoAudits } from '@/lib/digital-ministry/ops'

export default async function SeoPage() {
  const audits = await listSeoAudits(25)

  return (
    <div className="space-y-6">
      <DmPageHeader
        title="SEO Center"
        description="Audit pages for title, meta, H1, canonical, and OG — stores results in dm_seo_audits."
      />
      <SeoClient audits={audits} />
    </div>
  )
}
