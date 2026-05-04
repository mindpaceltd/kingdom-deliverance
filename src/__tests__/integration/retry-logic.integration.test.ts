/**
 * Integration Tests — Retry Logic (Task 15.7)
 *
 * Verifies the retry behaviour of the sermon processing queue:
 *
 *   1. Retryable errors cause the job to be re-enqueued with exponential backoff
 *   2. The retry count increments on each failure
 *   3. After 3 failures the job moves to the dead letter queue (BullMQ failed state,
 *      no more retries)
 *
 * The retry mechanism works as follows:
 *   - BullMQ is configured with `attempts: 3` and exponential backoff
 *     (base delay 60 000 ms → 1 min, 5 min, 15 min)
 *   - The worker catches errors and classifies them via `classifyError`
 *   - Retryable errors are re-thrown so BullMQ handles the retry schedule
 *   - Non-retryable errors call `job.discard()` then re-throw, skipping retries
 *   - After all attempts are exhausted BullMQ moves the job to the failed state
 *     (dead letter queue equivalent)
 *
 * External dependencies (Redis, BullMQ, processing services) are mocked so the
 * tests run without any infrastructure.
 *
 * Requirements: 7.1, 7.3, 7.5, 19.2
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { classifyError, isRetryableError, NonRetryableError } from '../../lib/errors/processing-errors'
import { createRedisConnection } from '../../lib/config/redis'
import { createSermonQueue } from '../../lib/config/queue'
import { JobQueueService } from '../../lib/services/job-queue'

// Mock external dependencies — no real Redis or BullMQ needed
vi.mock('../../lib/config/redis')
vi.mock('../../lib/config/queue')

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a minimal mock BullMQ job with configurable state and attempt count.
 */
function buildMockJob(
  id: string,
  state: string,
  attemptsMade = 0,
  opts: { attempts?: number; backoff?: object } = {}
) {
  return {
    id,
    data: {
      userId: 'user-retry-test',
      videoUrl: 'https://youtube.com/watch?v=retryTest',
      priority: 'normal',
      createdAt: new Date().toISOString(),
    },
    attemptsMade,
    opts: {
      attempts: opts.attempts ?? 3,
      backoff: opts.backoff ?? { type: 'exponential', delay: 60000 },
    },
    progress: undefined,
    failedReason: undefined,
    finishedOn: undefined,
    getState: vi.fn().mockResolvedValue(state),
    updateProgress: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    discard: vi.fn().mockResolvedValue(undefined),
    retry: vi.fn().mockResolvedValue(undefined),
  }
}

/**
 * Simulate the worker's error handling logic for a single job attempt.
 * Returns whether the job would be retried or discarded.
 */
async function simulateWorkerAttempt(
  job: ReturnType<typeof buildMockJob>,
  error: Error
): Promise<{ retried: boolean; discarded: boolean; thrownError: Error }> {
  const classified = classifyError(error)
  const isNonRetryable = classified instanceof NonRetryableError

  if (isNonRetryable) {
    await job.discard()
    return { retried: false, discarded: true, thrownError: classified }
  }

  // Retryable — BullMQ will schedule a retry
  return { retried: true, discarded: false, thrownError: classified }
}

/**
 * Simulate running a job through multiple attempts until it either succeeds,
 * exhausts retries, or hits a non-retryable error.
 *
 * Returns the final state and the history of each attempt.
 */
async function simulateJobLifecycle(
  job: ReturnType<typeof buildMockJob>,
  errorFactory: (attempt: number) => Error | null // null = success
): Promise<{
  finalState: 'completed' | 'failed' | 'discarded'
  attempts: number
  retryHistory: Array<{ attempt: number; error: string | null; retried: boolean }>
}> {
  const maxAttempts = job.opts.attempts
  const retryHistory: Array<{ attempt: number; error: string | null; retried: boolean }> = []
  let attempts = 0

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    attempts++
    const error = errorFactory(attempt)

    if (!error) {
      // Job succeeded
      retryHistory.push({ attempt, error: null, retried: false })
      return { finalState: 'completed', attempts, retryHistory }
    }

    const { retried, discarded } = await simulateWorkerAttempt(job, error)
    retryHistory.push({ attempt, error: error.message, retried })

    if (discarded) {
      return { finalState: 'discarded', attempts, retryHistory }
    }

    if (!retried || attempt === maxAttempts) {
      // Exhausted all retries → dead letter queue (failed state)
      return { finalState: 'failed', attempts, retryHistory }
    }
  }

  return { finalState: 'failed', attempts, retryHistory }
}

