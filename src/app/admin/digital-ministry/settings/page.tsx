import { DmModulePlaceholder } from '@/components/admin/digital-ministry/dm-ui'

export default function Page() {
  return (
    <DmModulePlaceholder
      title="Settings"
      description="Module preferences, notification channels, and API connection health."
      bullets={[
          'Role-aware access (admin / media / editor)',
          'Token refresh and audit logging'
      ]}
    />
  )
}
