'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { DmCard } from '@/components/admin/digital-ministry/dm-ui'
import {
  COMPETITOR_PLATFORM_FIELDS,
  COMPETITOR_PLATFORM_GROUPS,
  type CompetitorPlatformKey,
  type CompetitorPlatformsPayload,
} from '@/lib/digital-ministry/competitor-platforms'
import { cn } from '@/lib/utils'
import {
  ORGANIZATION_TYPE_LABELS,
  type MonitoringFrequency,
  type OrganizationType,
} from '@/lib/digital-ministry/competitor-intelligence/types'
import { Loader2 } from 'lucide-react'

const METRIC_PLATFORMS: CompetitorPlatformKey[] = [
  'youtube',
  'facebook',
  'instagram',
  'tiktok',
  'x',
  'linkedin',
  'telegram',
]

function emptyForm(): {
  name: string
  website: string
  country: string
  organizationType: OrganizationType
  monitoringFrequency: MonitoringFrequency
  notes: string
  urls: Partial<Record<CompetitorPlatformKey, string>>
  metrics: CompetitorPlatformsPayload['metrics']
} {
  return {
    name: '',
    website: '',
    country: 'Uganda',
    organizationType: 'church',
    monitoringFrequency: 'manual',
    notes: '',
    urls: {},
    metrics: {},
  }
}

