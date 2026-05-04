/**
 * Integration Tests for Rate Limiter Service
 *
 * Tests rate limiting enforcement across multiple job submissions using
 * mocked Redis. Validates the 10-jobs-per-hour limit and counter reset
 * behaviour.
 *
 * Requirements: 10.1, 10.2, 19.2
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { checkRateLimit, getRateLimitCount, getRateLimitResetTime } from '../rate-limiter'
import { createRedisConnection } from '../../config/redis'

// Mock external dependencies
vi.mock('../../config/redis')
vi.mock('../../env', () => ({
  queueProcessorEnv: {
    rateLimitPerHour: 10,
  },
}))

// ─────────────────────────────────────────────────────────────────────────────
// Task 15.6 — Rate Limiting Integration
// ─────────────────────────────────────────────────────────────────────────────

describe('Task 15.6 — Rate Limiting Integration', () => {
  let mockRedis: any

  beforeEach(() => {
    mockRedis = {
      get: vi.fn(),
      incr: vi.fn(),
      expire: vi.fn().mockResolvedValue(1),
      quit: vi.fn().mockResolvedValue(undefined),
    }

    vi.mocked(createRedisConnection).mockReturnValue(mockRedis)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Submit 10 jobs — all should succeed (Req 10.1)', () => {
    it('should allow all 10 submissions within the hourly limit', async () => {
      // Arrange — simulate counter incrementing from 0 to 9
      const results: boolean[] = []

      for (let i = 0; i < 10; i++) {
        mockRedis.get.mockResolvedValueOnce(i === 0 ? null : String(i))
        mockRedis.incr.mockResolvedValueOnce(i + 1)

        // Act
        const allowed = await checkRateLimit('user-rate-test', 10)
        results.push(allowed)
      }

      // Assert — all 10 allowed
      expect(results).toHaveLength(10)
      expect(results.every((r) => r === true)).toBe(true)
    })

    it('should increment the Redis counter for each submission', async () => {
      // Arrange
      mockRedis.get.mockResolvedValue('5') // already at 5
      mockRedis.incr.mockResolvedValue(6)

      // Act
      const allowed = await checkRateLimit('user-incr-test', 10)

      // Assert
      expect(allowed).toBe(true)
      expect(mockRedis.incr).toHaveBeenCalledOnce()
    })

    it('should set 1-hour TTL on the first submission of the hour', async () => {
      // Arrange — first submission (count is null/0)
      mockRedis.get.mockResolvedValue(null)
      mockRedis.incr.mockResolvedValue(1)

      // Act
      await checkRateLimit('user-ttl-test', 10)

      // Assert — TTL set to 3600 seconds (1 hour)
      expect(mockRedis.expire).toHaveBeenCalledWith(
        expect.stringContaining('ratelimit:user-ttl-test:'),
        3600
      )
    })

    it('should NOT reset TTL on subsequent submissions within the same hour', async () => {
      // Arrange — not the first submission
      mockRedis.get.mockResolvedValue('3')
      mockRedis.incr.mockResolvedValue(4)

      // Act
      await checkRateLimit('user-no-ttl-reset', 10)

      // Assert — expire NOT called again
      expect(mockRedis.expire).not.toHaveBeenCalled()
    })
  })

  describe('Submit 11th job — should be rate limited (Req 10.2)', () => {
    it('should block the 11th submission when limit is 10', async () => {
      // Arrange — counter is already at 10 (limit reached)
      mockRedis.get.mockResolvedValue('10')

      // Act
      const allowed = await checkRateLimit('user-blocked', 10)

      // Assert — blocked
      expect(allowed).toBe(false)
      expect(mockRedis.incr).not.toHaveBeenCalled()
    })

    it('should block when counter exceeds the limit', async () => {
      // Arrange — counter is above limit (e.g., due to concurrent requests)
      mockRedis.get.mockResolvedValue('15')

      // Act
      const allowed = await checkRateLimit('user-over-limit', 10)

      // Assert — blocked
      expect(allowed).toBe(false)
    })

    it('should simulate 10 allowed then 1 blocked in sequence', async () => {
      // Arrange — simulate sequential submissions
      let counter = 0

      mockRedis.get.mockImplementation(async () => {
        return counter === 0 ? null : String(counter)
      })
      mockRedis.incr.mockImplementation(async () => {
        counter++
        return counter
      })

      const results: boolean[] = []

      // Act — 10 submissions
      for (let i = 0; i < 10; i++) {
        results.push(await checkRateLimit('user-seq-test', 10))
      }

      // 11th submission — counter is now 10, should be blocked
      mockRedis.get.mockResolvedValue(String(counter)) // returns '10'
      results.push(await checkRateLimit('user-seq-test', 10))

      // Assert
      expect(results.slice(0, 10).every((r) => r === true)).toBe(true)
      expect(results[10]).toBe(false)
    })
  })

  describe('Counter resets after 1 hour (Req 10.1)', () => {
    it('should use a different Redis key for a different hour', async () => {
      // Arrange
      vi.useFakeTimers()
      mockRedis.get.mockResolvedValue('0')
      mockRedis.incr.mockResolvedValue(1)

      // Act — first hour
      vi.setSystemTime(new Date('2024-06-01T10:30:00'))
      await checkRateLimit('user-hour-reset', 10)
      const keyHour10 = mockRedis.get.mock.calls[0][0]

      // Act — next hour
      vi.setSystemTime(new Date('2024-06-01T11:00:00'))
      await checkRateLimit('user-hour-reset', 10)
      const keyHour11 = mockRedis.get.mock.calls[1][0]

      // Assert — different keys for different hours
      expect(keyHour10).not.toBe(keyHour11)
      expect(keyHour10).toContain('2024-06-01-10')
      expect(keyHour11).toContain('2024-06-01-11')

      vi.useRealTimers()
    })

    it('should allow new submissions after the hour rolls over', async () => {
      // Arrange — simulate hour rollover: old key expired, new key starts at 0
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-06-01T11:00:00'))

      // New hour — Redis returns null (key expired)
      mockRedis.get.mockResolvedValue(null)
      mockRedis.incr.mockResolvedValue(1)

      // Act
      const allowed = await checkRateLimit('user-new-hour', 10)

      // Assert — allowed in new hour
      expect(allowed).toBe(true)
      expect(mockRedis.expire).toHaveBeenCalledWith(
        expect.stringContaining('ratelimit:user-new-hour:2024-06-01-11'),
        3600
      )

      vi.useRealTimers()
    })

    it('should report correct reset time (minutes until next hour)', async () => {
      // Arrange
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-06-01T10:45:00'))

      // Act
      const resetMinutes = await getRateLimitResetTime('user-reset-time')

      // Assert — 15 minutes until 11:00
      expect(resetMinutes).toBe(15)

      vi.useRealTimers()
    })

    it('should report 60 minutes reset time at the start of an hour', async () => {
      // Arrange
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-06-01T10:00:00'))

      // Act
      const resetMinutes = await getRateLimitResetTime('user-reset-start')

      // Assert
      expect(resetMinutes).toBe(60)

      vi.useRealTimers()
    })
  })

  describe('Rate limit isolation per user (Req 10.1)', () => {
    it('should track rate limits independently per user', async () => {
      // Arrange — user-A is at limit, user-B is not
      mockRedis.get.mockImplementation(async (key: string) => {
        if (key.includes('user-A')) return '10' // at limit
        if (key.includes('user-B')) return '3'  // under limit
        return null
      })
      mockRedis.incr.mockResolvedValue(4)

      // Act
      const userAAllowed = await checkRateLimit('user-A', 10)
      const userBAllowed = await checkRateLimit('user-B', 10)

      // Assert
      expect(userAAllowed).toBe(false)
      expect(userBAllowed).toBe(true)
    })
  })

  describe('getRateLimitCount — current usage query (Req 10.1)', () => {
    it('should return current submission count for a user', async () => {
      // Arrange
      mockRedis.get.mockResolvedValue('7')

      // Act
      const count = await getRateLimitCount('user-count-test')

      // Assert
      expect(count).toBe(7)
    })

    it('should return 0 when no submissions made this hour', async () => {
      // Arrange
      mockRedis.get.mockResolvedValue(null)

      // Act
      const count = await getRateLimitCount('user-no-submissions')

      // Assert
      expect(count).toBe(0)
    })
  })

  describe('Fail-open behaviour on Redis error (Req 10.1)', () => {
    it('should allow request when Redis is unavailable', async () => {
      // Arrange — Redis throws an error
      mockRedis.get.mockRejectedValue(new Error('Redis connection refused'))

      // Act
      const allowed = await checkRateLimit('user-redis-down', 10)

      // Assert — fail open: allow request rather than blocking all users
      expect(allowed).toBe(true)
    })
  })
})
