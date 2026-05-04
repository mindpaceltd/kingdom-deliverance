'use server'

/**
 * Sermon Queue Processor Server Actions
 * 
 * Server actions for managing sermon processing jobs in the queue system.
 * Provides functions for job submission, status tracking, draft retrieval, and cancellation.
 * 
 * Features:
 * - Role-based access control (admin and editor only)
 * - Rate limiting (10 jobs per hour per user)
 * - URL validation
 * - Job deduplication
 * - Real-time status tracking
 * 
 * Requirements: 1.2, 10.1, 15.1, 15.2
 */

import { JobQueueService } from '../services/job-queue'
import { requireRole } from './auth-helpers'
import { checkRateLimit } from '../services/rate-limiter'
import type { JobProgress, SermonDraft, JobInfo } from '../types/queue-processor'

const jobQueue = new JobQueueService()

/**
 * Process a sermon video URL by enqueueing it in the job queue
 * 
 * Steps:
 * 1. Verify user role (admin or editor only)
 * 2. Check rate limit (10 jobs per hour)
 * 3. Validate URL format (non-empty, trimmed)
 * 4. Enqueue job using JobQueueService
 * 
 * @param url - Video URL to process
 * @returns Success with job ID, or error message
 * 
 * Requirements: 1.2, 10.1, 15.1, 15.2
 */
export async function processSermonLink(url: string): Promise<{
  success?: boolean
  jobId?: string
  error?: string
}> {
  try {
    // Step 1: Verify user role (admin or editor only)
    const authResult = await requireRole('editor')
    
    if ('error' in authResult) {
      if (authResult.error === 'Unauthenticated') {
        return { error: 'You must be logged in to process videos' }
      }
      return { error: 'You do not have permission to process videos' }
    }
    
    const { userId } = authResult
    
    // Step 2: Check rate limit (10 jobs per hour)
    const canProcess = await checkRateLimit(userId, 10)
    if (!canProcess) {
      return {
        error: 'Rate limit exceeded. You can submit 10 videos per hour. Try again later.',
      }
    }
    
    // Step 3: Validate URL format (non-empty, trimmed)
    if (!url || !url.trim()) {
      return { error: 'Please provide a valid video URL' }
    }
    
    // Step 4: Enqueue job using JobQueueService
    // Returns existing job ID if duplicate detected within 24 hours
    const jobId = await jobQueue.enqueueJob(userId, url.trim())
    
    return {
      success: true,
      jobId,
    }
  } catch (error) {
    console.error('[processSermonLink]', error)
    return {
      error: 'Failed to start processing. Please try again.',
    }
  }
}

/**
 * Get the current status and progress of a job
 * 
 * @param jobId - Job ID to query
 * @returns Job progress information or error message
 */
export async function getJobStatus(jobId: string): Promise<{
  success?: boolean
  status?: JobProgress
  error?: string
}> {
  try {
    const status = await jobQueue.getJobStatus(jobId)
    
    if (!status) {
      return { error: 'Job not found' }
    }
    
    return {
      success: true,
      status,
    }
  } catch (error) {
    console.error('[getJobStatus]', error)
    return {
      error: 'Failed to fetch job status',
    }
  }
}

/**
 * Get the completed draft for a job
 * 
 * @param jobId - Job ID to fetch draft for
 * @returns Sermon draft or error message
 */
export async function getJobDraft(jobId: string): Promise<{
  success?: boolean
  draft?: SermonDraft
  error?: string
}> {
  try {
    const draft = await jobQueue.getJobDraft(jobId)
    
    if (!draft) {
      return { error: 'Draft not found or expired' }
    }
    
    return {
      success: true,
      draft,
    }
  } catch (error) {
    console.error('[getJobDraft]', error)
    return {
      error: 'Failed to fetch draft',
    }
  }
}

/**
 * Cancel a waiting job
 * Only jobs in 'waiting' or 'delayed' state can be cancelled
 * 
 * @param jobId - Job ID to cancel
 * @returns Success or error message
 */
export async function cancelJob(jobId: string): Promise<{
  success?: boolean
  error?: string
}> {
  try {
    const cancelled = await jobQueue.cancelJob(jobId)
    
    if (!cancelled) {
      return { error: 'Job cannot be cancelled (already processing or completed)' }
    }
    
    return { success: true }
  } catch (error) {
    console.error('[cancelJob]', error)
    return {
      error: 'Failed to cancel job',
    }
  }
}

/**
 * Get all jobs for the current user with optional status filter
 * Enforces RLS: users see only their jobs, admins see all jobs
 * 
 * @param filter - Status filter (all, waiting, active, completed, failed)
 * @returns List of JobInfo objects or error message
 * 
 * Requirements: 12.1, 12.3, 12.4, 15.7
 */
export async function getUserJobs(
  filter: 'all' | 'waiting' | 'active' | 'completed' | 'failed' = 'all'
): Promise<{
  success?: boolean
  jobs?: JobInfo[]
  error?: string
}> {
  try {
    // Verify user authentication
    const authResult = await requireRole('editor')
    
    if ('error' in authResult) {
      if (authResult.error === 'Unauthenticated') {
        return { error: 'You must be logged in to view jobs' }
      }
      return { error: 'You do not have permission to view jobs' }
    }
    
    const { userId, role } = authResult
    
    // Get jobs from queue service
    const jobs = await jobQueue.getUserJobs(userId, role === 'admin', filter)
    
    return {
      success: true,
      jobs,
    }
  } catch (error) {
    console.error('[getUserJobs]', error)
    return {
      error: 'Failed to fetch jobs',
    }
  }
}
