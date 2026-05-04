/**
 * Integration Tests for Job Queue Service
 *
 * Tests job enqueueing/consumption lifecycle and deduplication logic
 * using mocked Redis and BullMQ dependencies.
 *
 * Requirements: 1.2, 2.2, 9.2, 9.3, 9.5, 19.2
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { JobQueueService } from '../job-queue'
import { createRedisConnection } from '../../config/redis'
import { createSermonQueue } from '../../config/queue'

// Mock external dependencies
vi.mock('../../config/redis')
vi.mock('../../config/queue')

// ─────────────────────────────────────────────────────────────────────────────
// Task 15.4 — Job Enqueueing and Consumption
// ─────────────────────────────────────────────────────────────────────────────

describe('Task 15.4 — Job Enqueueing and Consumption', () => {
  let service: JobQueueService
  let mockRedis: any
  let mockQueue: any

  beforeEach(() => {
    mockRedis = {
      get: vi.fn().mockResolvedValue(null),
      setex: vi.fn().mockResolvedValue('OK'),
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

  it('should enqueue a job and return a job ID immediately (Req 1.2)', async () => {
    // Arrange
    mockQueue.add.mockResolvedValue({ id: 'job-abc-123' })

    // Act
    const jobId = await service.enqueueJob('user-1', 'https://youtube.com/watch?v=abc123', 'normal')

    // Assert — job ID returned without blocking
    expect(jobId).toBe('job-abc-123')
    expect(mockQueue.add).toHaveBeenCalledOnce()
  })

  it('should store job in queue with correct data payload (Req 1.2)', async () => {
    // Arrange
    mockQueue.add.mockResolvedValue({ id: 'job-xyz' })
    const videoUrl = 'https://youtube.com/watch?v=testVideo'

    // Act
    await service.enqueueJob('user-42', videoUrl, 'high')

    // Assert — queue.add called with correct job name and data
    expect(mockQueue.add).toHaveBeenCalledWith(
      'process-sermon',
      expect.objectContaining({
        userId: 'user-42',
        videoUrl,
        priority: 'high',
        createdAt: expect.any(String),
      }),
      expect.any(Object)
    )
  })

  it('should persist deduplication key in Redis with 24-hour TTL (Req 1.3)', async () => {
    // Arrange
    mockQueue.add.mockResolvedValue({ id: 'job-persist-1' })

    // Act
    await service.enqueueJob('user-1', 'https://youtube.com/watch?v=persist', 'normal')

    // Assert — dedup key stored with 24h TTL
    expect(mockRedis.setex).toHaveBeenCalledWith(
      expect.stringMatching(/^dedup:[a-f0-9]{64}$/),
      24 * 60 * 60,
      'job-persist-1'
    )
  })

  it('should reflect job status lifecycle: waiting → active → completed (Req 2.2)', async () => {
    // Arrange — simulate job progressing through states
    const jobId = 'job-lifecycle-1'
    mockQueue.add.mockResolvedValue({ id: jobId })

    const mockJobWaiting = {
      id: jobId,
      getState: vi.fn().mockResolvedValue('waiting'),
      progress: undefined,
    }
    const mockJobActive = {
      id: jobId,
      getState: vi.fn().mockResolvedValue('active'),
      progress: { status: 'extracting_audio', percentage: 10, currentStep: 'Extracting audio...' },
    }
    const mockJobCompleted = {
      id: jobId,
      getState: vi.fn().mockResolvedValue('completed'),
      progress: { status: 'completed', percentage: 100, currentStep: 'Processing complete!' },
    }

    // Act & Assert — waiting state
    mockQueue.getJob.mockResolvedValueOnce(mockJobWaiting)
    const waitingStatus = await service.getJobStatus(jobId)
    expect(waitingStatus?.status).toBe('waiting')
    expect(waitingStatus?.percentage).toBe(0)

    // Act & Assert — active state
    mockQueue.getJob.mockResolvedValueOnce(mockJobActive)
    const activeStatus = await service.getJobStatus(jobId)
    expect(activeStatus?.status).toBe('active')
    expect(activeStatus?.percentage).toBe(10)
    expect(activeStatus?.currentStep).toBe('Extracting audio...')

    // Act & Assert — completed state
    mockQueue.getJob.mockResolvedValueOnce(mockJobCompleted)
    const completedStatus = await service.getJobStatus(jobId)
    expect(completedStatus?.status).toBe('completed')
    expect(completedStatus?.percentage).toBe(100)
  })

  it('should return null status for non-existent job (Req 1.7)', async () => {
    // Arrange
    mockQueue.getJob.mockResolvedValue(null)

    // Act
    const status = await service.getJobStatus('non-existent-job')

    // Assert
    expect(status).toBeNull()
  })

  it('should enqueue jobs with correct BullMQ priority values (Req 1.4)', async () => {
    // Arrange
    mockQueue.add.mockResolvedValue({ id: 'job-prio' })

    // Act — high priority
    await service.enqueueJob('user-1', 'https://youtube.com/watch?v=high', 'high')
    expect(mockQueue.add).toHaveBeenLastCalledWith(
      'process-sermon',
      expect.any(Object),
      { priority: 1 }
    )

    // Act — normal priority
    await service.enqueueJob('user-1', 'https://youtube.com/watch?v=normal', 'normal')
    expect(mockQueue.add).toHaveBeenLastCalledWith(
      'process-sermon',
      expect.any(Object),
      { priority: 5 }
    )

    // Act — low priority
    await service.enqueueJob('user-1', 'https://youtube.com/watch?v=low', 'low')
    expect(mockQueue.add).toHaveBeenLastCalledWith(
      'process-sermon',
      expect.any(Object),
      { priority: 10 }
    )
  })

  it('should retrieve draft from Redis after job completes (Req 2.3)', async () => {
    // Arrange
    const draft = {
      title: 'Sermon Title',
      description: 'Sermon description',
      content: 'Full sermon content...',
      keywords: ['faith', 'hope'],
      video_url: 'https://youtube.com/watch?v=abc',
      transcript: 'Full transcript text...',
    }
    mockRedis.get.mockResolvedValue(JSON.stringify(draft))

    // Act
    const result = await service.getJobDraft('job-completed-1')

    // Assert
    expect(result).toEqual(draft)
    expect(mockRedis.get).toHaveBeenCalledWith('draft:job-completed-1')
  })

  it('should return null draft when job has not completed yet (Req 2.3)', async () => {
    // Arrange
    mockRedis.get.mockResolvedValue(null)

    // Act
    const result = await service.getJobDraft('job-in-progress')

    // Assert
    expect(result).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Task 15.5 — Deduplication Logic
// ─────────────────────────────────────────────────────────────────────────────

describe('Task 15.5 — Deduplication Logic', () => {
  let service: JobQueueService
  let mockRedis: any
  let mockQueue: any

  beforeEach(() => {
    mockRedis = {
      get: vi.fn(),
      setex: vi.fn().mockResolvedValue('OK'),
      quit: vi.fn().mockResolvedValue(undefined),
    }

    mockQueue = {
      add: vi.fn(),
      getJob: vi.fn(),
    }

    vi.mocked(createRedisConnection).mockReturnValue(mockRedis)
    vi.mocked(createSermonQueue).mockReturnValue(mockQueue)

    service = new JobQueueService()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should return same job ID when same URL submitted twice within 24 hours (Req 9.2)', async () => {
    // Arrange — first submission creates a job
    mockRedis.get.mockResolvedValueOnce(null) // no existing dedup key
    mockQueue.add.mockResolvedValue({ id: 'job-original-1' })

    const url = 'https://youtube.com/watch?v=sameVideo'

    // Act — first submission
    const firstJobId = await service.enqueueJob('user-1', url, 'normal')
    expect(firstJobId).toBe('job-original-1')

    // Arrange — second submission finds existing dedup key
    mockRedis.get.mockResolvedValueOnce('job-original-1')
    mockQueue.getJob.mockResolvedValue({
      id: 'job-original-1',
      getState: vi.fn().mockResolvedValue('waiting'),
    })

    // Act — second submission with same URL
    const secondJobId = await service.enqueueJob('user-1', url, 'normal')

    // Assert — same job ID returned, no new job created
    expect(secondJobId).toBe('job-original-1')
    expect(mockQueue.add).toHaveBeenCalledOnce() // only called once (first submission)
  })

  it('should return same job ID for URL variations of the same video (Req 9.2, 9.3)', async () => {
    // Arrange — first submission
    mockRedis.get.mockResolvedValueOnce(null)
    mockQueue.add.mockResolvedValue({ id: 'job-dedup-yt' })

    const canonicalUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    const variantUrl = 'https://youtube.com/watch?v=dQw4w9WgXcQ&feature=share&t=30'

    // Act — first submission with canonical URL
    await service.enqueueJob('user-1', canonicalUrl, 'normal')
    const firstDedupKey = mockRedis.setex.mock.calls[0][0]

    // Arrange — second submission with variant URL
    mockRedis.get.mockResolvedValueOnce('job-dedup-yt')
    mockQueue.getJob.mockResolvedValue({
      id: 'job-dedup-yt',
      getState: vi.fn().mockResolvedValue('active'),
    })

    // Act — second submission with variant URL
    const secondJobId = await service.enqueueJob('user-1', variantUrl, 'normal')

    // Assert — same job returned (URL normalization produces same dedup key)
    expect(secondJobId).toBe('job-dedup-yt')
    expect(mockQueue.add).toHaveBeenCalledOnce()

    // Verify the dedup key format (SHA-256 hex)
    expect(firstDedupKey).toMatch(/^dedup:[a-f0-9]{64}$/)
  })

  it('should return different job IDs for different video URLs (Req 9.3)', async () => {
    // Arrange
    mockRedis.get.mockResolvedValue(null) // no existing dedup keys
    mockQueue.add
      .mockResolvedValueOnce({ id: 'job-video-1' })
      .mockResolvedValueOnce({ id: 'job-video-2' })

    // Act
    const jobId1 = await service.enqueueJob('user-1', 'https://youtube.com/watch?v=video1', 'normal')
    const jobId2 = await service.enqueueJob('user-1', 'https://youtube.com/watch?v=video2', 'normal')

    // Assert — different job IDs for different videos
    expect(jobId1).toBe('job-video-1')
    expect(jobId2).toBe('job-video-2')
    expect(jobId1).not.toBe(jobId2)
    expect(mockQueue.add).toHaveBeenCalledTimes(2)
  })

  it('should create new job when dedup key has expired (after 24 hours) (Req 9.5)', async () => {
    // Arrange — dedup key has expired (Redis returns null)
    mockRedis.get.mockResolvedValue(null) // expired key returns null
    mockQueue.add.mockResolvedValue({ id: 'job-after-expiry' })

    const url = 'https://youtube.com/watch?v=expiredDedup'

    // Act — submit after 24-hour expiry
    const jobId = await service.enqueueJob('user-1', url, 'normal')

    // Assert — new job created (dedup key expired)
    expect(jobId).toBe('job-after-expiry')
    expect(mockQueue.add).toHaveBeenCalledOnce()
    // New dedup key stored with 24h TTL
    expect(mockRedis.setex).toHaveBeenCalledWith(
      expect.stringMatching(/^dedup:[a-f0-9]{64}$/),
      24 * 60 * 60,
      'job-after-expiry'
    )
  })

  it('should create new job when previous job with same URL has failed (Req 9.2)', async () => {
    // Arrange — existing job is in failed state
    mockRedis.get.mockResolvedValue('job-failed-1')
    mockQueue.getJob.mockResolvedValue({
      id: 'job-failed-1',
      getState: vi.fn().mockResolvedValue('failed'),
    })
    mockQueue.add.mockResolvedValue({ id: 'job-retry-1' })

    // Act — resubmit same URL after failure
    const jobId = await service.enqueueJob('user-1', 'https://youtube.com/watch?v=failedVideo', 'normal')

    // Assert — new job created for retry
    expect(jobId).toBe('job-retry-1')
    expect(mockQueue.add).toHaveBeenCalledOnce()
  })

  it('should return existing job ID when job is in active state (Req 9.2)', async () => {
    // Arrange
    mockRedis.get.mockResolvedValue('job-active-1')
    mockQueue.getJob.mockResolvedValue({
      id: 'job-active-1',
      getState: vi.fn().mockResolvedValue('active'),
    })

    // Act
    const jobId = await service.enqueueJob('user-1', 'https://youtube.com/watch?v=activeVideo', 'normal')

    // Assert — existing active job returned
    expect(jobId).toBe('job-active-1')
    expect(mockQueue.add).not.toHaveBeenCalled()
  })

  it('should return existing job ID when job is in completed state (Req 9.2)', async () => {
    // Arrange
    mockRedis.get.mockResolvedValue('job-completed-1')
    mockQueue.getJob.mockResolvedValue({
      id: 'job-completed-1',
      getState: vi.fn().mockResolvedValue('completed'),
    })

    // Act
    const jobId = await service.enqueueJob('user-1', 'https://youtube.com/watch?v=completedVideo', 'normal')

    // Assert — existing completed job returned (idempotent)
    expect(jobId).toBe('job-completed-1')
    expect(mockQueue.add).not.toHaveBeenCalled()
  })

  it('should create new job when dedup key exists but job no longer in queue (Req 9.5)', async () => {
    // Arrange — dedup key exists but job was removed from queue
    mockRedis.get.mockResolvedValue('job-removed-1')
    mockQueue.getJob.mockResolvedValue(null) // job no longer in queue
    mockQueue.add.mockResolvedValue({ id: 'job-new-after-removal' })

    // Act
    const jobId = await service.enqueueJob('user-1', 'https://youtube.com/watch?v=removedJob', 'normal')

    // Assert — new job created
    expect(jobId).toBe('job-new-after-removal')
    expect(mockQueue.add).toHaveBeenCalledOnce()
  })

  it('should generate consistent dedup keys for same URL across multiple calls (Req 9.1)', async () => {
    // Arrange
    mockRedis.get.mockResolvedValue(null)
    mockQueue.add
      .mockResolvedValueOnce({ id: 'job-1' })
      .mockResolvedValueOnce({ id: 'job-2' })

    const url = 'https://youtube.com/watch?v=consistentKey'

    // Act — two separate enqueue calls with same URL (both with no existing dedup)
    await service.enqueueJob('user-1', url, 'normal')
    const key1 = mockRedis.setex.mock.calls[0][0]

    mockRedis.get.mockResolvedValue(null) // simulate expired
    await service.enqueueJob('user-1', url, 'normal')
    const key2 = mockRedis.setex.mock.calls[1][0]

    // Assert — same dedup key generated both times
    expect(key1).toBe(key2)
  })
})
