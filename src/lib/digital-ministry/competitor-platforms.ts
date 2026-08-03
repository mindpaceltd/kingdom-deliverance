import type { ComponentType } from 'react'
import {
  Globe2,
  Mail,
  MessageCircle,
  Rss,
  Send,
  Share2,
} from 'lucide-react'
import {
  IconFacebook,
  IconInstagram,
  IconLinkedin,
  IconTiktok,
  IconTwitter,
  IconYoutube,
} from '@/components/icons/social-inline'

/** Keys stored in dm_competitors.platforms JSONB (URLs + optional metrics). */
export type CompetitorPlatformKey =
  | 'website'
  | 'landing_page'
  | 'landing_pages'
  | 'rss'
  | 'youtube'
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'x'
  | 'linkedin'
  | 'threads'
  | 'pinterest'
  | 'whatsapp'
  | 'telegram'
  | 'google_business'
  | 'email'

export interface CompetitorPlatformField {
  key: CompetitorPlatformKey
  label: string
  placeholder: string
  group: 'web' | 'social' | 'other'
  icon: ComponentType<{ className?: string }>
  /** Shown in capture / performance panels */
  captureKind: 'web' | 'rss' | 'youtube' | 'social'
  metricLabels?: {
    followers?: string
    subscribers?: string
    views?: string
    engagement?: string
    postingFrequency?: string
  }
}

export const COMPETITOR_PLATFORM_FIELDS: CompetitorPlatformField[] = [
  {
    key: 'website',
    label: 'Main website',
    placeholder: 'https://example.org',
    group: 'web',
    icon: Globe2,
    captureKind: 'web',
  },
  {
    key: 'landing_page',
    label: 'Primary landing page',
    placeholder: 'https://example.org/give or /visit',
    group: 'web',
    icon: Globe2,
    captureKind: 'web',
  },
  {
    key: 'landing_pages',
    label: 'Other landing pages (one per line)',
    placeholder: 'https://example.org/events\nhttps://example.org/live',
    group: 'web',
    icon: Share2,
    captureKind: 'web',
  },
  {
    key: 'rss',
    label: 'RSS / Atom feed',
    placeholder: 'https://example.org/feed',
    group: 'web',
    icon: Rss,
    captureKind: 'rss',
    metricLabels: { postingFrequency: 'Items in feed' },
  },
  {
    key: 'youtube',
    label: 'YouTube channel',
    placeholder: 'https://youtube.com/@channel',
    group: 'social',
    icon: IconYoutube,
    captureKind: 'youtube',
    metricLabels: {
      subscribers: 'Subscribers',
      views: 'Total views',
      postingFrequency: 'Recent videos',
    },
  },
  {
    key: 'facebook',
    label: 'Facebook page',
    placeholder: 'https://facebook.com/…',
    group: 'social',
    icon: IconFacebook,
    captureKind: 'social',
    metricLabels: { followers: 'Followers', engagement: 'Engagement %' },
  },
  {
    key: 'instagram',
    label: 'Instagram',
    placeholder: 'https://instagram.com/…',
    group: 'social',
    icon: IconInstagram,
    captureKind: 'social',
    metricLabels: { followers: 'Followers', engagement: 'Engagement %' },
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    placeholder: 'https://tiktok.com/@…',
    group: 'social',
    icon: IconTiktok,
    captureKind: 'social',
    metricLabels: { followers: 'Followers', views: 'Total views' },
  },
  {
    key: 'x',
    label: 'X (Twitter)',
    placeholder: 'https://x.com/…',
    group: 'social',
    icon: IconTwitter,
    captureKind: 'social',
    metricLabels: { followers: 'Followers' },
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    placeholder: 'https://linkedin.com/company/…',
    group: 'social',
    icon: IconLinkedin,
    captureKind: 'social',
    metricLabels: { followers: 'Followers' },
  },
  {
    key: 'threads',
    label: 'Threads',
    placeholder: 'https://threads.net/@…',
    group: 'social',
    icon: MessageCircle,
    captureKind: 'social',
    metricLabels: { followers: 'Followers' },
  },
  {
    key: 'pinterest',
    label: 'Pinterest',
    placeholder: 'https://pinterest.com/…',
    group: 'social',
    icon: Share2,
    captureKind: 'social',
    metricLabels: { followers: 'Followers' },
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp channel / link',
    placeholder: 'https://wa.me/… or channel URL',
    group: 'social',
    icon: MessageCircle,
    captureKind: 'social',
  },
  {
    key: 'telegram',
    label: 'Telegram',
    placeholder: 'https://t.me/…',
    group: 'social',
    icon: Send,
    captureKind: 'social',
    metricLabels: { subscribers: 'Subscribers' },
  },
  {
    key: 'google_business',
    label: 'Google Business Profile',
    placeholder: 'https://maps.google.com/… or g.page/…',
    group: 'other',
    icon: Globe2,
    captureKind: 'web',
  },
  {
    key: 'email',
    label: 'Newsletter / email signup',
    placeholder: 'https://example.org/subscribe',
    group: 'other',
    icon: Mail,
    captureKind: 'web',
  },
]