function parseMetricInput(value: string): number | null {
  const v = value.trim()
  if (!v) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export function competitorFormFromRecord(c: {
  name: string
  website_url: string | null
  notes: string | null
  country?: string | null
  organization_type?: OrganizationType | null
  monitoring_frequency?: MonitoringFrequency | null
  urls: Partial<Record<CompetitorPlatformKey, string>>
  metrics: CompetitorPlatformsPayload['metrics']
}) {
  return {
    name: c.name,
    website: c.website_url ?? c.urls.website ?? '',
    country: c.country ?? 'Uganda',
    organizationType: (c.organization_type ?? 'church') as OrganizationType,
    monitoringFrequency: (c.monitoring_frequency ?? 'manual') as MonitoringFrequency,
    notes: c.notes ?? '',
    urls: { ...c.urls, website: undefined },
    metrics: { ...c.metrics },
  }
}

export function CompetitorForm({
  initial,
  editingId,
  pending,
  onSubmit,
  onCancel,
}: {
  initial: ReturnType<typeof emptyForm>
  editingId?: string
  pending: boolean
  onSubmit: (data: ReturnType<typeof emptyForm>) => void
  onCancel: () => void
}) {
  const [form, setForm] = React.useState(initial)

  React.useEffect(() => {
    setForm(initial)
  }, [initial, editingId])

  function setUrl(key: CompetitorPlatformKey, value: string) {
    setForm((f) => ({ ...f, urls: { ...f.urls, [key]: value } }))
  }

  function setMetric(
    key: CompetitorPlatformKey,
    field: 'followers' | 'subscribers' | 'views' | 'engagement_rate' | 'posting_frequency',
    value: string
  ) {
    setForm((f) => ({
      ...f,
      metrics: {
        ...f.metrics,
        [key]: {
          ...f.metrics[key],
          [field]: parseMetricInput(value),
        },
      },
    }))
  }

  return (
    <DmCard className="space-y-6 p-5">
      <div>
        <p className="text-sm font-semibold">{editingId ? 'Edit peer ministry' : 'Add peer ministry'}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Link every public channel you track. Social fields are optional — add performance numbers manually
          where auto-capture is not available.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Ministry name *
          </label>
          <Input
            placeholder="e.g. Watoto Church"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Country
          </label>
          <Input
            placeholder="Uganda"
            value={form.country}
            onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Organization type
          </label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.organizationType}
            onChange={(e) =>
              setForm((f) => ({ ...f, organizationType: e.target.value as OrganizationType }))
            }
          >
            {Object.entries(ORGANIZATION_TYPE_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Monitoring frequency
          </label>
          <div className="flex flex-wrap gap-4 text-sm">
            {(['manual', 'weekly', 'daily'] as MonitoringFrequency[]).map((freq) => (
              <label key={freq} className="flex items-center gap-2 capitalize">
                <input
                  type="radio"
                  name="monitoring"
                  checked={form.monitoringFrequency === freq}
                  onChange={() => setForm((f) => ({ ...f, monitoringFrequency: freq }))}
                />
                {freq}
              </label>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Daily/weekly monitoring runs via scheduled capture cron (5:00 UTC daily). Weekly strategy reports email on Mondays.
          </p>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Notes
          </label>
          <Textarea
            placeholder="Why track them? Strengths, themes, audience…"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="min-h-[72px]"
          />
        </div>
      </div>

      {COMPETITOR_PLATFORM_GROUPS.map((group) => (
        <div key={group.id} className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-900">{group.label}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {COMPETITOR_PLATFORM_FIELDS.filter((f) => f.group === group.id).map((field) => {
              const Icon = field.icon
              const isMultiline = field.key === 'landing_pages'
              const value =
                field.key === 'website'
                  ? form.website
                  : form.urls[field.key] ?? ''

              return (
                <div
                  key={field.key}
                  className={cn('space-y-1.5', isMultiline && 'sm:col-span-2')}
                >
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {Icon ? <Icon className="size-3 opacity-70" /> : null}
                    {field.label}
                  </label>
                  {isMultiline ? (
                    <Textarea
                      placeholder={field.placeholder}
                      value={value}
                      onChange={(e) => setUrl(field.key, e.target.value)}
                      className="min-h-[80px] font-mono text-xs"
                    />
                  ) : (
                    <Input
                      placeholder={field.placeholder}
                      value={value}
                      onChange={(e) => {
                        if (field.key === 'website') {
                          setForm((f) => ({ ...f, website: e.target.value }))
                        } else {
                          setUrl(field.key, e.target.value)
                        }
                      }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <div className="space-y-3 border-t border-border pt-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-900">
            Performance (optional)
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Enter latest public stats manually. YouTube subscriber counts can also be refreshed via Capture.
          </p>
        </div>
        <div className="space-y-4">
          {METRIC_PLATFORMS.map((key) => {
            const field = COMPETITOR_PLATFORM_FIELDS.find((f) => f.key === key)!
            const m = form.metrics[key] ?? {}
            if (!field.metricLabels) return null
            return (
              <div
                key={key}
                className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-2"
              >
                <p className="text-xs font-semibold">{field.label}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {field.metricLabels.subscribers != null && (
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">{field.metricLabels.subscribers}</label>
                      <Input
                        type="number"
                        min={0}
                        className="h-8 text-xs"
                        value={m.subscribers ?? ''}
                        onChange={(e) => setMetric(key, 'subscribers', e.target.value)}
                      />
                    </div>
                  )}
                  {field.metricLabels.followers != null && (
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">{field.metricLabels.followers}</label>
                      <Input
                        type="number"
                        min={0}
                        className="h-8 text-xs"
                        value={m.followers ?? ''}
                        onChange={(e) => setMetric(key, 'followers', e.target.value)}
                      />
                    </div>
                  )}
                  {field.metricLabels.views != null && (
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">{field.metricLabels.views}</label>
                      <Input
                        type="number"
                        min={0}
                        className="h-8 text-xs"
                        value={m.views ?? ''}
                        onChange={(e) => setMetric(key, 'views', e.target.value)}
                      />
                    </div>
                  )}
                  {field.metricLabels.engagement != null && (
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">{field.metricLabels.engagement}</label>
                      <Input
                        type="number"
                        min={0}
                        step={0.1}
                        className="h-8 text-xs"
                        value={m.engagement_rate ?? ''}
                        onChange={(e) => setMetric(key, 'engagement_rate', e.target.value)}
                      />
                    </div>
                  )}
                  {field.metricLabels.postingFrequency != null && (
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">
                        {field.metricLabels.postingFrequency}
                      </label>
                      <Input
                        type="number"
                        min={0}
                        className="h-8 text-xs"
                        value={m.posting_frequency ?? ''}
                        onChange={(e) => setMetric(key, 'posting_frequency', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={pending} onClick={() => onSubmit(form)}>
          {pending ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : null}
          {editingId ? 'Save changes' : 'Save to watchlist'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </DmCard>
  )
}

export { emptyForm }
