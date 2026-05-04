/**
 * Property-Based Tests — Rate Limiting Enforcement (Task 15.14)
 *
 * **Validates: Requirements 10.1, 10.3**
 *
 * Property 6: Rate Limiting Enforcement
 *
 * For any user submitting jobs:
 *   P6a — Submitting 10 jobs within the same hour all succeed (return true).
 *   P6b — The 11th job submission within the same hour is rejected (returns false).
 *   P6c — After the hour rolls over (new hour key), the counter resets and
 *          submissions succeed again.
 *
 * Redis (ioredis) is mocked via vi.mock so no real infrastructure is needed.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fc from 'fast-check'
import { checkRateLimit } from '../../lib/services/rate-limiter'
import { createRedisConnection } from '../../lib/config/redis'

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

vi.mock('../../lib/config/redis')
vi.mock('../../lib/env', () => ({
  queueProcessorEnv: {
    rateLimitPerHour: 10,
  },
}))

// ─────────────────────────────────────────────────────────────────────────────
// Arbitraries
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates a realistic user ID string (alphanumeric, 4–36 chars).
 */
const arbUserId = fc
  .string({ minLength: 4, maxLength: 36 })
  .filter((s) => /^[a-zA-Z0-9_-]+$/.test(s))

// ─────────────────────────────────────────────────────────────────────────────
// Helper: build a stateful mock Redis that simulates a real in-memory counter
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a mock Redis client whose `get`/`incr`/`expire` methods share a
 * simple in-memory counter keyed by Redis key string.
 *
 * This lets us simulate sequential `checkRateLimit` calls without a real Redis
 * instance while still exercising the actual rate-limiter logic.
 */
function buildStatefulMockRedis() {
  const store: Record<string, number> = {}

  const mockRedis = {
    get: vi.fn(async (key: string) => {
      const val = store[key]
      return val !== undefined ? String(val) : null
    }),
    incr: vi.fn(async (key: string) => {
      store[key] = (store[key] ?? 0) + 1
      return store[key]
    }),
    expire: vi.fn(async () => 1),
    quit: vi.fn(async () => undefined),
    _store: store,
  }

  return mockRedis
}

// ─────────────────────────────────────────────────────────────────────────────
// Property 6: Rate Limiting Enforcement
// ─────────────────────────────────────────────────────────────────────────────

