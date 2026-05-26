import { createAdminClient } from '@/lib/supabase/server'
import { SettingsForm } from '@/components/admin/settings/settings-form'
import type { SiteSetting } from '@/lib/types'

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
  'social_links_json',
  'contact_phones_json',
  'live_stream_url',
  'donation_instructions',
  'site_logo',
  'site_icon',
  'site_meta_title',
  'site_meta_description',
  'site_keywords',
  'site_og_image',
  'mission',
  'vision',
  'founder_name',
  'founder_bio',
  'smtp_host',
  'smtp_port',
  'smtp_user',
  'smtp_pass',
  'smtp_encryption',
  'smtp_from_email',
  'smtp_from_name',
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
  'pesapal_ipn_id',
  'google_pagespeed_api_key',
  'qr_codes_json',
] as const

const KDC_DEFAULTS: Partial<Record<(typeof SETTINGS_KEYS)[number], string>> = {
  site_name: 'Kingdom Deliverance Centre Uganda',
  tagline: 'Setting the captives free',
  contact_email: 'info@kdcuganda.org',
  founder_name: 'Bishop Climate Wiseman Irungu',
  founder_bio: 'Founder & Lead Pastor, Kingdom Deliverance Centre Uganda',
  mission: 'To set the captives free through the power of the Gospel',
  vision: 'A community that is wealthy, healthy, and wise',
  address: 'Kosovo–Lungujja, Kampala, Uganda',
  service_times:
    'Sunday Worship — 10:00 AM\nWednesday Bible Study — 6:00 PM\nFriday Fire Service — 6:00 PM',
}

export default async function AdminSettingsPage() {
  const admin = createAdminClient()
  const { data: settings } = await admin
    .from('site_settings')
    .select('*')
    .in('key', [...SETTINGS_KEYS])

  const settingsMap = new Map<string, string>()
  for (const s of settings ?? []) {
    settingsMap.set(s.key, s.value ?? '')
  }

  const allSettings: SiteSetting[] = SETTINGS_KEYS.map((key) => ({
    key,
    value: settingsMap.get(key) || KDC_DEFAULTS[key] || '',
    updated_at: '',
  }))

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Site Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure your website&apos;s global parameters, payments, email, and integrations.
        </p>
      </div>
      <SettingsForm initialSettings={allSettings} />
    </div>
  )
}
