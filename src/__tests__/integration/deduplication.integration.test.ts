/**
 * Integration Tests — Deduplication Logic (Task 15.5)
 *
 * Verifies the deduplication behaviour of the JobQueueService:
 *   1. Submitting the same URL twice within 24 hours returns the same job ID
 *   2. Submitting different URLs returns different job IDs
 *   3. Deduplication key expires after 24 hours, allowing a new job
 *
 * The deduplication mechanism works as follows:
 *   - A SHA-256 hash of the normalised URL is computed
 *   - The hash is stored in Redis as `dedup:{hash}` with a 24-hour TTL
 *   - On each enqueue, Redis is checked for an existing key
 *   - If found and the job is not failed, the existing job ID is returned
 *   - If the key has expired (TTL elapsed) Redis returns null → new job created
 *
 * External dependencies (Redis, BullMQ) are mocked so the tests run without
 * any infrastructure.
 *
 * Requirements: 9.2, 9.3, 9.5, 19.2
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { JobQueueService } from '../../lib/services/job-queue'
import { createRedisConnection } from '../../lib/config/redis'
import { createSermonQueue } from '../../lib/config/queue'

// Mock external dependencies — no real Redis or BullMQ needed
vi.mock('../../lib/config/redis')
vi.mock('../../lib/config/queue')

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Build a minimal mock BullMQ job */
function buildMockJob(id: string, state: string) {
  return {
    id,
    data: {
      userId: 'user-1',
      videoUrl: 'https://youtube.com/watch?v=test',
      priority: 'normal',
      createdAt: new Date().toISOString(),
    },
    progress: undefined,
    failedReason: undefined,
    finishedOn: undefined,
    getState: vi.fn().mockResolvedValue(state),
    updateProgress: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Task 15.5 — Deduplication Logic Integration Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Task 15.5 — Deduplication Logic Integration', () => {
  let service: JobQueueService
  let mockRedis: any
  let mockQueue: any

  beforeEach(() => {
    mockRedis = {
      get: vi.fn().mockResolvedValue(null),
      setex: vi.fn().mockResolvedValue('OK'),
      del: vi.fn().mockResolvedValue(1),
      quit: vi.fn().mockResolvedValue(undefined),
    }

    mockQueue = {
      add: vi.fn(),
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

  // ── 1. Same URL submitted twice → same job ID ─────────────────────────────

  describe('1. Same URL submitted twice returns same job ID (Req 9.2)', () => {
    it('should return the same job ID when the same URL is submitted twice within 24 hours', async () => {
      // Arrange — first submission: no existing dedup key
      mockRedis.get.mockResolvedValueOnce(null)
      mockQueue.add.mockResolvedValue({ id: 'job-original-1' })

      const url = 'https://youtube.com/watch?v=sameVideo'

      // Act — first submission
      const firstJobId = await service.enqueueJob('user-1', url, 'normal')

      // Arrange — second submission: dedup key exists in Redis (within 24h TTL)
      mockRedis.get.mockResolvedValueOnce('job-original-1')
      mockQueue.getJob.mockResolvedValue(buildMockJob('job-original-1', 'waiting'))

      // Act — second submission with identical URL
      const secondJobId = await service.enqueueJob('user-1', url, 'normal')

      // Assert — same job ID returned, no new job created
      expect(firstJobId).toBe('job-original-1')
      expect(secondJobId).toBe('job-original-1')
      expect(mockQueue.add).toHaveBeenCalledOnce() // only one job created
    })

    it('should return same job ID when duplicate is submitted by a different user (Req 9.2)', async () => {
      // Deduplication is URL-based, not user-based
      const url = 'https://youtube.com/watch?v=sharedVideo'

      // Arrange — first submission by user-1
      mockRedis.get.mockResolvedValueOnce(null)
      mockQueue.add.mockResolvedValue({ id: 'job-shared-1' })
      await service.enqueueJob('user-1', url, 'normal')

      // Arrange — second submission by user-2 (same URL, within 24h)
      mockRedis.get.mockResolvedValueOnce('job-shared-1')
      mockQueue.getJob.mockResolvedValue(buildMockJob('job-shared-1', 'active'))

      // Act
      const secondJobId = await service.enqueueJob('user-2', url, 'normal')

      // Assert — same job ID returned regardless of user
      expect(secondJobId).toBe('job-shared-1')
      expect(mockQueue.add).toHaveBeenCalledOnce()
    })

    it('should return same job ID when duplicate is in active state (Req 9.2)', async () => {
      // Arrange — existing job is actively being processed
      mockRedis.get.mockResolvedValue('job-active-1')
      mockQueue.getJob.mockResolvedValue(buildMockJob('job-active-1', 'active'))

      // Act
      const jobId = await service.enqueueJob('user-1', 'https://youtube.com/watch?v=activeVideo', 'normal')

      // Assert — existing active job returned, no new job created
      expect(jobId).toBe('job-active-1')
      expect(mockQueue.add).not.toHaveBeenCalled()
    })

    it('should return same job ID when duplicate is in completed state (Req 9.2)', async () => {
      // Arrange — existing job has already completed (within 24h)
      mockRedis.get.mockResolvedValue('job-completed-1')
      mockQueue.getJob.mockResolvedValue(buildMockJob('job-completed-1', 'completed'))

      // Act
      const jobId = await service.enqueueJob('user-1', 'https://youtube.com/watch?v=completedVideo', 'normal')

      // Assert — existing completed job returned (idempotent)
      expect(jobId).toBe('job-completed-1')
      expect(mockQueue.add).not.toHaveBeenCalled()
    })

    it('should return same job ID for YouTube URL variations of the same video (Req 9.2, 9.6)', async () => {
      // URL normalization ensures these all map to the same dedup key
      const canonicalUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      const variantWithExtra = 'https://youtube.com/watch?v=dQw4w9WgXcQ&feature=share&t=30'

      // Arrange — first submission with canonical URL
      mockRedis.get.mockResolvedValueOnce(null)
      mockQueue.add.mockResolvedValue({ id: 'job-yt-dedup' })
      await service.enqueueJob('user-1', canonicalUrl, 'normal')

      // Capture the dedup key that was stored
      const storedDedupKey = mockRedis.setex.mock.calls[0][0]

      // Arrange — second submission with variant URL (same video ID)
      mockRedis.get.mockResolvedValueOnce('job-yt-dedup')
      mockQueue.getJob.mockResolvedValue(buildMockJob('job-yt-dedup', 'waiting'))

      // Act
      const secondJobId = await service.enqueueJob('user-1', variantWithExtra, 'normal')

      // Assert — same job returned; dedup key is a SHA-256 hex string
      expect(secondJobId).toBe('job-yt-dedup')
      expect(storedDedupKey).toMatch(/^dedup:[a-f0-9]{64}$/)
      expect(mockQueue.add).toHaveBeenCalledOnce()
    })

    it('should store dedup key in Redis with 24-hour TTL on first submission (Req 9.5)', async () => {
      // Arrange
      mockRedis.get.mockResolvedValue(null)
      mockQueue.add.mockResolvedValue({ id: 'job-ttl-check' })

      // Act
      await service.enqueueJob('user-1', 'https://youtube.com/watch?v=ttlCheck', 'normal')

      // Assert — dedup key stored with exactly 24h TTL (86400 seconds)
      expect(mockRedis.setex).toHaveBeenCalledWith(
        expect.stringMatching(/^dedup:[a-f0-9]{64}$/),
        24 * 60 * 60, // 86400 seconds
        'job-ttl-check'
      )
    })

    it('should generate consistent dedup keys for the same URL across multiple calls (Req 9.1)', async () => {
      // Arrange — two separate enqueue calls with same URL (both with no existing dedup)
      const url = 'https://youtube.com/watch?v=consistentKey'

      mockRedis.get.mockResolvedValue(null)
      mockQueue.add
        .mockResolvedValueOnce({ id: 'job-consistent-1' })
        .mockResolvedValueOnce({ id: 'job-consistent-2' })

      // Act — first call
      await service.enqueueJob('user-1', url, 'normal')
      const key1 = mockRedis.setex.mock.calls[0][0]

      // Act — second call (simulating expired dedup key)
      await service.enqueueJob('user-1', url, 'normal')
      const key2 = mockRedis.setex.mock.calls[1][0]

      // Assert — same dedup key generated both times (deterministic hashing)
      expect(key1).toBe(key2)
      expect(key1).toMatch(/^dedup:[a-f0-9]{64}$/)
    })
  })

  // ── 2. Different URLs → different job IDs ─────────────────────────────────

  describe('2. Different URLs return different job IDs (Req 9.3)', () => {
    it('should return different job IDs for two different YouTube videos', async () => {
      // Arrange — no existing dedup keys
      mockRedis.get.mockResolvedValue(null)
      mockQueue.add
        .mockResolvedValueOnce({ id: 'job-video-1' })
        .mockResolvedValueOnce({ id: 'job-video-2' })

      // Act
      const jobId1 = await service.enqueueJob('user-1', 'https://youtube.com/watch?v=video1', 'normal')
      const jobId2 = await service.enqueueJob('user-1', 'https://youtube.com/watch?v=video2', 'normal')

      // Assert — distinct job IDs, two separate queue entries
      expect(jobId1).toBe('job-video-1')
      expect(jobId2).toBe('job-video-2')
      expect(jobId1).not.toBe(jobId2)
      expect(mockQueue.add).toHaveBeenCalledTimes(2)
    })

    it('should return different job IDs for videos from different platforms', async () => {
      // Arrange
      mockRedis.get.mockResolvedValue(null)
      mockQueue.add
        .mockResolvedValueOnce({ id: 'job-youtube-1' })
        .mockResolvedValueOnce({ id: 'job-vimeo-1' })

      // Act
      const youtubeJobId = await service.enqueueJob('user-1', 'https://youtube.com/watch?v=abc123', 'normal')
      const vimeoJobId = await service.enqueueJob('user-1', 'https://vimeo.com/123456789', 'normal')

      // Assert — different platforms produce different job IDs
      expect(youtubeJobId).toBe('job-youtube-1')
      expect(vimeoJobId).toBe('job-vimeo-1')
      expect(youtubeJobId).not.toBe(vimeoJobId)
      expect(mockQueue.add).toHaveBeenCalledTimes(2)
    })

    it('should generate different dedup keys for different video IDs', async () => {
      // Arrange
      mockRedis.get.mockResolvedValue(null)
      mockQueue.add
        .mockResolvedValueOnce({ id: 'job-diff-1' })
        .mockResolvedValueOnce({ id: 'job-diff-2' })

      // Act
      await service.enqueueJob('user-1', 'https://youtube.com/watch?v=videoAAA', 'normal')
      const key1 = mockRedis.setex.mock.calls[0][0]

      await service.enqueueJob('user-1', 'https://youtube.com/watch?v=videoBBB', 'normal')
      const key2 = mockRedis.setex.mock.calls[1][0]

      // Assert — different dedup keys for different videos
      expect(key1).not.toBe(key2)
      expect(key1).toMatch(/^dedup:[a-f0-9]{64}$/)
      expect(key2).toMatch(/^dedup:[a-f0-9]{64}$/)
    })

    it('should enqueue three different videos as three independent jobs', async () => {
      // Arrange
      mockRedis.get.mockResolvedValue(null)
      mockQueue.add
        .mockResolvedValueOnce({ id: 'job-a' })
        .mockResolvedValueOnce({ id: 'job-b' })
        .mockResolvedValueOnce({ id: 'job-c' })

      // Act
      const idA = await service.enqueueJob('user-1', 'https://youtube.com/watch?v=videoA', 'normal')
      const idB = await service.enqueueJob('user-1', 'https://youtube.com/watch?v=videoB', 'normal')
      const idC = await service.enqueueJob('user-1', 'https://youtube.com/watch?v=videoC', 'normal')

      // Assert — all distinct
      expect(new Set([idA, idB, idC]).size).toBe(3)
      expect(mockQueue.add).toHaveBeenCalledTimes(3)
    })

    it('should treat http and https variants of non-YouTube URLs as different (Req 9.6)', async () => {
      // For non-YouTube URLs, normalization uses hostname + pathname (no protocol)
      // so http://vimeo.com/123 and https://vimeo.com/123 produce the same key
      mockRedis.get.mockResolvedValue(null)
      mockQueue.add
        .mockResolvedValueOnce({ id: 'job-http' })
        .mockResolvedValueOnce({ id: 'job-https' })

      await service.enqueueJob('user-1', 'http://vimeo.com/123456', 'normal')
      const keyHttp = mockRedis.setex.mock.calls[0][0]

      await service.enqueueJob('user-1', 'https://vimeo.com/123456', 'normal')
      const keyHttps = mockRedis.setex.mock.calls[1][0]

      // Both normalise to vimeo.com/123456 → same dedup key
      expect(keyHttp).toBe(keyHttps)
    })
  })

  // ── 3. Deduplication expiration after 24 hours ────────────────────────────

  describe('3. Deduplication expiration after 24 hours (Req 9.5)', () => {
    it('should create a new job when the dedup key has expired (Redis returns null)', async () => {
      // Arrange — dedup key has expired (Redis TTL elapsed, key no longer present)
      mockRedis.get.mockResolvedValue(null) // expired key returns null
      mockQueue.add.mockResolvedValue({ id: 'job-after-expiry' })

      const url = 'https://youtube.com/watch?v=expiredDedup'

      // Act — submit after 24-hour expiry
      const jobId = await service.enqueueJob('user-1', url, 'normal')

      // Assert — new job created because dedup key expired
      expect(jobId).toBe('job-after-expiry')
      expect(mockQueue.add).toHaveBeenCalledOnce()
    })

    it('should store a fresh dedup key with 24-hour TTL after expiry (Req 9.5)', async () => {
      // Arrange — dedup key expired
      mockRedis.get.mockResolvedValue(null)
      mockQueue.add.mockResolvedValue({ id: 'job-fresh-key' })

      // Act
      await service.enqueueJob('user-1', 'https://youtube.com/watch?v=freshKey', 'normal')

      // Assert — new dedup key stored with 24h TTL
      expect(mockRedis.setex).toHaveBeenCalledWith(
        expect.stringMatching(/^dedup:[a-f0-9]{64}$/),
        24 * 60 * 60,
        'job-fresh-key'
      )
    })

    it('should allow re-submission of same URL after dedup key expires (Req 9.5)', async () => {
      // Simulate the full lifecycle:
      //   1. First submission → new job created, dedup key stored
      //   2. Second submission within 24h → same job returned
      //   3. After 24h (key expired) → new job created

      const url = 'https://youtube.com/watch?v=lifecycle'

      // Step 1: First submission
      mockRedis.get.mockResolvedValueOnce(null)
      mockQueue.add.mockResolvedValueOnce({ id: 'job-first' })
      const firstId = await service.enqueueJob('user-1', url, 'normal')
      expect(firstId).toBe('job-first')

      // Step 2: Second submission within 24h (dedup key still valid)
      mockRedis.get.mockResolvedValueOnce('job-first')
      mockQueue.getJob.mockResolvedValueOnce(buildMockJob('job-first', 'completed'))
      const secondId = await service.enqueueJob('user-1', url, 'normal')
      expect(secondId).toBe('job-first') // same job returned

      // Step 3: After 24h (dedup key expired, Redis returns null)
      mockRedis.get.mockResolvedValueOnce(null)
      mockQueue.add.mockResolvedValueOnce({ id: 'job-after-24h' })
      const thirdId = await service.enqueueJob('user-1', url, 'normal')
      expect(thirdId).toBe('job-after-24h') // new job created

      // Assert — queue.add called exactly twice (first and after expiry)
      expect(mockQueue.add).toHaveBeenCalledTimes(2)
    })

    it('should create a new job when dedup key exists but job was removed from queue (Req 9.5)', async () => {
      // Edge case: dedup key in Redis but the BullMQ job was removed (e.g., manual cleanup)
      mockRedis.get.mockResolvedValue('job-removed-1')
      mockQueue.getJob.mockResolvedValue(null) // job no longer in queue
      mockQueue.add.mockResolvedValue({ id: 'job-new-after-removal' })

      // Act
      const jobId = await service.enqueueJob('user-1', 'https://youtube.com/watch?v=removedJob', 'normal')

      // Assert — new job created since original was removed
      expect(jobId).toBe('job-new-after-removal')
      expect(mockQueue.add).toHaveBeenCalledOnce()
    })

    it('should create a new job when previous job with same URL has failed (Req 9.2, 9.4)', async () => {
      // Failed jobs are excluded from deduplication — user should be able to retry
      mockRedis.get.mockResolvedValue('job-failed-1')
      mockQueue.getJob.mockResolvedValue(buildMockJob('job-failed-1', 'failed'))
      mockQueue.add.mockResolvedValue({ id: 'job-retry-1' })

      // Act — resubmit same URL after failure
      const jobId = await service.enqueueJob('user-1', 'https://youtube.com/watch?v=failedVideo', 'normal')

      // Assert — new job created for retry (failed jobs are not deduplicated)
      expect(jobId).toBe('job-retry-1')
      expect(mockQueue.add).toHaveBeenCalledOnce()
    })

    it('should update the dedup key with new job ID after a failed job is retried (Req 9.4)', async () => {
      // After a failed job is retried, the dedup key should point to the new job
      mockRedis.get.mockResolvedValue('job-failed-old')
      mockQueue.getJob.mockResolvedValue(buildMockJob('job-failed-old', 'failed'))
      mockQueue.add.mockResolvedValue({ id: 'job-retry-new' })

      // Act
      await service.enqueueJob('user-1', 'https://youtube.com/watch?v=retryVideo', 'normal')

      // Assert — dedup key updated to point to new retry job
      expect(mockRedis.setex).toHaveBeenCalledWith(
        expect.stringMatching(/^dedup:[a-f0-9]{64}$/),
        24 * 60 * 60,
        'job-retry-new'
      )
    })
  })

  // ── 4. URL normalisation for deduplication ────────────────────────────────

  describe('4. URL normalisation produces consistent dedup keys (Req 9.6)', () => {
    it('should produce the same dedup key for YouTube URLs with and without www', async () => {
      mockRedis.get.mockResolvedValue(null)
      mockQueue.add
        .mockResolvedValueOnce({ id: 'job-www' })
        .mockResolvedValueOnce({ id: 'job-no-www' })

      await service.enqueueJob('user-1', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'normal')
      const keyWithWww = mockRedis.setex.mock.calls[0][0]

      await service.enqueueJob('user-1', 'https://youtube.com/watch?v=dQw4w9WgXcQ', 'normal')
      const keyWithoutWww = mockRedis.setex.mock.calls[1][0]

      // Both normalise to youtube:{videoId} → same key
      expect(keyWithWww).toBe(keyWithoutWww)
    })

    it('should produce the same dedup key for YouTube URLs with extra query params', async () => {
      mockRedis.get.mockResolvedValue(null)
      mockQueue.add
        .mockResolvedValueOnce({ id: 'job-clean' })
        .mockResolvedValueOnce({ id: 'job-extra-params' })

      await service.enqueueJob('user-1', 'https://youtube.com/watch?v=abc123', 'normal')
      const keyClean = mockRedis.setex.mock.calls[0][0]

      await service.enqueueJob('user-1', 'https://youtube.com/watch?v=abc123&list=PLxxx&index=3&t=120', 'normal')
      const keyWithParams = mockRedis.setex.mock.calls[1][0]

      // Extra params stripped — same video ID → same key
      expect(keyClean).toBe(keyWithParams)
    })

    it('should produce the same dedup key for youtu.be short URLs', async () => {
      mockRedis.get.mockResolvedValue(null)
      mockQueue.add
        .mockResolvedValueOnce({ id: 'job-long' })
        .mockResolvedValueOnce({ id: 'job-short' })

      await service.enqueueJob('user-1', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'normal')
      const keyLong = mockRedis.setex.mock.calls[0][0]

      await service.enqueueJob('user-1', 'https://youtu.be/dQw4w9WgXcQ', 'normal')
      const keyShort = mockRedis.setex.mock.calls[1][0]

      // youtu.be short URL normalises to same youtube:{videoId}
      expect(keyLong).toBe(keyShort)
    })

    it('should produce the same dedup key regardless of URL case (Req 9.6)', async () => {
      mockRedis.get.mockResolvedValue(null)
      mockQueue.add
        .mockResolvedValueOnce({ id: 'job-upper' })
        .mockResolvedValueOnce({ id: 'job-lower' })

      await service.enqueueJob('user-1', 'https://YOUTUBE.COM/watch?v=dQw4w9WgXcQ', 'normal')
      const keyUpper = mockRedis.setex.mock.calls[0][0]

      await service.enqueueJob('user-1', 'https://youtube.com/watch?v=dQw4w9WgXcQ', 'normal')
      const keyLower = mockRedis.setex.mock.calls[1][0]

      expect(keyUpper).toBe(keyLower)
    })

    it('should produce the same dedup key for non-YouTube URLs with and without query params', async () => {
      mockRedis.get.mockResolvedValue(null)
      mockQueue.add
        .mockResolvedValueOnce({ id: 'job-vimeo-clean' })
        .mockResolvedValueOnce({ id: 'job-vimeo-params' })

      await service.enqueueJob('user-1', 'https://vimeo.com/123456789', 'normal')
      const keyClean = mockRedis.setex.mock.calls[0][0]

      await service.enqueueJob('user-1', 'https://vimeo.com/123456789?quality=hd&autoplay=1', 'normal')
      const keyWithParams = mockRedis.setex.mock.calls[1][0]

      // Non-YouTube: hostname + pathname only → same key
      expect(keyClean).toBe(keyWithParams)
    })
  })

  // ── 5. Dedup key format validation ───────────────────────────────────────

  describe('5. Dedup key format and Redis interaction (Req 9.1, 9.5)', () => {
    it('should use the dedup:{sha256} key format in Redis', async () => {
      // Arrange
      mockRedis.get.mockResolvedValue(null)
      mockQueue.add.mockResolvedValue({ id: 'job-key-format' })

      // Act
      await service.enqueueJob('user-1', 'https://youtube.com/watch?v=keyFormat', 'normal')

      // Assert — key follows dedup:{64-char hex} format
      const [key] = mockRedis.setex.mock.calls[0]
      expect(key).toMatch(/^dedup:[a-f0-9]{64}$/)
    })

    it('should check Redis for existing dedup key before creating a new job', async () => {
      // Arrange
      mockRedis.get.mockResolvedValue(null)
      mockQueue.add.mockResolvedValue({ id: 'job-redis-check' })

      // Act
      await service.enqueueJob('user-1', 'https://youtube.com/watch?v=redisCheck', 'normal')

      // Assert — Redis was queried before queue.add was called
      expect(mockRedis.get).toHaveBeenCalledWith(
        expect.stringMatching(/^dedup:[a-f0-9]{64}$/)
      )
      expect(mockRedis.get).toHaveBeenCalledBefore
      expect(mockQueue.add).toHaveBeenCalledOnce()
    })

    it('should not call queue.add when a valid dedup key is found in Redis', async () => {
      // Arrange — dedup key present and job is in waiting state
      mockRedis.get.mockResolvedValue('job-existing-dedup')
      mockQueue.getJob.mockResolvedValue(buildMockJob('job-existing-dedup', 'waiting'))

      // Act
      await service.enqueueJob('user-1', 'https://youtube.com/watch?v=existingDedup', 'normal')

      // Assert — queue.add never called (dedup short-circuit)
      expect(mockQueue.add).not.toHaveBeenCalled()
    })

    it('should not write a new dedup key when returning an existing job', async () => {
      // Arrange — dedup key present and job is active
      mockRedis.get.mockResolvedValue('job-no-overwrite')
      mockQueue.getJob.mockResolvedValue(buildMockJob('job-no-overwrite', 'active'))

      // Act
      await service.enqueueJob('user-1', 'https://youtube.com/watch?v=noOverwrite', 'normal')

      // Assert — setex not called (no new dedup key written)
      expect(mockRedis.setex).not.toHaveBeenCalled()
    })
  })
})