export const COMPETITOR_PLATFORM_GROUPS = [
  { id: 'web' as const, label: 'Website & feeds' },
  { id: 'social' as const, label: 'Social media (optional)' },
  { id: 'other' as const, label: 'Other channels' },
]

export interface CompetitorPlatformsPayload {
  urls: Partial<Record<CompetitorPlatformKey, string>>
  metrics: Partial<
    Record<
      CompetitorPlatformKey,
      {
        followers?: number | null
        subscribers?: number | null
        views?: number | null
        engagement_rate?: number | null
        posting_frequency?: number | null
        updated_at?: string
      }
    >
  >
}

const METRICS_KEY = '_metrics'

/** Parse platforms JSONB from the database into URLs + manual metrics. */
export function parseCompetitorPlatforms(raw: Record<string, unknown> | null): CompetitorPlatformsPayload {
  const urls: Partial<Record<CompetitorPlatformKey, string>> = {}
  const metrics: CompetitorPlatformsPayload['metrics'] = {}

  if (!raw) return { urls, metrics }

  const storedMetrics = raw[METRICS_KEY]
  if (storedMetrics && typeof storedMetrics === 'object') {
    Object.assign(metrics, storedMetrics as CompetitorPlatformsPayload['metrics'])
  }

  for (const field of COMPETITOR_PLATFORM_FIELDS) {
    const value = raw[field.key]
    if (typeof value === 'string' && value.trim()) {
      urls[field.key] = value.trim()
    }
  }

  return { urls, metrics }
}

/** Build platforms JSONB for storage. */
export function buildCompetitorPlatforms(payload: CompetitorPlatformsPayload): Record<string, unknown> {
  const out: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(payload.urls)) {
    if (value?.trim()) out[key] = value.trim()
  }

  const cleanedMetrics: CompetitorPlatformsPayload['metrics'] = {}
  for (const [key, m] of Object.entries(payload.metrics ?? {})) {
    if (!m) continue
    const hasAny =
      m.followers != null ||
      m.subscribers != null ||
      m.views != null ||
      m.engagement_rate != null ||
      m.posting_frequency != null
    if (hasAny) {
      cleanedMetrics[key as CompetitorPlatformKey] = {
        ...m,
        updated_at: m.updated_at ?? new Date().toISOString(),
      }
    }
  }

  if (Object.keys(cleanedMetrics).length) {
    out[METRICS_KEY] = cleanedMetrics
  }

  return out
}

export function listConfiguredPlatformUrls(
  urls: Partial<Record<CompetitorPlatformKey, string>>,
  websiteUrl?: string | null
): Array<{ platform: CompetitorPlatformKey; url: string; captureKind: CompetitorPlatformField['captureKind'] }> {
  const items: Array<{
    platform: CompetitorPlatformKey
    url: string
    captureKind: CompetitorPlatformField['captureKind']
  }> = []

  const fieldByKey = new Map(COMPETITOR_PLATFORM_FIELDS.map((f) => [f.key, f]))

  if (websiteUrl?.trim()) {
    items.push({
      platform: 'website',
      url: websiteUrl.trim(),
      captureKind: 'web',
    })
  }

  for (const [key, url] of Object.entries(urls)) {
    if (!url?.trim()) continue
    if (key === 'landing_pages') {
      for (const line of url.split('\n')) {
        const u = line.trim()
        if (u) {
          items.push({
            platform: 'landing_page',
            url: u,
            captureKind: 'web',
          })
        }
      }
      continue
    }
    const field = fieldByKey.get(key as CompetitorPlatformKey)
    if (!field) continue
    if (key === 'website') continue
    items.push({
      platform: key as CompetitorPlatformKey,
      url: url.trim(),
      captureKind: field.captureKind,
    })
  }

  return items
}

export function platformField(key: string) {
  return COMPETITOR_PLATFORM_FIELDS.find((f) => f.key === key)
}

export function formatMetric(n: number | null | undefined, kind: 'count' | 'percent' = 'count'): string {
  if (n == null || Number.isNaN(n)) return '—'
  if (kind === 'percent') return `${n.toFixed(1)}%`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(Math.round(n))
}
