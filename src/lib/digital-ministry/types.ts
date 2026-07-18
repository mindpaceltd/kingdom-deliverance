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
