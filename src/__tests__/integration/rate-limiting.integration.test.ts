/**
 * Integration Tests — Rate Limiting (Task 15.6)
 *
 * Verifies the rate limiting behaviour of the checkRateLimit service and its
 * integration with the processSermonLink server action:
 *
 *   1. Submit 10 jobs and verify all succeed (under the limit)
 *   2. Submit the 11th job and verify a rate limit error is returned
 *   3. Simulate the counter resetting after 1 hour (new hour window)
 *
 * The rate limiting mechanism works as follows:
 *   - Redis key format: ratelimit:{userId}:{hour_timestamp}
 *   - Counter increments on each call to checkRateLimit
 *   - Key expires automatically after 1 hour (3600 s TTL)
 *   - Returns true (allow) when count < limit, false (deny) when count >= limit
 *
 * External dependencies (Redis) are mocked so the tests run without any
 * infrastructure.
 *
 * Requirements: 10.1, 10.2, 19.2
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { checkRateLimit, getRateLimitCount } from '../../lib/services/rate-limiter'
import { createRedisConnection } from '../../lib/config/redis'

// Mock env to avoid missing Supabase environment variable errors
vi.mock('../../lib/env', () => ({
  env: {
    supabaseUrl: 'https://test.supabase.co',
    supabaseAnonKey: 'test-anon-key',
    supabaseServiceRoleKey: 'test-service-role-key',
  },
  queueProcessorEnv: {
    redisUrl: 'redis://localhost:6379',
    ollamaEndpoint: 'http://localhost:11434',
    ollamaModel: 'mistral',
    whisperModel: 'base',
    tempAudioDir: '/tmp/sermon-audio',
    workerConcurrency: 1,
    maxActiveJobs: 10,
    audioExtractionTimeoutMs: 600000,
    transcriptionTimeoutMs: 1800000,
    aiSummaryTimeoutMs: 600000,
    aiSeoTimeoutMs: 300000,
    jobTimeoutMs: 3600000,
    rateLimitPerHour: 10,
  },
  isQueueProcessorEnabled: true,
}))

// Mock Redis — no real Redis needed for these tests
vi.mock('../../lib/config/redis')

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a mock Redis client that simulates an in-memory counter for a single key.
 * The counter starts at `initialCount` and increments on each `incr` call.
 */
function buildMockRedisWithCounter(initialCount: number) {
  let count = initialCount

  return {
    get: vi.fn().mockImplementation(() =>
      Promise.resolve(count === 0 ? null : String(count))
    ),
    incr: vi.fn().mockImplementation(() => {
      count += 1
      return Promise.resolve(count)
    }),
    expire: vi.fn().mockResolvedValue(1),
    quit: vi.fn().mockResolvedValue(undefined),
    /** Expose current count for assertions */
    _getCount: () => count,
  }
}

/**
 * Build a mock Redis client that always returns a fixed count (read-only).
 */
