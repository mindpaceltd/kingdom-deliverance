import { requireAdmin } from '@/lib/authz'
import { SettingsTabs } from '@/components/admin/settings/settings-tabs'

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const auth = await requireAdmin()
  if ('error' in auth) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
        <h1 className="text-xl font-bold text-destructive">Not authorised</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Only administrators can access site settings.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <SettingsTabs />
      {children}
    </div>
  )
}
