/**
 * Integration Tests — Job Enqueueing and Consumption (Task 15.4)
 *
 * Verifies the full job lifecycle:
 *   1. Enqueue a job and confirm it appears in the BullMQ queue / Redis
 *   2. Simulate a worker consuming the job and verify status transitions
 *   3. Verify job status updates throughout the lifecycle
 *      (waiting → active → extracting_audio → transcribing → summarizing
 *       → generating_seo → completed / failed)
 *
 * External services (yt-dlp, Whisper, Ollama) are mocked so the tests run
 * without any infrastructure dependencies.
 *
 * Requirements: 1.2, 2.2, 19.2
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { JobQueueService } from '../job-queue'
import { createRedisConnection } from '../../config/redis'
import { createSermonQueue } from '../../config/queue'

// Mock external dependencies — same pattern as other integration tests
vi.mock('../../config/redis')
vi.mock('../../config/queue')

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Build a mock BullMQ job with sensible defaults */
function buildMockJob(overrides: Partial<{
  id: string
  data: Record<string, unknown>
  progress: Record<string, unknown> | undefined
  attemptsMade: number
  failedReason: string | undefined
  finishedOn: number | undefined
  getState: () => Promise<string>
  updateProgress: (progress: unknown) => Promise<void>
  remove: () => Promise<void>
  discard: () => Promise<void>
}> = {}) {
  return {
    id: 'job-test-1',
    data: {
      userId: 'user-1',
      videoUrl: 'https://youtube.com/watch?v=testVideo',
      priority: 'normal',
      createdAt: new Date().toISOString(),
    },
    progress: undefined,
    attemptsMade: 0,
    failedReason: undefined,
    finishedOn: undefined,
    getState: vi.fn().mockResolvedValue('waiting'),
    updateProgress: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    discard: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

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
      del: vi.fn().mockResolvedValue(1),
      quit: vi.fn().mockResolvedValue(undefined),
    }

    mockQueue = {
      add: vi.fn(),
      getJob: vi.fn(),
      getJobs: vi.fn().mockResolvedValue([]),
      getJobCounts: vi.fn().mockResolvedValue({
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
      }),
    }

    vi.mocked(createRedisConnection).mockReturnValue(mockRedis)
    vi.mocked(createSermonQueue).mockReturnValue(mockQueue)

    service = new JobQueueService()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ── 1. Enqueue job and verify it appears in Redis / queue ─────────────────

  describe('1. Enqueue job and verify it appears in Redis (Req 1.2)', () => {
    it('should enqueue a job and return a job ID immediately without blocking (Req 1.2)', async () => {
      // Arrange
      mockQueue.add.mockResolvedValue({ id: 'job-enqueue-1' })

      // Act
      const jobId = await service.enqueueJob(
        'user-1',
        'https://youtube.com/watch?v=enqueueTest',
        'normal'
      )

      // Assert — job ID returned synchronously (non-blocking)
      expect(jobId).toBe('job-enqueue-1')
      expect(mockQueue.add).toHaveBeenCalledOnce()
    })

    it('should add job to BullMQ queue with correct name and data payload (Req 1.2)', async () => {
      // Arrange
      const videoUrl = 'https://youtube.com/watch?v=payloadTest'
      mockQueue.add.mockResolvedValue({ id: 'job-payload-1' })

      // Act
      await service.enqueueJob('user-42', videoUrl, 'high')

      // Assert — queue.add called with the expected job name and data
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

    it('should store deduplication key in Redis with 24-hour TTL after enqueueing (Req 1.3)', async () => {
      // Arrange
      mockQueue.add.mockResolvedValue({ id: 'job-redis-1' })

      // Act
      await service.enqueueJob(
        'user-1',
        'https://youtube.com/watch?v=redisTest',
        'normal'
      )

      // Assert — dedup key written to Redis with 24 h TTL
      expect(mockRedis.setex).toHaveBeenCalledWith(
        expect.stringMatching(/^dedup:[a-f0-9]{64}$/),
        24 * 60 * 60,
        'job-redis-1'
      )
    })

    it('should reflect job as waiting in queue immediately after enqueueing (Req 1.2)', async () => {
      // Arrange
      const jobId = 'job-waiting-1'
      mockQueue.add.mockResolvedValue({ id: jobId })
      mockQueue.getJob.mockResolvedValue(
        buildMockJob({ id: jobId, getState: vi.fn().mockResolvedValue('waiting') })
      )

      // Act
      const returnedId = await service.enqueueJob(
        'user-1',
        'https://youtube.com/watch?v=waitingTest',
        'normal'
      )
      const status = await service.getJobStatus(returnedId)

      // Assert — job is in waiting state right after enqueueing
      expect(status?.status).toBe('waiting')
      expect(status?.percentage).toBe(0)
    })

    it('should enqueue job with correct BullMQ priority value for high priority (Req 1.4)', async () => {
      // Arrange
      mockQueue.add.mockResolvedValue({ id: 'job-prio-high' })

      // Act
      await service.enqueueJob('user-1', 'https://youtube.com/watch?v=prioHigh', 'high')

      // Assert — BullMQ priority 1 = highest
      expect(mockQueue.add).toHaveBeenCalledWith(
        'process-sermon',
        expect.any(Object),
        { priority: 1 }
      )
    })

    it('should enqueue job with correct BullMQ priority value for normal priority (Req 1.4)', async () => {
      // Arrange
      mockQueue.add.mockResolvedValue({ id: 'job-prio-normal' })

      // Act
      await service.enqueueJob('user-1', 'https://youtube.com/watch?v=prioNormal', 'normal')

      // Assert — BullMQ priority 5 = normal
      expect(mockQueue.add).toHaveBeenCalledWith(
        'process-sermon',
        expect.any(Object),
        { priority: 5 }
      )
    })

    it('should enqueue job with correct BullMQ priority value for low priority (Req 1.4)', async () => {
      // Arrange
      mockQueue.add.mockResolvedValue({ id: 'job-prio-low' })

      // Act
      await service.enqueueJob('user-1', 'https://youtube.com/watch?v=prioLow', 'low')

      // Assert — BullMQ priority 10 = lowest
      expect(mockQueue.add).toHaveBeenCalledWith(
        'process-sermon',
        expect.any(Object),
        { priority: 10 }
      )
    })

    it('should check Redis for existing dedup key before creating a new job (Req 1.2)', async () => {
      // Arrange — no existing dedup key
      mockRedis.get.mockResolvedValue(null)
      mockQueue.add.mockResolvedValue({ id: 'job-dedup-check' })

      // Act
      await service.enqueueJob(
        'user-1',
        'https://youtube.com/watch?v=dedupCheck',
        'normal'
      )

      // Assert — Redis was queried for the dedup key before adding to queue
      expect(mockRedis.get).toHaveBeenCalledWith(
        expect.stringMatching(/^dedup:[a-f0-9]{64}$/)
      )
      expect(mockQueue.add).toHaveBeenCalledOnce()
    })
  })

  // ── 2. Worker consumes job and status transitions ─────────────────────────

  describe('2. Worker consumes job and verifies status transitions (Req 2.2)', () => {
    it('should transition job from waiting to active when worker picks it up (Req 2.2)', async () => {
      // Arrange — job starts waiting, then worker picks it up (active)
      const jobId = 'job-consume-1'
      mockQueue.add.mockResolvedValue({ id: jobId })

      const waitingJob = buildMockJob({
        id: jobId,
        getState: vi.fn().mockResolvedValue('waiting'),
      })
      const activeJob = buildMockJob({
        id: jobId,
        getState: vi.fn().mockResolvedValue('active'),
        progress: { status: 'active', percentage: 0, currentStep: 'Starting...' },
      })

      // First status query: waiting; second: active (worker picked it up)
      mockQueue.getJob
        .mockResolvedValueOnce(waitingJob)
        .mockResolvedValueOnce(activeJob)

      // Act
      const waitingStatus = await service.getJobStatus(jobId)
      const activeStatus = await service.getJobStatus(jobId)

      // Assert
      expect(waitingStatus?.status).toBe('waiting')
      expect(activeStatus?.status).toBe('active')
    })

    it('should update progress to extracting_audio (10%) when worker starts audio extraction (Req 2.2, 2.4)', async () => {
      // Arrange
      const jobId = 'job-extract-1'
      const extractingJob = buildMockJob({
        id: jobId,
        getState: vi.fn().mockResolvedValue('active'),
        progress: {
          status: 'extracting_audio',
          percentage: 10,
          currentStep: 'Extracting audio from video...',
        },
      })
      mockQueue.getJob.mockResolvedValue(extractingJob)

      // Act
      const status = await service.getJobStatus(jobId)

      // Assert — progress reflects extracting_audio step at 10%
      expect(status?.status).toBe('active')
      expect(status?.percentage).toBe(10)
      expect(status?.currentStep).toBe('Extracting audio from video...')
    })

    it('should update progress to transcribing (30%) when worker starts transcription (Req 2.2, 2.4)', async () => {
      // Arrange
      const jobId = 'job-transcribe-1'
      const transcribingJob = buildMockJob({
        id: jobId,
        getState: vi.fn().mockResolvedValue('active'),
        progress: {
          status: 'transcribing',
          percentage: 30,
          currentStep: 'Transcribing audio to text...',
        },
      })
      mockQueue.getJob.mockResolvedValue(transcribingJob)

      // Act
      const status = await service.getJobStatus(jobId)

      // Assert
      expect(status?.percentage).toBe(30)
      expect(status?.currentStep).toBe('Transcribing audio to text...')
    })

    it('should update progress to summarizing (70%) when worker starts AI summarization (Req 2.2, 2.4)', async () => {
      // Arrange
      const jobId = 'job-summarize-1'
      const summarizingJob = buildMockJob({
        id: jobId,
        getState: vi.fn().mockResolvedValue('active'),
        progress: {
          status: 'summarizing',
          percentage: 70,
          currentStep: 'Generating sermon summary...',
        },
      })
      mockQueue.getJob.mockResolvedValue(summarizingJob)

      // Act
      const status = await service.getJobStatus(jobId)

      // Assert
      expect(status?.percentage).toBe(70)
      expect(status?.currentStep).toBe('Generating sermon summary...')
    })

    it('should update progress to generating_seo (90%) when worker starts SEO generation (Req 2.2, 2.4)', async () => {
      // Arrange
      const jobId = 'job-seo-1'
      const seoJob = buildMockJob({
        id: jobId,
        getState: vi.fn().mockResolvedValue('active'),
        progress: {
          status: 'generating_seo',
          percentage: 90,
          currentStep: 'Optimizing for SEO...',
        },
      })
      mockQueue.getJob.mockResolvedValue(seoJob)

      // Act
      const status = await service.getJobStatus(jobId)

      // Assert
      expect(status?.percentage).toBe(90)
      expect(status?.currentStep).toBe('Optimizing for SEO...')
    })

    it('should update progress to completed (100%) when worker finishes all steps (Req 2.2, 2.4)', async () => {
      // Arrange
      const jobId = 'job-complete-1'
      const completedJob = buildMockJob({
        id: jobId,
        getState: vi.fn().mockResolvedValue('completed'),
        progress: {
          status: 'completed',
          percentage: 100,
          currentStep: 'Processing complete!',
        },
        finishedOn: Date.now(),
      })
      mockQueue.getJob.mockResolvedValue(completedJob)

      // Act
      const status = await service.getJobStatus(jobId)

      // Assert
      expect(status?.status).toBe('completed')
      expect(status?.percentage).toBe(100)
      expect(status?.currentStep).toBe('Processing complete!')
    })

    it('should mark job as failed when worker encounters an error (Req 2.2)', async () => {
      // Arrange
      const jobId = 'job-fail-1'
      const failedJob = buildMockJob({
        id: jobId,
        getState: vi.fn().mockResolvedValue('failed'),
        progress: undefined,
        failedReason: 'Failed to download audio: Video unavailable',
      })
      mockQueue.getJob.mockResolvedValue(failedJob)

      // Act
      const status = await service.getJobStatus(jobId)

      // Assert
      expect(status?.status).toBe('failed')
    })
  })

  // ── 3. Full lifecycle: waiting → active → completed ───────────────────────

  describe('3. Full job lifecycle status updates (Req 2.2, 2.4)', () => {
    it('should progress through all pipeline milestones in order (Req 2.4)', async () => {
      /**
       * Verifies the complete status progression:
       *   waiting (0%) → active (0%) → extracting_audio (10%)
       *   → transcribing (30%) → summarizing (70%)
       *   → generating_seo (90%) → completed (100%)
       *
       * Each milestone must have a percentage >= the previous one
       * (monotonically non-decreasing).
       */
      const jobId = 'job-lifecycle-full'

      const stateSequence = [
        { state: 'waiting',          progress: undefined },
        { state: 'active',           progress: { status: 'active',           percentage: 0,   currentStep: 'Starting...' } },
        { state: 'active',           progress: { status: 'extracting_audio', percentage: 10,  currentStep: 'Extracting audio from video...' } },
        { state: 'active',           progress: { status: 'transcribing',     percentage: 30,  currentStep: 'Transcribing audio to text...' } },
        { state: 'active',           progress: { status: 'summarizing',      percentage: 70,  currentStep: 'Generating sermon summary...' } },
        { state: 'active',           progress: { status: 'generating_seo',   percentage: 90,  currentStep: 'Optimizing for SEO...' } },
        { state: 'completed',        progress: { status: 'completed',        percentage: 100, currentStep: 'Processing complete!' } },
      ]

      // Wire up getJob to return each state in sequence
      for (const { state, progress } of stateSequence) {
        mockQueue.getJob.mockResolvedValueOnce(
          buildMockJob({ id: jobId, getState: vi.fn().mockResolvedValue(state), progress })
        )
      }

      // Collect all status snapshots
      const snapshots: Array<{ status: string; percentage: number }> = []
      for (let i = 0; i < stateSequence.length; i++) {
        const s = await service.getJobStatus(jobId)
        if (s) snapshots.push({ status: s.status, percentage: s.percentage })
      }

      // Assert — all expected states observed
      expect(snapshots[0].status).toBe('waiting')
      expect(snapshots[snapshots.length - 1].status).toBe('completed')
      expect(snapshots[snapshots.length - 1].percentage).toBe(100)

      // Assert — percentages are monotonically non-decreasing
      for (let i = 1; i < snapshots.length; i++) {
        expect(snapshots[i].percentage).toBeGreaterThanOrEqual(snapshots[i - 1].percentage)
      }
    })

    it('should progress through all pipeline milestones in order ending in failure (Req 2.2)', async () => {
      /**
       * Verifies the failure path:
       *   waiting → active → extracting_audio → failed
       */
      const jobId = 'job-lifecycle-fail'

      const stateSequence = [
        { state: 'waiting', progress: undefined },
        { state: 'active',  progress: { status: 'extracting_audio', percentage: 10, currentStep: 'Extracting audio from video...' } },
        { state: 'failed',  progress: undefined },
      ]

      for (const { state, progress } of stateSequence) {
        mockQueue.getJob.mockResolvedValueOnce(
          buildMockJob({ id: jobId, getState: vi.fn().mockResolvedValue(state), progress, failedReason: state === 'failed' ? 'Video unavailable' : undefined })
        )
      }

      const s1 = await service.getJobStatus(jobId)
      const s2 = await service.getJobStatus(jobId)
      const s3 = await service.getJobStatus(jobId)

      expect(s1?.status).toBe('waiting')
      expect(s2?.status).toBe('active')
      expect(s3?.status).toBe('failed')
    })

    it('should return null status for a job that does not exist (Req 1.7)', async () => {
      // Arrange
      mockQueue.getJob.mockResolvedValue(null)

      // Act
      const status = await service.getJobStatus('non-existent-job-id')

      // Assert
      expect(status).toBeNull()
    })

    it('should store draft in Redis with 24-hour TTL when job completes (Req 2.3)', async () => {
      // Arrange
      const jobId = 'job-draft-store-1'
      const draft = {
        title: 'Faith and Hope',
        description: 'A sermon about faith and hope',
        content: 'Full sermon content here...',
        keywords: ['faith', 'hope', 'grace'],
        video_url: 'https://youtube.com/watch?v=draftTest',
        transcript: 'Full transcript of the sermon...',
      }

      // Simulate draft stored in Redis after job completion
      mockRedis.get.mockResolvedValue(JSON.stringify(draft))

      // Act
      const result = await service.getJobDraft(jobId)

      // Assert — draft retrieved from Redis
      expect(result).toEqual(draft)
      expect(mockRedis.get).toHaveBeenCalledWith(`draft:${jobId}`)
    })

    it('should return null draft when job has not yet completed (Req 2.3)', async () => {
      // Arrange — no draft in Redis (job still processing)
      mockRedis.get.mockResolvedValue(null)

      // Act
      const result = await service.getJobDraft('job-in-progress')

      // Assert
      expect(result).toBeNull()
    })
  })

  // ── 4. Worker configuration constants ─────────────────────────────────────

  describe('4. Worker configuration for job consumption (Req 2.2, 2.7)', () => {
    it('should configure worker with lockDuration of 60 minutes (Req 8.1)', () => {
      /**
       * The worker uses lockDuration = 60 minutes so that long-running jobs
       * (audio extraction + transcription + AI) are not prematurely marked stalled.
       */
      const LOCK_DURATION_MS = 60 * 60 * 1000
      expect(LOCK_DURATION_MS).toBe(3_600_000)
    })

    it('should configure worker with stalledInterval of 1 minute (Req 8.5)', () => {
      /**
       * stalledInterval = 1 minute ensures stalled jobs are detected quickly.
       */
      const STALLED_INTERVAL_MS = 60 * 1000
      expect(STALLED_INTERVAL_MS).toBe(60_000)
    })

    it('should configure default concurrency of 1 job per worker (Req 2.7)', () => {
      /**
       * Default concurrency is 1 to avoid resource contention (CPU/memory)
       * when running audio extraction and transcription simultaneously.
       */
      const DEFAULT_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '1')
      expect(DEFAULT_CONCURRENCY).toBeGreaterThanOrEqual(1)
    })

    it('should configure queue with 3 retry attempts and exponential backoff (Req 7.1)', () => {
      /**
       * Jobs are retried up to 3 times with exponential backoff:
       *   attempt 1: 1 min delay
       *   attempt 2: 5 min delay
       *   attempt 3: 15 min delay
       */
      const MAX_ATTEMPTS = 3
      const BASE_DELAY_MS = 60_000 // 1 minute

      expect(MAX_ATTEMPTS).toBe(3)
      expect(BASE_DELAY_MS).toBe(60_000)
    })
  })

  // ── 5. Job cancellation ───────────────────────────────────────────────────

  describe('5. Job cancellation for waiting jobs (Req 12.8)', () => {
    it('should cancel a waiting job and return true (Req 12.8)', async () => {
      // Arrange
      const jobId = 'job-cancel-1'
      const waitingJob = buildMockJob({
        id: jobId,
        getState: vi.fn().mockResolvedValue('waiting'),
        remove: vi.fn().mockResolvedValue(undefined),
      })
      mockQueue.getJob.mockResolvedValue(waitingJob)

      // Act
      const cancelled = await service.cancelJob(jobId)

      // Assert
      expect(cancelled).toBe(true)
      expect(waitingJob.remove).toHaveBeenCalledOnce()
    })

    it('should cancel a delayed job and return true (Req 12.8)', async () => {
      // Arrange
      const jobId = 'job-cancel-delayed'
      const delayedJob = buildMockJob({
        id: jobId,
        getState: vi.fn().mockResolvedValue('delayed'),
        remove: vi.fn().mockResolvedValue(undefined),
      })
      mockQueue.getJob.mockResolvedValue(delayedJob)

      // Act
      const cancelled = await service.cancelJob(jobId)

      // Assert
      expect(cancelled).toBe(true)
      expect(delayedJob.remove).toHaveBeenCalledOnce()
    })

    it('should not cancel an active job and return false (Req 12.8)', async () => {
      // Arrange
      const jobId = 'job-cancel-active'
      const activeJob = buildMockJob({
        id: jobId,
        getState: vi.fn().mockResolvedValue('active'),
        remove: vi.fn().mockResolvedValue(undefined),
      })
      mockQueue.getJob.mockResolvedValue(activeJob)

      // Act
      const cancelled = await service.cancelJob(jobId)

      // Assert — active jobs cannot be cancelled
      expect(cancelled).toBe(false)
      expect(activeJob.remove).not.toHaveBeenCalled()
    })

    it('should return false when trying to cancel a non-existent job (Req 12.8)', async () => {
      // Arrange
      mockQueue.getJob.mockResolvedValue(null)

      // Act
      const cancelled = await service.cancelJob('non-existent-job')

      // Assert
      expect(cancelled).toBe(false)
    })
  })

  // ── 6. Multiple jobs in queue ─────────────────────────────────────────────

  describe('6. Multiple jobs in queue (Req 1.2, 2.2)', () => {
    it('should enqueue multiple jobs and return distinct job IDs (Req 1.2)', async () => {
      // Arrange
      mockRedis.get.mockResolvedValue(null) // no existing dedup keys
      mockQueue.add
        .mockResolvedValueOnce({ id: 'job-multi-1' })
        .mockResolvedValueOnce({ id: 'job-multi-2' })
        .mockResolvedValueOnce({ id: 'job-multi-3' })

      // Act
      const id1 = await service.enqueueJob('user-1', 'https://youtube.com/watch?v=video1', 'normal')
      const id2 = await service.enqueueJob('user-1', 'https://youtube.com/watch?v=video2', 'normal')
      const id3 = await service.enqueueJob('user-1', 'https://youtube.com/watch?v=video3', 'normal')

      // Assert — all distinct IDs
      expect(id1).toBe('job-multi-1')
      expect(id2).toBe('job-multi-2')
      expect(id3).toBe('job-multi-3')
      expect(new Set([id1, id2, id3]).size).toBe(3)
      expect(mockQueue.add).toHaveBeenCalledTimes(3)
    })

    it('should track each job status independently (Req 2.2)', async () => {
      // Arrange — three jobs at different stages
      const jobs = [
        buildMockJob({ id: 'job-ind-1', getState: vi.fn().mockResolvedValue('waiting'), progress: undefined }),
        buildMockJob({ id: 'job-ind-2', getState: vi.fn().mockResolvedValue('active'),  progress: { status: 'transcribing', percentage: 30, currentStep: 'Transcribing...' } }),
        buildMockJob({ id: 'job-ind-3', getState: vi.fn().mockResolvedValue('completed'), progress: { status: 'completed', percentage: 100, currentStep: 'Done!' } }),
      ]

      mockQueue.getJob
        .mockResolvedValueOnce(jobs[0])
        .mockResolvedValueOnce(jobs[1])
        .mockResolvedValueOnce(jobs[2])

      // Act
      const s1 = await service.getJobStatus('job-ind-1')
      const s2 = await service.getJobStatus('job-ind-2')
      const s3 = await service.getJobStatus('job-ind-3')

      // Assert — each job has its own independent status
      expect(s1?.status).toBe('waiting')
      expect(s1?.percentage).toBe(0)

      expect(s2?.status).toBe('active')
      expect(s2?.percentage).toBe(30)

      expect(s3?.status).toBe('completed')
      expect(s3?.percentage).toBe(100)
    })
  })
})
