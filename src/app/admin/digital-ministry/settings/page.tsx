import { DmPageHeader } from '@/components/admin/digital-ministry/dm-ui'
import { SettingsClient } from '@/components/admin/digital-ministry/settings-client'
import { getConnectionHealth, getDmSettings } from '@/lib/digital-ministry/ops'

export default async function SettingsPage() {
  const [health, settings] = await Promise.all([getConnectionHealth(), getDmSettings()])
  const notify = settings.notify_email as { email?: string } | undefined

  return (
    <div className="space-y-6">
      <DmPageHeader
        title="Settings"
        description="Module preferences, notification channels, and API connection health."
      />
      <SettingsClient health={health} notifyEmail={notify?.email || ''} />
    </div>
  )
}
