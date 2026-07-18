import { DmModulePlaceholder } from '@/components/admin/digital-ministry/dm-ui'

export default function Page() {
  return (
    <DmModulePlaceholder
      title="Campaigns"
      description="Plan multi-platform campaigns around events, conferences, and outreach themes."
      bullets={[
          'Goals, date ranges, and linked studio posts',
          'Performance rollups when analytics connectors are live'
      ]}
    />
  )
}
