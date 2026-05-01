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
  // Branding
  'site_logo',
  'site_icon',
  // SEO
  'site_meta_title',
  'site_meta_description',
  'site_keywords',
  // SMTP
  'smtp_host',
  'smtp_port',
  'smtp_user',
  'smtp_pass',
  'smtp_encryption',
  'smtp_from_email',
  'smtp_from_name',
  // Payments
  'paypal_enabled',
  'paypal_client_id',
  'paypal_secret',
  'paypal_mode',
  'stripe_enabled',
  'stripe_publishable_key',
  'stripe_secret_key',
  'pesapal_enabled',
  'pesapal_consumer_key',
  'pesapal_consumer_secret',
  'pesapal_mode',
] as const

export default async function AdminSettingsPage() {
  const supabase = createClient()

  // Verify current user is admin
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="p-6 text-center">
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
      <div className="p-6 text-center">
        <h1 className="text-xl font-bold text-destructive">Not Authorised</h1>
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
    <div className="flex flex-col h-screen overflow-hidden -m-6 bg-background">
      <header className="shrink-0 border-b border-border bg-background/95 px-6 py-4 backdrop-blur">
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-xl font-bold">Site Settings</h1>
               <p className="text-xs text-muted-foreground">Configure your website's global parameters, payments, and integrations.</p>
            </div>
         </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
           <SettingsForm initialSettings={allSettings} />
        </div>
      </main>
    </div>
  )
}
