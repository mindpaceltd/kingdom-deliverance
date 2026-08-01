export type OrganizationType =
  | 'church'
  | 'ministry'
  | 'christian_org'
  | 'pastor'
  | 'media_ministry'
  | 'ngo'
  | 'other'

export type MonitoringFrequency = 'daily' | 'weekly' | 'manual'

export type SourceDiscoveryStatus = 'pending' | 'connected' | 'limited' | 'unavailable' | 'error'

export type CaptureStepStatus = 'ok' | 'warning' | 'error' | 'skipped'

export interface CaptureStepResult {
  platform: string
  label: string
  status: CaptureStepStatus
  message: string
  itemsFound?: number
}

export interface NormalizedContentItem {
  platform: string
  externalId: string | null
  url: string | null
  title: string
  caption?: string | null
  description?: string | null
  contentType: string
  publishedAt: string | null
  views?: number | null
  likes?: number | null
  comments?: number | null
  shares?: number | null
  hashtags?: string[]
  mediaType?: string | null
  rawMetadata?: Record<string, unknown>
}

export interface TopicRow {
  topic: string
  count: number
  share: number
}

export interface CompetitorCaptureRunResult {
  runId: string
  status: 'completed' | 'partial' | 'failed'
  steps: CaptureStepResult[]
  contentCount: number
  videoCount: number
  websitePosts: number
  topicDistribution: Record<string, number>
  dataLimitations: string[]
  aiAnalysis?: Record<string, unknown>
}

export interface KdcBaselineMetrics {
  label: string
  contentPerWeek: number | null
  videoPerWeek: number | null
  sermonCount30d: number
  blogCount30d: number
  dmPostCount30d: number
  limitations: string[]
}

export interface StrategyComparisonRow {
  metric: string
  kdc: string
  competitors: Record<string, string>
}

export interface ContentGapItem {
  priority: 'high' | 'medium' | 'emerging'
  title: string
  description: string
  recommendation: string
  evidence: string
}

export interface ContentGapMatrixColumn {
  id: string
  label: string
  isKdc: boolean
}

export interface ContentGapMatrix {
  topics: string[]
  columns: ContentGapMatrixColumn[]
  /** rows = topics, cols = columns; values are raw content counts */
  cells: number[][]
  /** per-topic gap score: max peer share minus KDC share (0–100) */
  gapScores: number[]
  maxCount: number
  kdcTotal: number
}

export interface StrategyReportPayload {
  executiveSummary: string
  biggestCompetitorMovement: { name: string; detail: string } | null
  biggestKdcOpportunity: string
  recommendedActions: string[]
  comparisonMatrix: StrategyComparisonRow[]
  contentGaps: ContentGapItem[]
  contentGapMatrix?: ContentGapMatrix
  kdcStrengths: string[]
  kdcWeaknesses: string[]
  dataLimitations: string[]
  generatedAt: string
  reportId?: string
}

export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  church: 'Church',
  ministry: 'Ministry',
  christian_org: 'Christian organization',
  pastor: 'Pastor / Minister',
  media_ministry: 'Media ministry',
  ngo: 'NGO',
  other: 'Other',
}

export const CHURCH_TOPICS = [
  'Worship',
  'Evangelism',
  'Family',
  'Youth',
  'Prayer',
  'Testimonies',
  'Deliverance',
  'Leadership',
  'Bible teaching',
  'Outreach',
  'Marriage',
  'Healing',
] as const
