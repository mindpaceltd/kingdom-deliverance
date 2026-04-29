'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { saveSettings } from '@/lib/actions/settings'
import type { SiteSetting } from '@/lib/types'

// ---------------------------------------------------------------------------
// Settings keys and metadata
// ---------------------------------------------------------------------------

const SETTINGS_FIELDS: {
  key: string
  label: string
  type: 'text' | 'email' | 'url' | 'tel' | 'textarea'
  placeholder?: string
}[] = [
  { key: 'site_name', label: 'Site Name', type: 'text', placeholder: 'Kingdom Deliverance Church' },
  { key: 'tagline', label: 'Tagline', type: 'text', placeholder: 'Transforming lives through the power of God' },
  { key: 'contact_email', label: 'Contact Email', type: 'email', placeholder: 'info@kdcuganda.org' },
  { key: 'contact_phone', label: 'Contact Phone', type: 'tel', placeholder: '+256 700 000 000' },
  { key: 'address', label: 'Address', type: 'textarea', placeholder: 'Plot 1, Church Road, Kampala, Uganda' },
  { key: 'facebook_url', label: 'Facebook URL', type: 'url', placeholder: 'https://facebook.com/kdcuganda' },
  { key: 'youtube_url', label: 'YouTube URL', type: 'url', placeholder: 'https://youtube.com/@kdcuganda' },
  { key: 'twitter_url', label: 'Twitter / X URL', type: 'url', placeholder: 'https://twitter.com/kdcuganda' },
  { key: 'instagram_url', label: 'Instagram URL', type: 'url', placeholder: 'https://instagram.com/kdcuganda' },
  { key: 'service_times', label: 'Service Times', type: 'textarea', placeholder: 'Sunday: 8:00 AM & 10:30 AM\nWednesday: 6:30 PM' },
  { key: 'live_stream_url', label: 'Live Stream URL', type: 'url', placeholder: 'https://youtube.com/live/...' },
  { key: 'donation_instructions', label: 'Donation Instructions', type: 'textarea', placeholder: 'Bank: ...\nMobile Money: ...' },
]

// ---------------------------------------------------------------------------
// SettingsForm
// ---------------------------------------------------------------------------

interface SettingsFormProps {
  initialSettings: SiteSetting[]
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  // Build initial values map
  const initialValues = React.useMemo(() => {
    const map: Record<string, string> = {}
    for (const s of initialSettings) {
      map[s.key] = s.value ?? ''
    }
    return map
  }, [initialSettings])

  const [values, setValues] = React.useState<Record<string, string>>(initialValues)
  const [saving, setSaving] = React.useState(false)
  const [saveError, setSaveError] = React.useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = React.useState(false)

  function handleChange(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }))
    setSaveSuccess(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    const result = await saveSettings(values)

    if ('error' in result) {
      setSaveError(result.error)
    } else {
      setSaveSuccess(true)
    }

    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* General */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          General
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {SETTINGS_FIELDS.filter((f) =>
            ['site_name', 'tagline'].includes(f.key)
          ).map((field) => (
            <FieldInput
              key={field.key}
              field={field}
              value={values[field.key] ?? ''}
              onChange={(v) => handleChange(field.key, v)}
            />
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Contact
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {SETTINGS_FIELDS.filter((f) =>
            ['contact_email', 'contact_phone'].includes(f.key)
          ).map((field) => (
            <FieldInput
              key={field.key}
              field={field}
              value={values[field.key] ?? ''}
              onChange={(v) => handleChange(field.key, v)}
            />
          ))}
        </div>
        <FieldInput
          field={SETTINGS_FIELDS.find((f) => f.key === 'address')!}
          value={values['address'] ?? ''}
          onChange={(v) => handleChange('address', v)}
        />
      </section>

      {/* Social Media */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Social Media
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {SETTINGS_FIELDS.filter((f) =>
            ['facebook_url', 'youtube_url', 'twitter_url', 'instagram_url'].includes(f.key)
          ).map((field) => (
            <FieldInput
              key={field.key}
              field={field}
              value={values[field.key] ?? ''}
              onChange={(v) => handleChange(field.key, v)}
            />
          ))}
        </div>
      </section>

      {/* Services & Streaming */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Services &amp; Streaming
        </h2>
        <FieldInput
          field={SETTINGS_FIELDS.find((f) => f.key === 'service_times')!}
          value={values['service_times'] ?? ''}
          onChange={(v) => handleChange('service_times', v)}
        />
        <FieldInput
          field={SETTINGS_FIELDS.find((f) => f.key === 'live_stream_url')!}
          value={values['live_stream_url'] ?? ''}
          onChange={(v) => handleChange('live_stream_url', v)}
        />
      </section>

      {/* Donations */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Donations
        </h2>
        <FieldInput
          field={SETTINGS_FIELDS.find((f) => f.key === 'donation_instructions')!}
          value={values['donation_instructions'] ?? ''}
          onChange={(v) => handleChange('donation_instructions', v)}
        />
      </section>

      {/* Footer */}
      <div className="flex items-center gap-4 pt-2">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save Settings'}
        </Button>
        {saveError && (
          <p className="text-sm text-destructive">{saveError}</p>
        )}
        {saveSuccess && (
          <p className="text-sm text-green-600 dark:text-green-400">
            Settings saved successfully.
          </p>
        )}
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// FieldInput — renders either an Input or Textarea based on field type
// ---------------------------------------------------------------------------

interface FieldInputProps {
  field: (typeof SETTINGS_FIELDS)[number]
  value: string
  onChange: (value: string) => void
}

function FieldInput({ field, value, onChange }: FieldInputProps) {
  const id = `setting-${field.key}`

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{field.label}</Label>
      {field.type === 'textarea' ? (
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          className="resize-y"
        />
      ) : (
        <Input
          id={id}
          type={field.type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
        />
      )}
    </div>
  )
}
