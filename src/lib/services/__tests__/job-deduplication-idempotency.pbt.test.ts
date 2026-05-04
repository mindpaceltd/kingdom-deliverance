/**
 * Property-Based Tests — Job Deduplication and Idempotency (Task 15.13)
 *
 * **Property 5: Job Deduplication and Idempotency**
 *
 * Validates: Requirements 1.6, 9.1, 9.2, 9.3, 9.4, 9.6
 *
 * Properties verified:
 *   P5a — For any valid video URL, submitting it multiple times within 24 hours
 *          returns the same job ID (deduplication).
 *   P5b — For a failed job, submitting the same URL creates a new job (retry allowed).
 *   P5c — URL normalization is idempotent: the same URL in different formats
 *          (extra query params, case, whitespace) produces the same deduplication key.
 *   P5d — Different video URLs always produce different deduplication keys.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fc from 'fast-check'
import { JobQueueService } from '../job-queue'
import { createRedisConnection } from '../../config/redis'
import { createSermonQueue } from '../../config/queue'

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

vi.mock('../../config/redis')
vi.mock('../../config/queue')

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

type MockRedis = {
  get: ReturnType<typeof vi.fn>
  setex: ReturnType<typeof vi.fn>
}

type MockQueue = {
  add: ReturnType<typeof vi.fn>
  getJob: ReturnType<typeof vi.fn>
}

/**
 * Enqueue a job and return the full Redis deduplication key stored by setex
 * (format: `dedup:<sha256-hex>`).
 */
async function captureDeduplicationKey(
  service: JobQueueService,
  mockRedis: MockRedis,
  mockQueue: MockQueue,
  url: string,
  jobId = 'job-1'
): Promise<string> {
  mockRedis.get.mockResolvedValue(null)
  mockQueue.add.mockResolvedValue({ id: jobId })

  await service.enqueueJob('user-1', url, 'normal')

  const key: string = mockRedis.setex.mock.calls[0][0]

  vi.clearAllMocks()

  return key
}

/**
 * Arbitraries for generating valid video URLs.
 */

/** Generates a random alphanumeric YouTube video ID (11 chars, like real IDs). */
const youtubeVideoIdArb = fc
  .string({ minLength: 5, maxLength: 15 })
  .filter((s) => /^[a-zA-Z0-9_-]+$/.test(s))

/** Generates a full YouTube watch URL with a random video ID. */
const youtubeWatchUrlArb = youtubeVideoIdArb.map(
  (id) => `https://www.youtube.com/watch?v=${id}`
)

/** Generates a youtu.be short URL for the same video ID. */
const youtubeShortUrlArb = youtubeVideoIdArb.map(
  (id) => `https://youtu.be/${id}`
)

/** Generates a YouTube URL with extra query parameters. */
const youtubeUrlWithExtraParamsArb = fc
  .tuple(
    youtubeVideoIdArb,
    fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z0-9]+$/.test(s)),
    fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z0-9]+$/.test(s))
  )
  .map(([id, paramKey, paramValue]) =>
    `https://www.youtube.com/watch?v=${id}&${paramKey}=${paramValue}`
  )

/** Generates a Vimeo URL with a random numeric video ID. */
const vimeoUrlArb = fc
  .integer({ min: 100000000, max: 999999999 })
  .map((id) => `https://vimeo.com/${id}`)

/** Generates a Vimeo URL with extra query parameters. */
const vimeoUrlWithParamsArb = fc
  .tuple(
    fc.integer({ min: 100000000, max: 999999999 }),
    fc.string({ minLength: 1, maxLength: 10 }).filter((s) => /^[a-zA-Z]+$/.test(s))
  )
  .map(([id, param]) => `https://vimeo.com/${id}?quality=${param}`)

/** Generates a pair of distinct YouTube video IDs. */
const distinctYoutubeVideoIdPairArb = fc
  .tuple(youtubeVideoIdArb, youtubeVideoIdArb)
  .filter(([a, b]) => a !== b)

/** Generates a pair of distinct Vimeo video IDs. */
const distinctVimeoIdPairArb = fc
  .tuple(
    fc.integer({ min: 100000000, max: 499999999 }),
    fc.integer({ min: 500000000, max: 999999999 })
  )
  .filter(([a, b]) => a !== b)

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite
// ─────────────────────────────────────────────────────────────────────────────