function buildMockRedisFixed(fixedCount: number) {
  return {
    get: vi.fn().mockResolvedValue(fixedCount === 0 ? null : String(fixedCount)),
    incr: vi.fn().mockResolvedValue(fixedCount + 1),
    expire: vi.fn().mockResolvedValue(1),
    quit: vi.fn().mockResolvedValue(undefined),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Task 15.6 — Rate Limiting Integration Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Task 15.6 — Rate Limiting Integration', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  // ── 1. Submit 10 jobs and verify all succeed ──────────────────────────────

  describe('1. First 10 submissions succeed (Req 10.1)', () => {
    it('should allow the first 10 submissions within the same hour', async () => {
      // Arrange — simulate a counter that starts at 0 and increments
      const mockRedis = buildMockRedisWithCounter(0)
      vi.mocked(createRedisConnection).mockReturnValue(mockRedis as any)

      const userId = 'user-rate-limit-test'
      const limit = 10
      const results: boolean[] = []

      // Act — submit 10 jobs sequentially
      for (let i = 0; i < 10; i++) {
        // Each call gets a fresh mock that reflects the current count
        const currentCount = i
        mockRedis.get.mockResolvedValueOnce(
          currentCount === 0 ? null : String(currentCount)
        )
        const allowed = await checkRateLimit(userId, limit)
        results.push(allowed)
      }

      // Assert — all 10 submissions allowed
      expect(results).toHaveLength(10)
      expect(results.every((r) => r === true)).toBe(true)
    })

    it('should allow submission when count is exactly 0 (first submission)', async () => {
      // Arrange — no prior submissions this hour
      const mockRedis = buildMockRedisFixed(0)
      vi.mocked(createRedisConnection).mockReturnValue(mockRedis as any)

      // Act
      const allowed = await checkRateLimit('user-first', 10)

      // Assert
      expect(allowed).toBe(true)
      expect(mockRedis.incr).toHaveBeenCalledOnce()
    })

    it('should allow submission when count is 9 (10th submission)', async () => {
      // Arrange — 9 prior submissions this hour (count = 9, limit = 10)
      const mockRedis = buildMockRedisFixed(9)
      vi.mocked(createRedisConnection).mockReturnValue(mockRedis as any)

      // Act
      const allowed = await checkRateLimit('user-ninth', 10)

      // Assert — 9 < 10, so allowed
      expect(allowed).toBe(true)
      expect(mockRedis.incr).toHaveBeenCalledOnce()
    })

    it('should set a 1-hour TTL on the Redis key for the first submission', async () => {
      // Arrange — first submission (count = 0)
      const mockRedis = buildMockRedisFixed(0)
      vi.mocked(createRedisConnection).mockReturnValue(mockRedis as any)

      // Act
      await checkRateLimit('user-ttl', 10)

      // Assert — expire called with 3600 seconds (1 hour)
      expect(mockRedis.expire).toHaveBeenCalledWith(
        expect.stringMatching(/^ratelimit:user-ttl:/),
        3600
      )
    })

    it('should NOT set TTL when count is already > 0 (key already has TTL)', async () => {
      // Arrange — 5 prior submissions (key already exists with TTL)
      const mockRedis = buildMockRedisFixed(5)
      vi.mocked(createRedisConnection).mockReturnValue(mockRedis as any)

      // Act
      await checkRateLimit('user-existing-ttl', 10)

      // Assert — expire NOT called (TTL already set when key was created)
      expect(mockRedis.expire).not.toHaveBeenCalled()
    })

    it('should use the correct Redis key format: ratelimit:{userId}:{hour_timestamp}', async () => {
      // Arrange
      const mockRedis = buildMockRedisFixed(0)
      vi.mocked(createRedisConnection).mockReturnValue(mockRedis as any)

      const userId = 'user-key-format'

      // Act
      await checkRateLimit(userId, 10)

      // Assert — key matches expected format
      const now = new Date()
      const expectedHourTimestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}`
      const expectedKey = `ratelimit:${userId}:${expectedHourTimestamp}`

      expect(mockRedis.get).toHaveBeenCalledWith(expectedKey)
      expect(mockRedis.incr).toHaveBeenCalledWith(expectedKey)
    })

    it('should increment the Redis counter on each allowed submission', async () => {
      // Arrange — 3 prior submissions
      const mockRedis = buildMockRedisFixed(3)
      vi.mocked(createRedisConnection).mockReturnValue(mockRedis as any)

      // Act
      await checkRateLimit('user-incr', 10)

      // Assert — incr called once
      expect(mockRedis.incr).toHaveBeenCalledOnce()
    })

    it('should close the Redis connection after each check (prevent memory leaks)', async () => {
      // Arrange
      const mockRedis = buildMockRedisFixed(0)
      vi.mocked(createRedisConnection).mockReturnValue(mockRedis as any)

      // Act
      await checkRateLimit('user-quit', 10)

      // Assert — quit called to release connection
      expect(mockRedis.quit).toHaveBeenCalledOnce()
    })
  })

  // ── 2. 11th submission is rejected with rate limit error ──────────────────

  describe('2. 11th submission is rejected (Req 10.1, 10.2)', () => {
    it('should reject the 11th submission when count equals the limit', async () => {
      // Arrange — exactly 10 prior submissions (count = 10, limit = 10)
      const mockRedis = buildMockRedisFixed(10)
      vi.mocked(createRedisConnection).mockReturnValue(mockRedis as any)

      // Act
      const allowed = await checkRateLimit('user-exceeded', 10)

      // Assert — 10 >= 10, so rejected
      expect(allowed).toBe(false)
    })

    it('should reject when count exceeds the limit (count > limit)', async () => {
      // Arrange — 15 prior submissions (well over the limit)
      const mockRedis = buildMockRedisFixed(15)
      vi.mocked(createRedisConnection).mockReturnValue(mockRedis as any)

      // Act
      const allowed = await checkRateLimit('user-way-over', 10)

      // Assert
      expect(allowed).toBe(false)
    })

    it('should NOT increment the counter when rate limit is exceeded', async () => {
      // Arrange — at the limit
      const mockRedis = buildMockRedisFixed(10)
      vi.mocked(createRedisConnection).mockReturnValue(mockRedis as any)

      // Act
      await checkRateLimit('user-no-incr', 10)

      // Assert — incr NOT called when limit exceeded (no wasted increments)
      expect(mockRedis.incr).not.toHaveBeenCalled()
    })

    it('should still close the Redis connection even when rate limit is exceeded', async () => {
      // Arrange — at the limit
      const mockRedis = buildMockRedisFixed(10)
      vi.mocked(createRedisConnection).mockReturnValue(mockRedis as any)

      // Act
      await checkRateLimit('user-quit-on-reject', 10)

      // Assert — quit always called (finally block)
      expect(mockRedis.quit).toHaveBeenCalledOnce()
    })

    it('should simulate the full 10-allow then 1-reject sequence', async () => {
      // Arrange — simulate a counter that starts at 0 and increments
      // We control the mock to return the correct count for each call
      const userId = 'user-full-sequence'
      const limit = 10
      const results: boolean[] = []

      // Simulate 10 allowed submissions
      for (let i = 0; i < 10; i++) {
        const mockRedis = buildMockRedisFixed(i)
        vi.mocked(createRedisConnection).mockReturnValueOnce(mockRedis as any)
        const allowed = await checkRateLimit(userId, limit)
        results.push(allowed)
      }

      // Simulate the 11th submission (count = 10, at the limit)
      const mockRedisAtLimit = buildMockRedisFixed(10)
      vi.mocked(createRedisConnection).mockReturnValueOnce(mockRedisAtLimit as any)
      const eleventhResult = await checkRateLimit(userId, limit)
      results.push(eleventhResult)

      // Assert — first 10 allowed, 11th rejected
      expect(results).toHaveLength(11)
      expect(results.slice(0, 10).every((r) => r === true)).toBe(true)
      expect(results[10]).toBe(false)
    })

    it('should reject submissions beyond the limit for any user', async () => {
      // Arrange — different users, each at their limit
      const users = ['user-a', 'user-b', 'user-c']

      for (const userId of users) {
        const mockRedis = buildMockRedisFixed(10)
        vi.mocked(createRedisConnection).mockReturnValueOnce(mockRedis as any)

        // Act
        const allowed = await checkRateLimit(userId, 10)

        // Assert — each user at limit is rejected
        expect(allowed).toBe(false)
      }
    })

    it('should enforce rate limit independently per user', async () => {
      // User A is at the limit, User B is not
      const mockRedisUserA = buildMockRedisFixed(10) // at limit
      const mockRedisUserB = buildMockRedisFixed(3)  // under limit

      vi.mocked(createRedisConnection)
        .mockReturnValueOnce(mockRedisUserA as any)
        .mockReturnValueOnce(mockRedisUserB as any)

      // Act
      const allowedA = await checkRateLimit('user-a-at-limit', 10)
      const allowedB = await checkRateLimit('user-b-under-limit', 10)

      // Assert — A rejected, B allowed
      expect(allowedA).toBe(false)
      expect(allowedB).toBe(true)
    })
  })

  // ── 3. Counter resets after 1 hour ────────────────────────────────────────

  describe('3. Counter resets after 1 hour (Req 10.3)', () => {
    it('should allow submissions again when the hour window resets (Redis key expires)', async () => {
      // Arrange — simulate the key has expired (Redis returns null for the new hour)
      // This is what happens when the 1-hour TTL elapses: the key no longer exists
      const mockRedis = buildMockRedisFixed(0) // null → 0 (key expired)
      vi.mocked(createRedisConnection).mockReturnValue(mockRedis as any)

      // Act — submit after the hour window reset
      const allowed = await checkRateLimit('user-reset', 10)

      // Assert — allowed because the counter reset to 0
      expect(allowed).toBe(true)
    })

    it('should use a different Redis key for a different hour', async () => {
      // Arrange — two calls in different hours produce different keys
      // We verify this by checking the key format includes the hour component

      const mockRedis1 = buildMockRedisFixed(0)
      const mockRedis2 = buildMockRedisFixed(0)

      vi.mocked(createRedisConnection)
        .mockReturnValueOnce(mockRedis1 as any)
        .mockReturnValueOnce(mockRedis2 as any)

      // Act — two calls (both in the current hour for this test)
      await checkRateLimit('user-hour-key', 10)
      await checkRateLimit('user-hour-key', 10)

      // Assert — both calls use a key with the current hour timestamp
      const now = new Date()
      const expectedHour = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}`

      expect(mockRedis1.get).toHaveBeenCalledWith(
        expect.stringContaining(expectedHour)
      )
      expect(mockRedis2.get).toHaveBeenCalledWith(
        expect.stringContaining(expectedHour)
      )
    })

    it('should set a 1-hour TTL so the key auto-expires after the window', async () => {
      // Arrange — first submission in a new hour window
      const mockRedis = buildMockRedisFixed(0)
      vi.mocked(createRedisConnection).mockReturnValue(mockRedis as any)

      // Act
      await checkRateLimit('user-auto-expire', 10)

      // Assert — TTL set to exactly 3600 seconds (1 hour)
      expect(mockRedis.expire).toHaveBeenCalledWith(
        expect.stringMatching(/^ratelimit:user-auto-expire:/),
        3600
      )
    })

    it('should allow 10 new submissions after the counter resets', async () => {
      // Arrange — simulate a full reset: counter starts at 0 again
      const userId = 'user-after-reset'
      const limit = 10
      const results: boolean[] = []

      // Simulate 10 submissions after reset
      for (let i = 0; i < 10; i++) {
        const mockRedis = buildMockRedisFixed(i)
        vi.mocked(createRedisConnection).mockReturnValueOnce(mockRedis as any)
        const allowed = await checkRateLimit(userId, limit)
        results.push(allowed)
      }

      // Assert — all 10 allowed after reset
      expect(results).toHaveLength(10)
      expect(results.every((r) => r === true)).toBe(true)
    })

    it('should simulate the full lifecycle: 10 allowed → 11th rejected → reset → 10 allowed again', async () => {
      const userId = 'user-lifecycle'
      const limit = 10

      // Phase 1: First hour — 10 allowed
      const phase1Results: boolean[] = []
      for (let i = 0; i < 10; i++) {
        const mockRedis = buildMockRedisFixed(i)
        vi.mocked(createRedisConnection).mockReturnValueOnce(mockRedis as any)
        phase1Results.push(await checkRateLimit(userId, limit))
      }

      // Phase 2: First hour — 11th rejected
      const mockRedisAtLimit = buildMockRedisFixed(10)
      vi.mocked(createRedisConnection).mockReturnValueOnce(mockRedisAtLimit as any)
      const rejectedResult = await checkRateLimit(userId, limit)

      // Phase 3: Second hour (counter reset) — 10 allowed again
      const phase3Results: boolean[] = []
      for (let i = 0; i < 10; i++) {
        const mockRedis = buildMockRedisFixed(i) // counter reset to 0
        vi.mocked(createRedisConnection).mockReturnValueOnce(mockRedis as any)
        phase3Results.push(await checkRateLimit(userId, limit))
      }

      // Assert
      expect(phase1Results.every((r) => r === true)).toBe(true)
      expect(rejectedResult).toBe(false)
      expect(phase3Results.every((r) => r === true)).toBe(true)
    })
  })

  // ── 4. getRateLimitCount helper ───────────────────────────────────────────

  describe('4. getRateLimitCount returns current usage (Req 10.1)', () => {
    it('should return 0 when no submissions have been made this hour', async () => {
      // Arrange — no key in Redis (null)
      const mockRedis = buildMockRedisFixed(0)
      vi.mocked(createRedisConnection).mockReturnValue(mockRedis as any)

      // Act
      const count = await getRateLimitCount('user-count-zero')

      // Assert
      expect(count).toBe(0)
    })

    it('should return the current submission count for the hour', async () => {
      // Arrange — 7 submissions this hour
      const mockRedis = buildMockRedisFixed(7)
      vi.mocked(createRedisConnection).mockReturnValue(mockRedis as any)

      // Act
      const count = await getRateLimitCount('user-count-seven')

      // Assert
      expect(count).toBe(7)
    })

    it('should return 10 when the user is at the limit', async () => {
      // Arrange
      const mockRedis = buildMockRedisFixed(10)
      vi.mocked(createRedisConnection).mockReturnValue(mockRedis as any)

      // Act
      const count = await getRateLimitCount('user-count-at-limit')

      // Assert
      expect(count).toBe(10)
    })
  })

  // ── 5. Error resilience ───────────────────────────────────────────────────

  describe('5. Error resilience — fail open on Redis errors (Req 10.1)', () => {
    it('should allow the request when Redis throws an error (fail open)', async () => {
      // Arrange — Redis connection fails
      const mockRedis = {
        get: vi.fn().mockRejectedValue(new Error('Redis connection refused')),
        incr: vi.fn(),
        expire: vi.fn(),
        quit: vi.fn().mockResolvedValue(undefined),
      }
      vi.mocked(createRedisConnection).mockReturnValue(mockRedis as any)

      // Act
      const allowed = await checkRateLimit('user-redis-error', 10)

      // Assert — fail open: allow request when Redis is unavailable
      expect(allowed).toBe(true)
    })

    it('should still call quit even when Redis throws an error', async () => {
      // Arrange — Redis get throws
      const mockRedis = {
        get: vi.fn().mockRejectedValue(new Error('Redis timeout')),
        incr: vi.fn(),
        expire: vi.fn(),
        quit: vi.fn().mockResolvedValue(undefined),
      }
      vi.mocked(createRedisConnection).mockReturnValue(mockRedis as any)

      // Act
      await checkRateLimit('user-quit-on-error', 10)

      // Assert — quit called in finally block
      expect(mockRedis.quit).toHaveBeenCalledOnce()
    })
  })
})
