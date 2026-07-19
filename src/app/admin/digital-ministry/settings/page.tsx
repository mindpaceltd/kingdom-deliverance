import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DmKpiCard, DmPageHeader } from '@/components/admin/digital-ministry/dm-ui'
import { SettingsClient } from '@/components/admin/digital-ministry/settings-client'
import { getConnectionHealth, getDmSettings } from '@/lib/digital-ministry/ops'
import type { DmAiTone } from '@/lib/digital-ministry/types'

export default async function SettingsPage() {
  const [health, settings] = await Promise.all([getConnectionHealth(), getDmSettings()])
  const notify = settings.notify_email as { email?: string } | undefined
  const prefs = settings.studio_prefs as { defaultTone?: string } | undefined

  const checks = health
    ? [health.google, health.meta, health.gemini, health.tokenEncryption]
    : []
  const configured = checks.filter(Boolean).length
  const missing = checks.length - configured

  return (
    <div className="space-y-6">
      <DmPageHeader
        title="Settings"
        description="API connection health, notification channels, and Digital Ministry preferences for the media team."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/digital-ministry/accounts">Social Accounts</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/digital-ministry">Dashboard</Link>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <DmKpiCard
          label="Integrations ready"
          value={`${configured}/${checks.length || 4}`}
          hint={missing === 0 ? 'All core keys present' : `${missing} missing`}
          accent={missing === 0 ? 'text-emerald-700' : 'text-amber-700'}
        />
        <DmKpiCard
          label="Gemini AI"
          value={health?.gemini ? 'On' : 'Off'}
          hint={health?.gemini ? 'Content Studio & Coach' : 'Add GEMINI_API_KEY'}
          accent={health?.gemini ? 'text-emerald-700' : 'text-amber-700'}
        />
        <DmKpiCard
          label="Meta OAuth"
          value={health?.meta ? 'On' : 'Off'}
          hint={health?.meta ? 'Facebook / Instagram' : 'Add later if needed'}
          accent={health?.meta ? 'text-emerald-700' : 'text-muted-foreground'}
        />
        <DmKpiCard
          label="Notify email"
          value={notify?.email ? 'Set' : '—'}
          hint={notify?.email || 'Not configured'}
        />
      </div>

      <SettingsClient
        health={health}
        notifyEmail={notify?.email || ''}
        defaultTone={(prefs?.defaultTone as DmAiTone) || 'evangelism'}
      />
    </div>
  )
}
