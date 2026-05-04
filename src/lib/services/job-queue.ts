/**
 * Job Queue Service
 * 
 * Manages sermon processing job lifecycle, enqueueing, status tracking, and deduplication.
 * Uses BullMQ with Redis for persistent, fault-tolerant job queue management.
 * 
 * Features:
 * - Job enqueueing with priority support
 * - Automatic deduplication (24-hour window)
 * - Job status tracking and progress updates
 * - Draft retrieval from Redis
 * - Job cancellation for waiting jobs
 */

import { Queue, Job } from 'bullmq'
import { createRedisConnection } from '../config/redis'
import { createSermonQueue, SERMON_QUEUE_NAME } from '../config/queue'
import type {
  SermonJobData,
  SermonJobResult,
  JobProgress,
  JobStatus,
  SermonDraft,
  JobInfo,
} from '../types/queue-processor'
import crypto from 'crypto'

export class JobQueueService {
  private queue: Queue<SermonJobData, SermonJobResult>
  private redis: ReturnType<typeof createRedisConnection>

  constructor() {
    this.redis = createRedisConnection()
    this.queue = createSermonQueue()
  }

  /**
   * Enqueue a new sermon processing job
   * Returns existing job ID if duplicate detected within 24 hours
   * 
   * @param userId - User ID submitting the job
   * @param videoUrl - Video URL to process
   * @param priority - Job priority (high, normal, low)
   * @returns Job ID (new or existing)
   */
  async enqueueJob(
    userId: string,
    videoUrl: string,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<string> {
    // Check for duplicate job
    const deduplicationKey = this.generateDeduplicationKey(videoUrl)
    const existingJobId = await this.redis.get(`dedup:${deduplicationKey}`)

    if (existingJobId) {
      const existingJob = await this.queue.getJob(existingJobId)
      if (existingJob) {
        const state = await existingJob.getState()
        // Return existing job unless it failed (allow retry)
        if (!['failed'].includes(state)) {
          return existingJobId
        }
      }
    }

    // Create new job
    const job = await this.queue.add(
      'process-sermon',
      {
        jobId: '', // Will be set by BullMQ
        userId,
        videoUrl,
        priority,
        createdAt: new Date().toISOString(),
      },
      {
        priority: priority === 'high' ? 1 : priority === 'normal' ? 5 : 10,
      }
    )

    // Store deduplication key with 24-hour TTL
    await this.redis.setex(
      `dedup:${deduplicationKey}`,
      24 * 60 * 60,
      job.id!
    )

    return job.id!
  }

  /**
   * Get current job status and progress
   * 
   * @param jobId - Job ID to query
   * @returns Job progress information or null if not found
   */
  async getJobStatus(jobId: string): Promise<JobProgress | null> {
    const job = await this.queue.getJob(jobId)
    if (!job) return null

    const state = await job.getState()
    const progress = job.progress as JobProgress | undefined

    return {
      status: state as JobStatus,
      percentage: progress?.percentage || 0,
      currentStep: progress?.currentStep || 'Waiting',
      estimatedTimeRemaining: progress?.estimatedTimeRemaining,
    }
  }

  /**
   * Get completed job draft from Redis
   * 
   * @param jobId - Job ID to fetch draft for
   * @returns Sermon draft or null if not found/expired
   */
  async getJobDraft(jobId: string): Promise<SermonDraft | null> {
    const draftJson = await this.redis.get(`draft:${jobId}`)
    if (!draftJson) return null
    return JSON.parse(draftJson)
  }

  /**
   * Cancel a waiting job
   * Only jobs in 'waiting' or 'delayed' state can be cancelled
   * 
   * @param jobId - Job ID to cancel
   * @returns True if cancelled, false if job cannot be cancelled
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const job = await this.queue.getJob(jobId)
    if (!job) return false

    const state = await job.getState()
    if (state === 'waiting' || state === 'delayed') {
      await job.remove()
      return true
    }

    return false
  }

  /**
   * Get all jobs for a user with optional status filter
   * Enforces RLS: users see only their jobs, admins see all jobs
   * Sorts by creation date (newest first)
   * 
   * @param userId - User ID to filter jobs
   * @param isAdmin - Whether user is admin (can see all jobs)
   * @param filter - Status filter (all, waiting, active, completed, failed)
   * @returns Array of JobInfo objects
   */
  async getUserJobs(
    userId: string,
    isAdmin: boolean,
    filter: 'all' | 'waiting' | 'active' | 'completed' | 'failed' = 'all'
  ): Promise<JobInfo[]> {
    const jobInfoList: JobInfo[] = []

    // Determine which job states to query based on filter
    const statesToQuery: Array<'waiting' | 'active' | 'completed' | 'failed' | 'delayed'> = []
    
    if (filter === 'all') {
      statesToQuery.push('waiting', 'delayed', 'active', 'completed', 'failed')
    } else if (filter === 'waiting') {
      statesToQuery.push('waiting', 'delayed')
    } else {
      statesToQuery.push(filter)
    }

    // Query jobs for each state
    for (const state of statesToQuery) {
      const jobs = await this.queue.getJobs(state, 0, 100) // Get up to 100 jobs per state
      
      for (const job of jobs) {
        // Filter by user ID (RLS enforcement)
        if (!isAdmin && job.data.userId !== userId) {
          continue
        }

        // Get job state and progress
        const jobState = await job.getState()
        const progress = job.progress as JobProgress | undefined

        // Extract error message if failed
        let errorMessage: string | undefined
        if (jobState === 'failed' && job.failedReason) {
          errorMessage = job.failedReason
        }

        jobInfoList.push({
          id: job.id!,
          videoUrl: job.data.videoUrl,
          status: jobState as JobStatus,
          progress: progress?.percentage || 0,
          createdAt: job.data.createdAt,
          completedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : undefined,
          errorMessage,
        })
      }
    }

    // Sort by creation date (newest first)
    jobInfoList.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return jobInfoList
  }

  /**
   * Generate deduplication key from video URL
   * Normalizes URL: removes query params (except video ID), lowercase, trim
   * 
   * @param videoUrl - Video URL to normalize
   * @returns SHA-256 hash of normalized URL
   */
  private generateDeduplicationKey(videoUrl: string): string {
    const normalized = this.normalizeVideoUrl(videoUrl)
    return crypto.createHash('sha256').update(normalized).digest('hex')
  }

  /**
   * Normalize video URL for consistent deduplication
   * - YouTube: Extract video ID only
   * - Other platforms: Use hostname + pathname
   * - Case-insensitive, trimmed
   * 
   * @param url - Video URL to normalize
   * @returns Normalized URL string
   */
  private normalizeVideoUrl(url: string): string {
    try {
      const parsed = new URL(url)

      // For YouTube, keep only the video ID
      if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) {
        const videoId = parsed.searchParams.get('v') || parsed.pathname.split('/').pop()
        return `youtube:${videoId}`.toLowerCase()
      }

      // For other platforms, use normalized hostname + pathname
      return `${parsed.hostname}${parsed.pathname}`.toLowerCase().trim()
    } catch {
      // If URL parsing fails, use the raw URL (normalized)
      return url.toLowerCase().trim()
    }
  }
}