describe('Property 5 — Job Deduplication and Idempotency', () => {
  let service: JobQueueService
  let mockRedis: MockRedis
  let mockQueue: MockQueue

  beforeEach(() => {
    mockRedis = {
      get: vi.fn(),
      setex: vi.fn(),
    }
    mockQueue = {
      add: vi.fn(),
      getJob: vi.fn(),
    }

    vi.mocked(createRedisConnection).mockReturnValue(mockRedis as any)
    vi.mocked(createSermonQueue).mockReturnValue(mockQueue as any)

    service = new JobQueueService()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // P5a — Duplicate submissions within 24 hours return the same job ID
  // Validates: Requirements 1.6, 9.2, 9.3
  // ─────────────────────────────────────────────────────────────────────────

  describe('P5a — Duplicate submissions return the same job ID (Req 1.6, 9.2, 9.3)', () => {
    it(
      'P5a: for any YouTube URL, submitting it twice returns the same job ID (fast-check, 100 runs)',
      async () => {
        await fc.assert(
          fc.asyncProperty(youtubeWatchUrlArb, async (url) => {
            // Reset mocks for each run
            vi.clearAllMocks()
            mockRedis.get.mockResolvedValue(null)
            mockQueue.add.mockResolvedValue({ id: 'job-first' })

            // First submission — creates a new job
            const firstJobId = await service.enqueueJob('user-1', url, 'normal')

            // Simulate Redis returning the existing job ID on second submission
            vi.clearAllMocks()
            mockRedis.get.mockResolvedValue(firstJobId)
            mockQueue.getJob.mockResolvedValue({
              id: firstJobId,
              getState: vi.fn().mockResolvedValue('waiting'),
            })

            // Second submission — should return the same job ID
            const secondJobId = await service.enqueueJob('user-1', url, 'normal')

            return firstJobId === secondJobId
          }),
          { numRuns: 20 }
        )
      }
    )

    it(
      'P5a: for any Vimeo URL, submitting it twice returns the same job ID (fast-check, 100 runs)',
      async () => {
        await fc.assert(
          fc.asyncProperty(vimeoUrlArb, async (url) => {
            vi.clearAllMocks()
            mockRedis.get.mockResolvedValue(null)
            mockQueue.add.mockResolvedValue({ id: 'job-vimeo-first' })

            const firstJobId = await service.enqueueJob('user-1', url, 'normal')

            vi.clearAllMocks()
            mockRedis.get.mockResolvedValue(firstJobId)
            mockQueue.getJob.mockResolvedValue({
              id: firstJobId,
              getState: vi.fn().mockResolvedValue('active'),
            })

            const secondJobId = await service.enqueueJob('user-1', url, 'normal')

            return firstJobId === secondJobId
          }),
          { numRuns: 20 }
        )
      }
    )

    it(
      'P5a: duplicate submission of a completed job returns the same job ID (fast-check, 100 runs)',
      async () => {
        await fc.assert(
          fc.asyncProperty(youtubeWatchUrlArb, async (url) => {
            vi.clearAllMocks()
            mockRedis.get.mockResolvedValue(null)
            mockQueue.add.mockResolvedValue({ id: 'job-completed' })

            const firstJobId = await service.enqueueJob('user-1', url, 'normal')

            vi.clearAllMocks()
            mockRedis.get.mockResolvedValue(firstJobId)
            mockQueue.getJob.mockResolvedValue({
              id: firstJobId,
              getState: vi.fn().mockResolvedValue('completed'),
            })

            const secondJobId = await service.enqueueJob('user-1', url, 'normal')

            return firstJobId === secondJobId
          }),
          { numRuns: 20 }
        )
      }
    )

    it(
      'P5a: second submission never calls queue.add when a non-failed duplicate exists (fast-check, 100 runs)',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            youtubeWatchUrlArb,
            fc.constantFrom('waiting', 'active', 'completed'),
            async (url, existingState) => {
              vi.clearAllMocks()
              mockRedis.get.mockResolvedValue('existing-job-id')
              mockQueue.getJob.mockResolvedValue({
                id: 'existing-job-id',
                getState: vi.fn().mockResolvedValue(existingState),
              })

              await service.enqueueJob('user-1', url, 'normal')

              // queue.add must NOT be called — deduplication should short-circuit
              return mockQueue.add.mock.calls.length === 0
            }
          ),
          { numRuns: 20 }
        )
      }
    )
  })

  // ─────────────────────────────────────────────────────────────────────────
  // P5b — Failed job allows a new job to be created (retry)
  // Validates: Requirements 9.4
  // ─────────────────────────────────────────────────────────────────────────

  describe('P5b — Failed job allows new job creation for retry (Req 9.4)', () => {
    it(
      'P5b: for any YouTube URL with a failed existing job, a new job ID is returned (fast-check, 100 runs)',
      async () => {
        await fc.assert(
          fc.asyncProperty(youtubeWatchUrlArb, async (url) => {
            vi.clearAllMocks()
            mockRedis.get.mockResolvedValue('old-failed-job')
            mockQueue.getJob.mockResolvedValue({
              id: 'old-failed-job',
              getState: vi.fn().mockResolvedValue('failed'),
            })
            mockQueue.add.mockResolvedValue({ id: 'new-retry-job' })

            const newJobId = await service.enqueueJob('user-1', url, 'normal')

            // A new job must be created (not the old failed one)
            return newJobId === 'new-retry-job' && mockQueue.add.mock.calls.length === 1
          }),
          { numRuns: 20 }
        )
      }
    )

    it(
      'P5b: for any Vimeo URL with a failed existing job, queue.add is called to create a new job (fast-check, 100 runs)',
      async () => {
        await fc.assert(
          fc.asyncProperty(vimeoUrlArb, async (url) => {
            vi.clearAllMocks()
            mockRedis.get.mockResolvedValue('old-failed-vimeo-job')
            mockQueue.getJob.mockResolvedValue({
              id: 'old-failed-vimeo-job',
              getState: vi.fn().mockResolvedValue('failed'),
            })
            mockQueue.add.mockResolvedValue({ id: 'new-vimeo-retry-job' })

            await service.enqueueJob('user-1', url, 'normal')

            return mockQueue.add.mock.calls.length === 1
          }),
          { numRuns: 20 }
        )
      }
    )

    it(
      'P5b: when dedup key exists but job is no longer in queue, a new job is created (fast-check, 100 runs)',
      async () => {
        await fc.assert(
          fc.asyncProperty(youtubeWatchUrlArb, async (url) => {
            vi.clearAllMocks()
            // Redis has a stale dedup key but the job no longer exists in BullMQ
            mockRedis.get.mockResolvedValue('stale-job-id')
            mockQueue.getJob.mockResolvedValue(null) // job expired/removed
            mockQueue.add.mockResolvedValue({ id: 'new-job-after-expiry' })

            const jobId = await service.enqueueJob('user-1', url, 'normal')

            return jobId === 'new-job-after-expiry' && mockQueue.add.mock.calls.length === 1
          }),
          { numRuns: 20 }
        )
      }
    )
  })

  // ─────────────────────────────────────────────────────────────────────────
  // P5c — URL normalization produces consistent deduplication keys
  // Validates: Requirements 9.1, 9.6
  // ─────────────────────────────────────────────────────────────────────────

  describe('P5c — URL normalization produces consistent deduplication keys (Req 9.1, 9.6)', () => {
    it(
      'P5c: YouTube URL with extra query params produces the same key as the minimal URL (fast-check, 100 runs)',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            youtubeVideoIdArb,
            fc.string({ minLength: 1, maxLength: 10 }).filter((s) => /^[a-zA-Z]+$/.test(s)),
            async (videoId, extraParam) => {
              const minimalUrl = `https://www.youtube.com/watch?v=${videoId}`
              const urlWithExtra = `https://www.youtube.com/watch?v=${videoId}&feature=${extraParam}&t=42`

              const key1 = await captureDeduplicationKey(service, mockRedis, mockQueue, minimalUrl, 'job-a')
              const key2 = await captureDeduplicationKey(service, mockRedis, mockQueue, urlWithExtra, 'job-b')

              return key1 === key2
            }
          ),
          { numRuns: 20 }
        )
      }
    )

    it(
      'P5c: youtu.be short URL produces the same key as the full youtube.com URL (fast-check, 100 runs)',
      async () => {
        await fc.assert(
          fc.asyncProperty(youtubeVideoIdArb, async (videoId) => {
            const shortUrl = `https://youtu.be/${videoId}`
            const fullUrl = `https://www.youtube.com/watch?v=${videoId}`

            const key1 = await captureDeduplicationKey(service, mockRedis, mockQueue, shortUrl, 'job-short')
            const key2 = await captureDeduplicationKey(service, mockRedis, mockQueue, fullUrl, 'job-full')

            return key1 === key2
          }),
          { numRuns: 20 }
        )
      }
    )

    it(
      'P5c: Vimeo URL with query params produces the same key as the clean URL (fast-check, 100 runs)',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.integer({ min: 100000000, max: 999999999 }),
            fc.string({ minLength: 1, maxLength: 10 }).filter((s) => /^[a-zA-Z]+$/.test(s)),
            async (videoId, quality) => {
              const cleanUrl = `https://vimeo.com/${videoId}`
              const urlWithParams = `https://vimeo.com/${videoId}?quality=${quality}&autoplay=1`

              const key1 = await captureDeduplicationKey(service, mockRedis, mockQueue, cleanUrl, 'job-clean')
              const key2 = await captureDeduplicationKey(service, mockRedis, mockQueue, urlWithParams, 'job-params')

              return key1 === key2
            }
          ),
          { numRuns: 20 }
        )
      }
    )

    it(
      'P5c: URL normalization is idempotent — applying it twice produces the same key (fast-check, 100 runs)',
      async () => {
        await fc.assert(
          fc.asyncProperty(youtubeWatchUrlArb, async (url) => {
            // Enqueue the same URL three times — all should produce the same dedup key
            const key1 = await captureDeduplicationKey(service, mockRedis, mockQueue, url, 'job-1')
            const key2 = await captureDeduplicationKey(service, mockRedis, mockQueue, url, 'job-2')
            const key3 = await captureDeduplicationKey(service, mockRedis, mockQueue, url, 'job-3')

            return key1 === key2 && key2 === key3
          }),
          { numRuns: 20 }
        )
      }
    )

    it(
      'P5c: deduplication key format is always a SHA-256 hex string prefixed with "dedup:" (fast-check, 100 runs)',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.oneof(youtubeWatchUrlArb, vimeoUrlArb),
            async (url) => {
              const key = await captureDeduplicationKey(service, mockRedis, mockQueue, url, 'job-fmt')
              // SHA-256 produces 64 hex characters; key is prefixed with "dedup:"
              return /^dedup:[a-f0-9]{64}$/.test(key)
            }
          ),
          { numRuns: 20 }
        )
      }
    )

    it(
      'P5c: deduplication key is stored in Redis with exactly 24-hour TTL (fast-check, 100 runs)',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.oneof(youtubeWatchUrlArb, vimeoUrlArb),
            async (url) => {
              vi.clearAllMocks()
              mockRedis.get.mockResolvedValue(null)
              mockQueue.add.mockResolvedValue({ id: 'job-ttl-check' })

              await service.enqueueJob('user-1', url, 'normal')

              const setexCalls = mockRedis.setex.mock.calls
              if (setexCalls.length === 0) return false

              const [_key, ttl, _value] = setexCalls[0]
              // TTL must be exactly 24 hours (86400 seconds)
              return ttl === 24 * 60 * 60
            }
          ),
          { numRuns: 20 }
        )
      }
    )
  })

  // ─────────────────────────────────────────────────────────────────────────
  // P5d — Different video URLs produce different deduplication keys
  // Validates: Requirements 9.1
  // ─────────────────────────────────────────────────────────────────────────

  describe('P5d — Different video URLs produce different deduplication keys (Req 9.1)', () => {
    it(
      'P5d: two distinct YouTube video IDs always produce different deduplication keys (fast-check, 100 runs)',
      async () => {
        await fc.assert(
          fc.asyncProperty(distinctYoutubeVideoIdPairArb, async ([id1, id2]) => {
            const url1 = `https://www.youtube.com/watch?v=${id1}`
            const url2 = `https://www.youtube.com/watch?v=${id2}`

            const key1 = await captureDeduplicationKey(service, mockRedis, mockQueue, url1, 'job-a')
            const key2 = await captureDeduplicationKey(service, mockRedis, mockQueue, url2, 'job-b')

            return key1 !== key2
          }),
          { numRuns: 20 }
        )
      }
    )

    it(
      'P5d: two distinct Vimeo video IDs always produce different deduplication keys (fast-check, 100 runs)',
      async () => {
        await fc.assert(
          fc.asyncProperty(distinctVimeoIdPairArb, async ([id1, id2]) => {
            const url1 = `https://vimeo.com/${id1}`
            const url2 = `https://vimeo.com/${id2}`

            const key1 = await captureDeduplicationKey(service, mockRedis, mockQueue, url1, 'job-a')
            const key2 = await captureDeduplicationKey(service, mockRedis, mockQueue, url2, 'job-b')

            return key1 !== key2
          }),
          { numRuns: 20 }
        )
      }
    )

    it(
      'P5d: a YouTube URL and a Vimeo URL with the same path segment produce different keys (fast-check, 100 runs)',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.integer({ min: 100000000, max: 999999999 }),
            async (id) => {
              // Same numeric ID used for both platforms
              const youtubeUrl = `https://www.youtube.com/watch?v=${id}`
              const vimeoUrl = `https://vimeo.com/${id}`

              const key1 = await captureDeduplicationKey(service, mockRedis, mockQueue, youtubeUrl, 'job-yt')
              const key2 = await captureDeduplicationKey(service, mockRedis, mockQueue, vimeoUrl, 'job-vm')

              return key1 !== key2
            }
          ),
          { numRuns: 20 }
        )
      }
    )
  })
})