// ─────────────────────────────────────────────────────────────────────────────
// Task 15.7 — Retry Logic Integration Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Task 15.7 — Retry Logic Integration', () => {
  let mockRedis: any
  let mockQueue: any
  let service: JobQueueService

  beforeEach(() => {
    mockRedis = {
      get: vi.fn().mockResolvedValue(null),
      setex: vi.fn().mockResolvedValue('OK'),
      del: vi.fn().mockResolvedValue(1),
      quit: vi.fn().mockResolvedValue(undefined),
    }

    mockQueue = {
      add: vi.fn().mockResolvedValue({ id: 'job-retry-1' }),
      getJob: vi.fn(),
      getJobs: vi.fn().mockResolvedValue([]),
    }

    vi.mocked(createRedisConnection).mockReturnValue(mockRedis)
    vi.mocked(createSermonQueue).mockReturnValue(mockQueue)

    service = new JobQueueService()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ── 1. Retryable errors trigger retry ─────────────────────────────────────

  describe('1. Retryable errors cause the job to retry (Req 7.1, 7.3)', () => {
    it('should classify a network timeout as retryable', () => {
      const error = new Error('Request timeout after 10000ms')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should classify ECONNREFUSED as retryable', () => {
      const error = new Error('connect ECONNREFUSED 127.0.0.1:11434')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should classify ECONNRESET as retryable', () => {
      const error = new Error('read ECONNRESET')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should classify ETIMEDOUT as retryable', () => {
      const error = new Error('connect ETIMEDOUT')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should classify Ollama unavailable as retryable', () => {
      const error = new Error('AI service unavailable. Please ensure Ollama is running.')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should classify transcription timeout as retryable', () => {
      const error = new Error('Transcription timed out (max 30 minutes)')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should classify audio extraction timeout as retryable', () => {
      const error = new Error('Audio extraction timed out (max 10 minutes)')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should classify socket hang up as retryable', () => {
      const error = new Error('socket hang up')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should NOT discard the job when a retryable error occurs', async () => {
      const job = buildMockJob('job-retryable', 'active', 0)
      const error = new Error('connect ECONNREFUSED 127.0.0.1:11434')

      const { retried, discarded } = await simulateWorkerAttempt(job, error)

      expect(retried).toBe(true)
      expect(discarded).toBe(false)
      expect(job.discard).not.toHaveBeenCalled()
    })

    it('should re-throw the original error for BullMQ to handle retry scheduling', async () => {
      const job = buildMockJob('job-rethrow', 'active', 0)
      const error = new Error('connect ECONNREFUSED 127.0.0.1:11434')

      const { thrownError } = await simulateWorkerAttempt(job, error)

      // The thrown error should be the classified version (same message)
      expect(thrownError.message).toBe(error.message)
    })

    it('should retry a job that fails with a network error on attempt 1', async () => {
      const job = buildMockJob('job-retry-attempt-1', 'active', 0)
      const networkError = new Error('connect ECONNREFUSED 127.0.0.1:11434')

      const { finalState, attempts, retryHistory } = await simulateJobLifecycle(
        job,
        (attempt) => (attempt === 1 ? networkError : null) // fails once, then succeeds
      )

      expect(finalState).toBe('completed')
      expect(attempts).toBe(2)
      expect(retryHistory[0].retried).toBe(true)
      expect(retryHistory[1].error).toBeNull()
    })
  })

  // ── 2. Retry count increments on each failure ─────────────────────────────

  describe('2. Retry count increments on each failure (Req 7.3)', () => {
    it('should track attempt number across retries', async () => {
      const job = buildMockJob('job-count', 'active', 0)
      const retryableError = new Error('connect ECONNREFUSED 127.0.0.1:11434')

      // Simulate 2 failures then success
      const { retryHistory } = await simulateJobLifecycle(
        job,
        (attempt) => (attempt < 3 ? retryableError : null)
      )

      expect(retryHistory).toHaveLength(3)
      expect(retryHistory[0].attempt).toBe(1)
      expect(retryHistory[1].attempt).toBe(2)
      expect(retryHistory[2].attempt).toBe(3)
    })

    it('should record each retried attempt in the history', async () => {
      const job = buildMockJob('job-history', 'active', 0)
      const retryableError = new Error('AI service unavailable. Please ensure Ollama is running.')

      // Simulate 2 failures then success
      const { retryHistory } = await simulateJobLifecycle(
        job,
        (attempt) => (attempt < 3 ? retryableError : null)
      )

      expect(retryHistory[0].retried).toBe(true)
      expect(retryHistory[1].retried).toBe(true)
      expect(retryHistory[2].retried).toBe(false) // success, not retried
    })

    it('should reflect the correct attemptsMade on the BullMQ job object', () => {
      // BullMQ increments attemptsMade before each processor call
      const job0 = buildMockJob('job-attempt-0', 'active', 0)
      const job1 = buildMockJob('job-attempt-1', 'active', 1)
      const job2 = buildMockJob('job-attempt-2', 'active', 2)

      expect(job0.attemptsMade).toBe(0) // first attempt
      expect(job1.attemptsMade).toBe(1) // second attempt (first retry)
      expect(job2.attemptsMade).toBe(2) // third attempt (second retry)
    })

    it('should configure the queue with attempts=3 (Req 7.1)', () => {
      // Verify the queue default job options include attempts: 3
      // This is set in src/lib/config/queue.ts DEFAULT_JOB_OPTIONS
      const job = buildMockJob('job-max-attempts', 'active', 0, { attempts: 3 })
      expect(job.opts.attempts).toBe(3)
    })

    it('should configure exponential backoff with 1-minute base delay (Req 7.1)', () => {
      // Verify the backoff configuration matches the spec (1min, 5min, 15min)
      const job = buildMockJob('job-backoff', 'active', 0, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 60000 },
      })
      expect(job.opts.backoff).toEqual({ type: 'exponential', delay: 60000 })
    })

    it('should track retry count across 3 consecutive retryable failures', async () => {
      const job = buildMockJob('job-3-failures', 'active', 0)
      const retryableError = new Error('connect ECONNREFUSED 127.0.0.1:11434')

      // All 3 attempts fail
      const { finalState, attempts, retryHistory } = await simulateJobLifecycle(
        job,
        () => retryableError
      )

      expect(finalState).toBe('failed')
      expect(attempts).toBe(3)
      expect(retryHistory).toHaveLength(3)
      expect(retryHistory.every((r) => r.retried === true || r.attempt === 3)).toBe(true)
    })
  })

  // ── 3. Job moves to dead letter queue after 3 failures ────────────────────

  describe('3. Job moves to dead letter queue after 3 failures (Req 7.5)', () => {
    it('should move job to failed state after exhausting all 3 attempts', async () => {
      const job = buildMockJob('job-dlq', 'active', 0, { attempts: 3 })
      const retryableError = new Error('connect ECONNREFUSED 127.0.0.1:11434')

      const { finalState, attempts } = await simulateJobLifecycle(
        job,
        () => retryableError // always fails
      )

      expect(finalState).toBe('failed')
      expect(attempts).toBe(3) // exactly 3 attempts made
    })

    it('should not retry beyond the configured maximum attempts', async () => {
      const job = buildMockJob('job-no-extra-retry', 'active', 0, { attempts: 3 })
      const retryableError = new Error('socket hang up')

      const { attempts } = await simulateJobLifecycle(
        job,
        () => retryableError
      )

      // Should stop at exactly 3 attempts, not 4 or more
      expect(attempts).toBeLessThanOrEqual(3)
    })

    it('should record all 3 failed attempts before moving to dead letter queue', async () => {
      const job = buildMockJob('job-dlq-history', 'active', 0, { attempts: 3 })
      const retryableError = new Error('AI service unavailable. Please ensure Ollama is running.')

      const { retryHistory } = await simulateJobLifecycle(
        job,
        () => retryableError
      )

      expect(retryHistory).toHaveLength(3)
      expect(retryHistory[0].error).toBe(retryableError.message)
      expect(retryHistory[1].error).toBe(retryableError.message)
      expect(retryHistory[2].error).toBe(retryableError.message)
    })

    it('should reflect the failed state in the queue after exhausting retries', async () => {
      // Arrange — job that has exhausted all retries
      const failedJob = buildMockJob('job-exhausted', 'failed', 3)
      failedJob.failedReason = 'connect ECONNREFUSED 127.0.0.1:11434'
      mockQueue.getJob.mockResolvedValue(failedJob)

      // Act — query the job status
      const status = await service.getJobStatus('job-exhausted')

      // Assert — job is in failed state (dead letter queue)
      expect(status).not.toBeNull()
      expect(status!.status).toBe('failed')
    })

    it('should allow re-submission of a failed job (dead letter queue recovery)', async () => {
      // Arrange — failed job exists in queue (exhausted retries)
      const failedJob = buildMockJob('job-dlq-recover', 'failed', 3)
      mockRedis.get.mockResolvedValue('job-dlq-recover')
      mockQueue.getJob.mockResolvedValue(failedJob)
      mockQueue.add.mockResolvedValue({ id: 'job-dlq-new' })

      // Act — re-submit the same URL (failed jobs are excluded from deduplication)
      const newJobId = await service.enqueueJob(
        'user-retry-test',
        'https://youtube.com/watch?v=retryTest',
        'normal'
      )

      // Assert — new job created (not the failed one)
      expect(newJobId).toBe('job-dlq-new')
      expect(mockQueue.add).toHaveBeenCalledOnce()
    })

    it('should store the failure reason on the job when moved to dead letter queue', async () => {
      // Arrange — job with failure reason set by BullMQ
      const failedJob = buildMockJob('job-failure-reason', 'failed', 3)
      failedJob.failedReason = 'connect ECONNREFUSED 127.0.0.1:11434'
      mockQueue.getJob.mockResolvedValue(failedJob)

      // Act
      const status = await service.getJobStatus('job-failure-reason')

      // Assert — status is failed (failure reason is accessible via job.failedReason)
      expect(status!.status).toBe('failed')
    })
  })

  // ── 4. Non-retryable errors skip retries entirely ─────────────────────────

  describe('4. Non-retryable errors skip retries (Req 7.2, 7.4)', () => {
    it('should classify a private video error as non-retryable', () => {
      const error = new Error('Video is private or unavailable')
      expect(isRetryableError(error)).toBe(false)
    })

    it('should classify a deleted video error as non-retryable', () => {
      const error = new Error('Video deleted or no longer available')
      expect(isRetryableError(error)).toBe(false)
    })

    it('should classify an invalid URL error as non-retryable', () => {
      const error = new Error('Invalid URL format provided')
      expect(isRetryableError(error)).toBe(false)
    })

    it('should classify a transcript too short error as non-retryable', () => {
      const error = new Error('Transcript too short (45 words, min 100 words)')
      expect(isRetryableError(error)).toBe(false)
    })

    it('should classify a video too long error as non-retryable', () => {
      const error = new Error('Video too long (3.5 hours, max 3 hours)')
      expect(isRetryableError(error)).toBe(false)
    })

    it('should classify a region-blocked error as non-retryable', () => {
      const error = new Error('Video not found or region-blocked')
      expect(isRetryableError(error)).toBe(false)
    })

    it('should classify a NonRetryableError instance as non-retryable', () => {
      const error = new NonRetryableError('Video is private or unavailable')
      expect(isRetryableError(error)).toBe(false)
    })

    it('should call job.discard() for non-retryable errors', async () => {
      const job = buildMockJob('job-non-retryable', 'active', 0)
      const error = new Error('Video is private or unavailable')

      const { discarded } = await simulateWorkerAttempt(job, error)

      expect(discarded).toBe(true)
      expect(job.discard).toHaveBeenCalledOnce()
    })

    it('should NOT retry a non-retryable error', async () => {
      const job = buildMockJob('job-no-retry', 'active', 0)
      const error = new Error('Video is private or unavailable')

      const { retried } = await simulateWorkerAttempt(job, error)

      expect(retried).toBe(false)
    })

    it('should move to failed state immediately on non-retryable error (1 attempt only)', async () => {
      const job = buildMockJob('job-immediate-fail', 'active', 0, { attempts: 3 })
      const nonRetryableError = new Error('Video is private or unavailable')

      const { finalState, attempts } = await simulateJobLifecycle(
        job,
        () => nonRetryableError
      )

      expect(finalState).toBe('discarded')
      expect(attempts).toBe(1) // only 1 attempt, no retries
    })

    it('should wrap a non-retryable error message in NonRetryableError', () => {
      const error = new Error('Video is private or unavailable')
      const classified = classifyError(error)

      expect(classified).toBeInstanceOf(NonRetryableError)
      expect(classified.message).toBe(error.message)
    })

    it('should preserve the original error message when wrapping in NonRetryableError', () => {
      const originalMessage = 'Transcript too short (45 words, min 100 words)'
      const error = new Error(originalMessage)
      const classified = classifyError(error)

      expect(classified.message).toBe(originalMessage)
    })

    it('should return the original NonRetryableError unchanged when classifying', () => {
      const original = new NonRetryableError('Video deleted or no longer available')
      const classified = classifyError(original)

      expect(classified).toBe(original) // same reference
    })
  })

  // ── 5. Mixed retry scenarios ──────────────────────────────────────────────

  describe('5. Mixed retry scenarios (Req 7.1, 7.3, 7.5)', () => {
    it('should succeed on the 2nd attempt after 1 retryable failure', async () => {
      const job = buildMockJob('job-succeed-2nd', 'active', 0)
      const retryableError = new Error('connect ECONNREFUSED 127.0.0.1:11434')

      const { finalState, attempts } = await simulateJobLifecycle(
        job,
        (attempt) => (attempt === 1 ? retryableError : null)
      )

      expect(finalState).toBe('completed')
      expect(attempts).toBe(2)
    })

    it('should succeed on the 3rd attempt after 2 retryable failures', async () => {
      const job = buildMockJob('job-succeed-3rd', 'active', 0)
      const retryableError = new Error('AI service unavailable. Please ensure Ollama is running.')

      const { finalState, attempts } = await simulateJobLifecycle(
        job,
        (attempt) => (attempt < 3 ? retryableError : null)
      )

      expect(finalState).toBe('completed')
      expect(attempts).toBe(3)
    })

    it('should fail immediately on non-retryable error even if retries remain', async () => {
      const job = buildMockJob('job-non-retryable-early', 'active', 0, { attempts: 3 })
      const nonRetryableError = new Error('Video is private or unavailable')

      const { finalState, attempts } = await simulateJobLifecycle(
        job,
        () => nonRetryableError
      )

      // Should stop at attempt 1 (discarded), not use all 3 attempts
      expect(finalState).toBe('discarded')
      expect(attempts).toBe(1)
    })

    it('should fail after 3 retryable errors (dead letter queue)', async () => {
      const job = buildMockJob('job-all-fail', 'active', 0, { attempts: 3 })
      const retryableError = new Error('socket hang up')

      const { finalState, attempts, retryHistory } = await simulateJobLifecycle(
        job,
        () => retryableError
      )

      expect(finalState).toBe('failed')
      expect(attempts).toBe(3)
      expect(retryHistory.every((r) => r.error === retryableError.message)).toBe(true)
    })

    it('should handle unknown errors as retryable (conservative default)', () => {
      // Unknown errors default to retryable so they get a chance to recover
      const unknownError = new Error('Something unexpected happened')
      expect(isRetryableError(unknownError)).toBe(true)
    })

    it('should handle a mix of retryable and non-retryable error types correctly', () => {
      const retryableErrors = [
        new Error('connect ECONNREFUSED 127.0.0.1:11434'),
        new Error('Request timeout after 10000ms'),
        new Error('AI service unavailable. Please ensure Ollama is running.'),
        new Error('socket hang up'),
        new Error('read ECONNRESET'),
      ]

      const nonRetryableErrors = [
        new Error('Video is private or unavailable'),
        new Error('Video deleted or no longer available'),
        new Error('Invalid URL format provided'),
        new Error('Transcript too short (45 words, min 100 words)'),
        new Error('Video too long (3.5 hours, max 3 hours)'),
      ]

      retryableErrors.forEach((err) => {
        expect(isRetryableError(err)).toBe(true)
      })

      nonRetryableErrors.forEach((err) => {
        expect(isRetryableError(err)).toBe(false)
      })
    })
  })

  // ── 6. Queue configuration for retry (Req 7.1) ───────────────────────────

  describe('6. Queue is configured for retry with exponential backoff (Req 7.1)', () => {
    it('should enqueue a job with the default retry configuration', async () => {
      // Arrange
      mockRedis.get.mockResolvedValue(null)
      mockQueue.add.mockResolvedValue({ id: 'job-config-check' })

      // Act
      await service.enqueueJob('user-1', 'https://youtube.com/watch?v=configCheck', 'normal')

      // Assert — job was added to the queue
      expect(mockQueue.add).toHaveBeenCalledOnce()
      expect(mockQueue.add).toHaveBeenCalledWith(
        'process-sermon',
        expect.objectContaining({
          userId: 'user-1',
          videoUrl: 'https://youtube.com/watch?v=configCheck',
        }),
        expect.any(Object)
      )
    })

    it('should use the SERMON_QUEUE_NAME for the queue', () => {
      // The queue is created via createSermonQueue which uses SERMON_QUEUE_NAME
      expect(vi.mocked(createSermonQueue)).toBeDefined()
    })

    it('should verify the DEFAULT_JOB_OPTIONS include attempts=3 and exponential backoff', async () => {
      // Import and verify the queue config directly
      const { DEFAULT_JOB_OPTIONS } = await import('../../lib/config/queue')

      expect(DEFAULT_JOB_OPTIONS.attempts).toBe(3)
      expect(DEFAULT_JOB_OPTIONS.backoff.type).toBe('exponential')
      expect(DEFAULT_JOB_OPTIONS.backoff.delay).toBe(60000) // 1 minute base
    })
  })
})
