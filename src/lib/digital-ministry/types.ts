/** AI Digital Ministry — shared types */

export type DmPlatform =
  | 'facebook'
  | 'instagram'
  | 'youtube'
  | 'tiktok'
  | 'linkedin'
  | 'x'
  | 'threads'
  | 'pinterest'
  | 'whatsapp'
  | 'telegram'
  | 'rss'
  | 'website'
  | 'email'
  | 'google_business'

export type DmAccountStatus = 'connected' | 'disconnected' | 'expired' | 'error' | 'limited'
export type DmHealthStatus = 'healthy' | 'degraded' | 'error' | 'unknown'

export type DmPostStatus =
  | 'draft'
  | 'scheduled'
  | 'publishing'
  | 'published'
  | 'failed'
  | 'archived'

export type DmPublicationStatus =
  | 'pending'
  | 'queued'
  | 'published'
  | 'failed'
  | 'manual_required'

export type DmAiTone =
  | 'professional'
  | 'youth'
  | 'evangelism'
  | 'prayer'
  | 'leadership'
  | 'testimony'
  | 'devotional'

export interface DmPost {
  id: string
  title: string | null
  body: string | null
  body_markdown: string | null
  status: DmPostStatus
  platforms: string[]
  media_ids: string[]
  campaign_id: string | null
  sermon_id: string | null
  post_id: string | null
  scheduled_at: string | null
  published_at: string | null
  ai_tone: string | null
  ai_metadata: Record<string, unknown>
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface DmPostPublication {
  id: string
  dm_post_id: string
  social_account_id: string | null
  platform: string
  status: DmPublicationStatus
  external_id: string | null
  external_url: string | null
  error_message: string | null
  published_at: string | null
  metrics: Record<string, unknown>
}

/** Platforms selectable in Content Studio for multi-publish. */
export const DM_STUDIO_PLATFORMS: {
  id: DmPlatform
  label: string
  publishSupport: 'full' | 'limited' | 'manual' | 'analytics'
}[] = [
  { id: 'facebook', label: 'Facebook', publishSupport: 'full' },
  { id: 'instagram', label: 'Instagram', publishSupport: 'full' },
  { id: 'youtube', label: 'YouTube', publishSupport: 'manual' },
  { id: 'tiktok', label: 'TikTok', publishSupport: 'limited' },
  { id: 'x', label: 'X', publishSupport: 'manual' },
  { id: 'linkedin', label: 'LinkedIn', publishSupport: 'limited' },
  { id: 'website', label: 'Website / Blog', publishSupport: 'manual' },
  { id: 'email', label: 'Newsletter', publishSupport: 'manual' },
]

export const DM_AI_TONES: { id: DmAiTone; label: string }[] = [
  { id: 'professional', label: 'Professional' },
  { id: 'youth', label: 'Youth' },
  { id: 'evangelism', label: 'Evangelism' },
  { id: 'prayer', label: 'Prayer' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'testimony', label: 'Testimony' },
  { id: 'devotional', label: 'Devotional' },
]

export interface DmSocialAccount {
  id: string
  platform: DmPlatform
  account_name: string | null
  account_id: string | null
  avatar_url: string | null
  status: DmAccountStatus
  scopes: string[]
  token_expires_at: string | null
  health_status: DmHealthStatus
  health_message: string | null
  last_synced_at: string | null
  metadata: Record<string, unknown>
}

export interface DmDashboardKpis {
  websiteVisitors: number | null
  returningVisitors: number | null
  prayerRequests: number
  unreadPrayer: number
  contactMessages: number
  unreadContact: number
  eventCount: number
  sermonViews: number
  publishedPosts: number
  publishedSermons: number
  mediaAssets: number
  testimonies: number
  newsletterSignups: number | null
  donations: number | null
  connectedAccounts: number
  openComments: number
  growthScore: number | null
}

export interface DmInsightCard {
  label: string
  value: string
  hint?: string
  tone?: 'positive' | 'neutral' | 'warning'
}

export interface DmAiSummary {
  greeting: string
  body: string
  recommendation: string
  expectedImpact: string
  confidence: number
}

export const DM_PLATFORMS: {
  id: DmPlatform
  label: string
  publishSupport: 'full' | 'limited' | 'manual' | 'analytics'
  note?: string
}[] = [
  { id: 'facebook', label: 'Facebook', publishSupport: 'full' },
  { id: 'instagram', label: 'Instagram', publishSupport: 'full' },
  { id: 'youtube', label: 'YouTube', publishSupport: 'full' },
  { id: 'tiktok', label: 'TikTok', publishSupport: 'limited', note: 'Official APIs; some publish flows may require manual approval.' },
  { id: 'linkedin', label: 'LinkedIn', publishSupport: 'limited', note: 'Org publishing depends on LinkedIn app review.' },
  { id: 'x', label: 'X (Twitter)', publishSupport: 'manual', note: 'Draft + analytics; publish via manual workflow when write API unavailable.' },
  { id: 'threads', label: 'Threads', publishSupport: 'limited' },
  { id: 'pinterest', label: 'Pinterest', publishSupport: 'limited' },
  { id: 'whatsapp', label: 'WhatsApp', publishSupport: 'limited' },
  { id: 'telegram', label: 'Telegram', publishSupport: 'full' },
  { id: 'rss', label: 'RSS', publishSupport: 'analytics' },
  { id: 'website', label: 'Website / Blog', publishSupport: 'full' },
  { id: 'email', label: 'Email Newsletter', publishSupport: 'full' },
  { id: 'google_business', label: 'Google Business Profile', publishSupport: 'limited' },
]

export const DM_NAV = [
  { href: '/admin/digital-ministry', label: 'Dashboard' },
  { href: '/admin/digital-ministry/studio', label: 'Content Studio' },
  { href: '/admin/digital-ministry/calendar', label: 'Content Calendar' },
  { href: '/admin/digital-ministry/campaigns', label: 'Campaigns' },
  { href: '/admin/digital-ministry/ai-writer', label: 'AI Writer' },
  { href: '/admin/digital-ministry/sermon-studio', label: 'Sermon Studio' },
  { href: '/admin/digital-ministry/accounts', label: 'Social Accounts' },
  { href: '/admin/digital-ministry/accounts/facebook', label: 'Facebook' },
  { href: '/admin/digital-ministry/accounts/youtube', label: 'YouTube' },
  { href: '/admin/digital-ministry/accounts/tiktok', label: 'TikTok' },
  { href: '/admin/digital-ministry/accounts/x', label: 'X' },
  { href: '/admin/digital-ministry/accounts/linkedin', label: 'LinkedIn' },
  { href: '/admin/digital-ministry/accounts/instagram', label: 'Instagram' },
  { href: '/admin/digital-ministry/analytics', label: 'Analytics' },
  { href: '/admin/digital-ministry/competitors', label: 'Competitor Intelligence' },
  { href: '/admin/digital-ministry/community', label: 'Community' },
  { href: '/admin/digital-ministry/seo', label: 'SEO' },
  { href: '/admin/digital-ministry/website', label: 'Website Analytics' },
  { href: '/admin/media', label: 'Media Library' },
  { href: '/admin/digital-ministry/growth-coach', label: 'Growth Coach' },
  { href: '/admin/digital-ministry/reports', label: 'Reports' },
  { href: '/admin/digital-ministry/settings', label: 'Settings' },
] as const
