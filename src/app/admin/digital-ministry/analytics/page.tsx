import { DmModulePlaceholder } from '@/components/admin/digital-ministry/dm-ui'

export default function Page() {
  return (
    <DmModulePlaceholder
      title="Analytics"
      description="Unified followers, reach, engagement, watch time, CTR, and website conversions."
      bullets={[
          'Pulls from connected social APIs + Google Analytics Data API',
          'Charts: line, bar, pie, heatmaps, funnels',
          'Links to existing Admin Analytics for GA/Search Console setup'
      ]}
      links={
[
          { href: '/admin/analytics', label: 'Google Analytics setup' }
      ]}
    />
  )
}
