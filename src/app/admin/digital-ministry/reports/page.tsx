import { DmModulePlaceholder } from '@/components/admin/digital-ministry/dm-ui'

export default function Page() {
  return (
    <DmModulePlaceholder
      title="Reports"
      description="Daily, weekly, monthly, quarterly, and yearly exports."
      bullets={[
          'PDF / CSV / email delivery',
          'Payload stored in dm_reports'
      ]}
    />
  )
}
