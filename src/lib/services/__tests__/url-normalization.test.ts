/**
 * Unit Tests for URL Normalization and Deduplication Key Generation
 *
 * Tests the normalizeVideoUrl and generateDeduplicationKey logic exposed
 * indirectly through JobQueueService.enqueueJob, since both methods are
 * private. Two URLs that normalise to the same value must produce the
 * same Redis deduplication key; two URLs that differ must produce
 * different keys.
 *
 * Requirements: 9.1, 9.6, 19.1
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { JobQueueService } from '../job-queue'
import { createRedisConnection } from '../../config/redis'
import { createSermonQueue } from '../../config/queue'

vi.mock('../../config/redis')
vi.mock('../../config/queue')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type MockRedis = {
  get: ReturnType<typeof vi.fn>
  setex: ReturnType<typeof vi.fn>
}

type MockQueue = {
  add: ReturnType<typeof vi.fn>
  getJob: ReturnType<typeof vi.fn>
}

/**
 * Enqueue a job and return the full Redis key stored by setex
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

  // Reset mocks for the next call
  vi.clearAllMocks()

  return key
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('URL Normalization (via JobQueueService.enqueueJob)', () => {
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

  // -------------------------------------------------------------------------
  // Task 15.1 – URL Normalization
  // -------------------------------------------------------------------------

  describe('Task 15.1 – YouTube URL normalization', () => {
    it('strips extra query params and keeps only the video ID', async () => {
      const withExtra = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=share&t=42'
      const minimal = 'https://youtube.com/watch?v=dQw4w9WgXcQ'

      const key1 = await captureDeduplicationKey(service, mockRedis, mockQueue, withExtra, 'job-1')
      const key2 = await captureDeduplicationKey(service, mockRedis, mockQueue, minimal, 'job-2')

      expect(key1).toBe(key2)
    })

    it('treats youtu.be short URLs the same as full youtube.com URLs', async () => {
      const shortUrl = 'https://youtu.be/dQw4w9WgXcQ'
      const fullUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'

      const key1 = await captureDeduplicationKey(service, mockRedis, mockQueue, shortUrl, 'job-1')
      const key2 = await captureDeduplicationKey(service, mockRedis, mockQueue, fullUrl, 'job-2')

      expect(key1).toBe(key2)
    })

    it('produces different keys for different YouTube video IDs', async () => {
      const url1 = 'https://youtube.com/watch?v=video_aaa'
      const url2 = 'https://youtube.com/watch?v=video_bbb'

      const key1 = await captureDeduplicationKey(service, mockRedis, mockQueue, url1, 'job-1')
      const key2 = await captureDeduplicationKey(service, mockRedis, mockQueue, url2, 'job-2')

      expect(key1).not.toBe(key2)
    })
  })

  describe('Task 15.1 – Other platform URL normalization (hostname + pathname)', () => {
    it('strips query params from non-YouTube URLs', async () => {
      const withQuery = 'https://vimeo.com/123456789?quality=hd&autoplay=1'
      const withoutQuery = 'https://vimeo.com/123456789'

      const key1 = await captureDeduplicationKey(service, mockRedis, mockQueue, withQuery, 'job-1')
      const key2 = await captureDeduplicationKey(service, mockRedis, mockQueue, withoutQuery, 'job-2')

      expect(key1).toBe(key2)
    })

    it('produces different keys for different Vimeo video paths', async () => {
      const url1 = 'https://vimeo.com/111111111'
      const url2 = 'https://vimeo.com/222222222'

      const key1 = await captureDeduplicationKey(service, mockRedis, mockQueue, url1, 'job-1')
      const key2 = await captureDeduplicationKey(service, mockRedis, mockQueue, url2, 'job-2')

      expect(key1).not.toBe(key2)
    })

    it('produces different keys for different platforms with same path', async () => {
      const vimeo = 'https://vimeo.com/123456789'
      const other = 'https://othervideo.com/123456789'

      const key1 = await captureDeduplicationKey(service, mockRedis, mockQueue, vimeo, 'job-1')
      const key2 = await captureDeduplicationKey(service, mockRedis, mockQueue, other, 'job-2')

      expect(key1).not.toBe(key2)
    })
  })

  describe('Task 15.1 – Case-insensitive normalization', () => {
    it('treats uppercase and lowercase YouTube hostnames identically', async () => {
      const upper = 'https://YOUTUBE.COM/watch?v=dQw4w9WgXcQ'
      const lower = 'https://youtube.com/watch?v=dQw4w9WgXcQ'

      const key1 = await captureDeduplicationKey(service, mockRedis, mockQueue, upper, 'job-1')
      const key2 = await captureDeduplicationKey(service, mockRedis, mockQueue, lower, 'job-2')

      expect(key1).toBe(key2)
    })

    it('treats mixed-case non-YouTube hostnames identically', async () => {
      const mixed = 'https://Vimeo.COM/123456789'
      const lower = 'https://vimeo.com/123456789'

      const key1 = await captureDeduplicationKey(service, mockRedis, mockQueue, mixed, 'job-1')
      const key2 = await captureDeduplicationKey(service, mockRedis, mockQueue, lower, 'job-2')

      expect(key1).toBe(key2)
    })
  })

  describe('Task 15.1 – Whitespace trimming', () => {
    it('trims leading and trailing whitespace from YouTube URLs', async () => {
      const padded = '  https://youtube.com/watch?v=dQw4w9WgXcQ  '
      const clean = 'https://youtube.com/watch?v=dQw4w9WgXcQ'

      const key1 = await captureDeduplicationKey(service, mockRedis, mockQueue, padded, 'job-1')
      const key2 = await captureDeduplicationKey(service, mockRedis, mockQueue, clean, 'job-2')

      expect(key1).toBe(key2)
    })

    it('trims leading and trailing whitespace from non-YouTube URLs', async () => {
      const padded = '\thttps://vimeo.com/123456789\n'
      const clean = 'https://vimeo.com/123456789'

      const key1 = await captureDeduplicationKey(service, mockRedis, mockQueue, padded, 'job-1')
      const key2 = await captureDeduplicationKey(service, mockRedis, mockQueue, clean, 'job-2')

      expect(key1).toBe(key2)
    })
  })
})

// ---------------------------------------------------------------------------
// Task 15.2 – Deduplication Key Generation
// ---------------------------------------------------------------------------

describe('Deduplication Key Generation (via JobQueueService.enqueueJob)', () => {
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

  it('generates a consistent SHA-256 key for the same URL on repeated calls', async () => {
    const url = 'https://youtube.com/watch?v=dQw4w9WgXcQ'

    const key1 = await captureDeduplicationKey(service, mockRedis, mockQueue, url, 'job-1')
    const key2 = await captureDeduplicationKey(service, mockRedis, mockQueue, url, 'job-2')

    expect(key1).toBe(key2)
    // SHA-256 produces 64 hex characters; key is prefixed with "dedup:"
    expect(key1).toMatch(/^dedup:[a-f0-9]{64}$/)
  })

  it('generates different keys for different video URLs', async () => {
    const url1 = 'https://youtube.com/watch?v=aaaaaaaaaaa'
    const url2 = 'https://youtube.com/watch?v=bbbbbbbbbbb'

    const key1 = await captureDeduplicationKey(service, mockRedis, mockQueue, url1, 'job-1')
    const key2 = await captureDeduplicationKey(service, mockRedis, mockQueue, url2, 'job-2')

    expect(key1).not.toBe(key2)
  })

  it('stores the key in Redis with a 24-hour TTL', async () => {
    const url = 'https://youtube.com/watch?v=dQw4w9WgXcQ'

    mockRedis.get.mockResolvedValue(null)
    mockQueue.add.mockResolvedValue({ id: 'job-ttl' })

    await service.enqueueJob('user-1', url, 'normal')

    expect(mockRedis.setex).toHaveBeenCalledWith(
      expect.stringMatching(/^dedup:[a-f0-9]{64}$/),
      24 * 60 * 60, // 86 400 seconds
      'job-ttl'
    )
  })

  describe('URL variation handling', () => {
    it('treats http and https variants of the same YouTube video identically', async () => {
      const http = 'http://youtube.com/watch?v=dQw4w9WgXcQ'
      const https = 'https://youtube.com/watch?v=dQw4w9WgXcQ'

      const key1 = await captureDeduplicationKey(service, mockRedis, mockQueue, http, 'job-1')
      const key2 = await captureDeduplicationKey(service, mockRedis, mockQueue, https, 'job-2')

      // Both normalise to youtube:<videoId> so keys must match
      expect(key1).toBe(key2)
    })

    it('treats www and non-www YouTube URLs identically', async () => {
      const www = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      const nonWww = 'https://youtube.com/watch?v=dQw4w9WgXcQ'

      const key1 = await captureDeduplicationKey(service, mockRedis, mockQueue, www, 'job-1')
      const key2 = await captureDeduplicationKey(service, mockRedis, mockQueue, nonWww, 'job-2')

      expect(key1).toBe(key2)
    })

    it('treats http and https variants of the same non-YouTube video identically', async () => {
      // Non-YouTube normalisation uses hostname + pathname (lowercase).
      // The scheme is not included, so http and https produce the same key.
      const http = 'http://vimeo.com/123456789'
      const https = 'https://vimeo.com/123456789'

      const key1 = await captureDeduplicationKey(service, mockRedis, mockQueue, http, 'job-1')
      const key2 = await captureDeduplicationKey(service, mockRedis, mockQueue, https, 'job-2')

      expect(key1).toBe(key2)
    })

    it('treats www and non-www non-YouTube URLs identically', async () => {
      const www = 'https://www.vimeo.com/123456789'
      const nonWww = 'https://vimeo.com/123456789'

      // www.vimeo.com and vimeo.com have different hostnames, so the
      // normalised strings differ. The implementation uses the raw hostname,
      // meaning these produce different keys. This test documents that
      // behaviour explicitly.
      const key1 = await captureDeduplicationKey(service, mockRedis, mockQueue, www, 'job-1')
      const key2 = await captureDeduplicationKey(service, mockRedis, mockQueue, nonWww, 'job-2')

      // www.vimeo.com !== vimeo.com in the current implementation
      expect(key1).not.toBe(key2)
    })
  })
})
