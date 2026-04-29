import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from '@/components/admin/settings/settings-form'
import type { SiteSetting, UserRole } from '@/lib/types'

const SETTINGS_KEYS = [
  'site_name',
  'tagline',
  'contact_email',
  'contact_phone',
  'address',
  'facebook_url',
  'youtube_url',
  'twitter_url',
  'instagram_url',
  'service_times',
  'live_stream_url',
  'donation_instructions',
] as const

export default async function AdminSettingsPage() {
  const supabase = createClient()

  // Verify current user is admin
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Not authenticated.</p>
      </div>
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role as UserRole) !== 'admin') {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-destructive">Not Authorised</h1>
        <p className="text-sm text-muted-foreground mt-1">
          You do not have permission to manage site settings.
        </p>
      </div>
    )
  }

  // Fetch current site settings
  const { data: settings } = await supabase
    .from('site_settings')
    .select('*')
    .in('key', SETTINGS_KEYS)

  // Ensure all 12 keys are present (fill missing with empty string)
  const settingsMap = new Map<string, string>()
  for (const s of settings ?? []) {
    settingsMap.set(s.key, s.value ?? '')
  }

  const allSettings: SiteSetting[] = SETTINGS_KEYS.map((key) => ({
    key,
    value: settingsMap.get(key) ?? '',
    updated_at: '',
  }))

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Site Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure branding, contact details, social links, and more.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <SettingsForm initialSettings={allSettings} />
      </div>
    </div>
  )
}
