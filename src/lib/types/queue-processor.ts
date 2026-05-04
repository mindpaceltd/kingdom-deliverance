// ============================================
// Sermon Queue Processor Types
// ============================================

/**
 * Job data stored in BullMQ queue
 * Contains all information needed to process a sermon video
 */
export interface SermonJobData {
  jobId: string
  userId: string
  videoUrl: string
  priority: 'high' | 'normal' | 'low'
  createdAt: string
}

/**
 * Result returned when a job completes successfully
 * Contains the generated draft and processing metrics
 */
export interface SermonJobResult {
  draft: SermonDraft
  processingDuration: number
}

/**
 * Real-time progress information for a job
 * Used to update UI with current processing status
 */
export interface JobProgress {
  status: JobStatus
  percentage: number
  currentStep: string
  estimatedTimeRemaining?: number
}

/**
 * All possible states a job can be in during its lifecycle
 * Tracks progression through the processing pipeline
 */
export type JobStatus =
  | 'waiting'
  | 'active'
  | 'extracting_audio'
  | 'transcribing'
  | 'summarizing'
  | 'generating_seo'
  | 'completed'
  | 'failed'
  | 'stalled'

/**
 * Job information displayed in the dashboard
 * Includes metadata and current status for user visibility
 */
export interface JobInfo {
  id: string
  videoUrl: string
  status: JobStatus
  progress: number
  createdAt: string
  completedAt?: string
  errorMessage?: string
}

/**
 * AI-generated sermon content before user review
 * Used to populate the draft review modal
 * Note: This extends the existing SermonDraft type from types.ts
 */
export interface SermonDraft {
  title: string
  description: string
  content: string
  keywords: string[]
  video_url: string
  transcript: string
}