describe('Property 6: Rate Limiting Enforcement (Requirements 10.1, 10.3)', () => {

  let mockRedis: ReturnType<typeof buildStatefulMockRedis>

  beforeEach(() => {
    mockRedis = buildStatefulMockRedis()
    vi.mocked(createRedisConnection).mockReturnValue(mockRedis as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  // ── P6a: First 10 submissions within the same hour all succeed ────────────

  describe('P6a — First 10 submissions within the same hour all succeed (Req 10.1)', () => {
    it('should return true for all 10 submissions within the same hour', async () => {
      await fc.assert(
        fc.asyncProperty(arbUserId, async (userId) => {
          // Fresh stateful mock for each property run
          const redis = buildStatefulMockRedis()
          vi.mocked(createRedisConnection).mockReturnValue(redis as any)

          const results: boolean[] = []
          for (let i = 0; i < 10; i++) {
            results.push(await checkRateLimit(userId, 10))
          }

          // All 10 must succeed
          return results.every((r) => r === true)
        }),
        { numRuns: 20 }
      )
    })

    it('should increment the counter exactly 10 times for 10 allowed submissions', async () => {
      await fc.assert(
        fc.asyncProperty(arbUserId, async (userId) => {
          const redis = buildStatefulMockRedis()
          vi.mocked(createRedisConnection).mockReturnValue(redis as any)

          for (let i = 0; i < 10; i++) {
            await checkRateLimit(userId, 10)
          }

          // incr is called once per allowed submission → 10 times
          return redis.incr.mock.calls.length === 10
        }),
        { numRuns: 20 }
      )
    })
  })

  // ── P6b: 11th submission is rejected ─────────────────────────────────────

  describe('P6b — 11th submission within the same hour is rejected (Req 10.1)', () => {
    it('should return false for the 11th submission', async () => {
      await fc.assert(
        fc.asyncProperty(arbUserId, async (userId) => {
          const redis = buildStatefulMockRedis()
          vi.mocked(createRedisConnection).mockReturnValue(redis as any)

          // Submit 10 jobs — all should succeed
          for (let i = 0; i < 10; i++) {
            await checkRateLimit(userId, 10)
          }

          // 11th submission must be rejected
          const eleventh = await checkRateLimit(userId, 10)
          return eleventh === false
        }),
        { numRuns: 20 }
      )
    })

    it('should not increment the counter when the rate limit is exceeded', async () => {
      await fc.assert(
        fc.asyncProperty(arbUserId, async (userId) => {
          const redis = buildStatefulMockRedis()
          vi.mocked(createRedisConnection).mockReturnValue(redis as any)

          // Fill up to the limit
          for (let i = 0; i < 10; i++) {
            await checkRateLimit(userId, 10)
          }

          const incrCallsBefore = redis.incr.mock.calls.length

          // Attempt beyond the limit
          await checkRateLimit(userId, 10)

          // incr must NOT have been called for the rejected submission
          return redis.incr.mock.calls.length === incrCallsBefore
        }),
        { numRuns: 20 }
      )
    })

    it('should reject all submissions beyond the 10th', async () => {
      await fc.assert(
        fc.asyncProperty(arbUserId, async (userId) => {
          const redis = buildStatefulMockRedis()
          vi.mocked(createRedisConnection).mockReturnValue(redis as any)

          // Fill up to the limit
          for (let i = 0; i < 10; i++) {
            await checkRateLimit(userId, 10)
          }

          // Submissions 11, 12, 13 must all be rejected
          const extra = await Promise.all([
            checkRateLimit(userId, 10),
            checkRateLimit(userId, 10),
            checkRateLimit(userId, 10),
          ])

          return extra.every((r) => r === false)
        }),
        { numRuns: 20 }
      )
    })
  })

  // ── P6c: Counter resets after the hour rolls over ─────────────────────────

  describe('P6c — Counter resets after 1 hour (new hour key) (Req 10.3)', () => {
    it('should use a different Redis key for a different hour', async () => {
      await fc.assert(
        fc.asyncProperty(arbUserId, async (userId) => {
          vi.useFakeTimers()

          // Hour 1: 2024-01-15 14:xx
          const hour1 = new Date('2024-01-15T14:30:00')
          vi.setSystemTime(hour1)

          const redis = buildStatefulMockRedis()
          vi.mocked(createRedisConnection).mockReturnValue(redis as any)

          await checkRateLimit(userId, 10)
          const key1: string = redis.get.mock.calls[0][0]

          vi.clearAllMocks()
          // Reset the mock to a fresh instance for hour 2
          const redis2 = buildStatefulMockRedis()
          vi.mocked(createRedisConnection).mockReturnValue(redis2 as any)

          // Hour 2: 2024-01-15 15:xx
          const hour2 = new Date('2024-01-15T15:30:00')
          vi.setSystemTime(hour2)

          await checkRateLimit(userId, 10)
          const key2: string = redis2.get.mock.calls[0][0]

          vi.useRealTimers()

          // Keys must differ (different hour segment)
          return key1 !== key2
            && key1.includes('2024-01-15-14')
            && key2.includes('2024-01-15-15')
        }),
        { numRuns: 20 }
      )
    })

    it('should allow 10 new submissions after the hour resets', async () => {
      await fc.assert(
        fc.asyncProperty(arbUserId, async (userId) => {
          vi.useFakeTimers()

          // Hour 1: fill up the limit
          const hour1 = new Date('2024-01-15T14:00:00')
          vi.setSystemTime(hour1)

          const redis1 = buildStatefulMockRedis()
          vi.mocked(createRedisConnection).mockReturnValue(redis1 as any)

          for (let i = 0; i < 10; i++) {
            await checkRateLimit(userId, 10)
          }

          // Verify 11th is blocked in hour 1
          const blockedInHour1 = await checkRateLimit(userId, 10)
          if (blockedInHour1 !== false) {
            vi.useRealTimers()
            return false
          }

          // Hour 2: fresh counter — all 10 should succeed
          const hour2 = new Date('2024-01-15T15:00:00')
          vi.setSystemTime(hour2)

          const redis2 = buildStatefulMockRedis()
          vi.mocked(createRedisConnection).mockReturnValue(redis2 as any)

          const resultsHour2: boolean[] = []
          for (let i = 0; i < 10; i++) {
            resultsHour2.push(await checkRateLimit(userId, 10))
          }

          vi.useRealTimers()

          return resultsHour2.every((r) => r === true)
        }),
        { numRuns: 20 }
      )
    })

    it('should use the correct key format: ratelimit:{userId}:{YYYY-MM-DD-HH}', async () => {
      await fc.assert(
        fc.asyncProperty(arbUserId, async (userId) => {
          vi.useFakeTimers()
          const fixedTime = new Date('2024-06-20T09:45:00')
          vi.setSystemTime(fixedTime)

          const redis = buildStatefulMockRedis()
          vi.mocked(createRedisConnection).mockReturnValue(redis as any)

          await checkRateLimit(userId, 10)

          const usedKey: string = redis.get.mock.calls[0][0]

          vi.useRealTimers()

          // Key must match: ratelimit:{userId}:2024-06-20-09
          const expectedKey = `ratelimit:${userId}:2024-06-20-09`
          return usedKey === expectedKey
        }),
        { numRuns: 20 }
      )
    })

    it('should set a 1-hour TTL (3600s) on the first submission of a new hour', async () => {
      await fc.assert(
        fc.asyncProperty(arbUserId, async (userId) => {
          const redis = buildStatefulMockRedis()
          vi.mocked(createRedisConnection).mockReturnValue(redis as any)

          // First submission — count is 0, so expire should be called
          await checkRateLimit(userId, 10)

          const expireCalls = redis.expire.mock.calls
          if (expireCalls.length === 0) return false

          const [_key, ttl] = expireCalls[0]
          return ttl === 3600
        }),
        { numRuns: 20 }
      )
    })

    it('should NOT set TTL on subsequent submissions within the same hour', async () => {
      await fc.assert(
        fc.asyncProperty(arbUserId, async (userId) => {
          const redis = buildStatefulMockRedis()
          vi.mocked(createRedisConnection).mockReturnValue(redis as any)

          // First submission sets TTL
          await checkRateLimit(userId, 10)
          const expireCallsAfterFirst = redis.expire.mock.calls.length

          // Second submission should NOT call expire again
          await checkRateLimit(userId, 10)
          const expireCallsAfterSecond = redis.expire.mock.calls.length

          return expireCallsAfterFirst === 1 && expireCallsAfterSecond === 1
        }),
        { numRuns: 20 }
      )
    })
  })
})
