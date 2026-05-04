/**
 * Rate Limiter Service
 * 
 * Implements Redis-based rate limiting with 1-hour sliding window.
 * Prevents queue flooding by enforcing a limit of 10 job submissions per user per hour.
 * 
 * Features:
 * - Redis-backed counters with automatic expiration
 * - 1-hour sliding window (resets every hour)
 * - Efficient key-based tracking per user
 * 
 * Requirements: 10.1, 10.3
 */

import { createRedisConnection } from '../config/redis'
import { queueProcessorEnv } from '../env'

/**
 * Check if a user has exceeded the rate limit for job submissions
 * 
 * Uses Redis to track submission counts with 1-hour sliding window.
 * Key format: ratelimit:{userId}:{hour_timestamp}
 * 
 * @param userId - The ID of the user to check
 * @param limit - Maximum number of submissions allowed per hour (default: 10)
 * @returns true if under limit (can submit), false if exceeded (cannot submit)
 * 
 * @example
 * ```typescript
 * const canSubmit = await checkRateLimit('user-123', 10)
 * if (!canSubmit) {
 *   return { error: 'Rate limit exceeded. Try again later.' }
 * }
 * ```
 */
export async function checkRateLimit(
  userId: string,
  limit: number = queueProcessorEnv.rateLimitPerHour
): Promise<boolean> {
  const redis = createRedisConnection()

  try {
    // Generate hour-based timestamp for sliding window
    // This creates a new key every hour (e.g., 2024-01-15-14 for 2:00 PM)
    const now = new Date()
    const hourTimestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}`
    
    // Redis key format: ratelimit:{userId}:{hour_timestamp}
    const key = `ratelimit:${userId}:${hourTimestamp}`

    // Get current count for this hour
    const currentCount = await redis.get(key)
    const count = currentCount ? parseInt(currentCount, 10) : 0

    // Check if user has exceeded limit
    if (count >= limit) {
      return false // Rate limit exceeded
    }

    // Increment counter
    await redis.incr(key)

    // Set expiration to 1 hour (3600 seconds) if this is the first request in this hour
    // This ensures the key automatically expires after 1 hour
    if (count === 0) {
      await redis.expire(key, 3600)
    }

    return true // Under limit, can proceed
  } catch (error) {
    console.error('[Rate Limiter] Error checking rate limit:', error)
    // On error, allow the request to proceed (fail open)
    // This prevents rate limiter failures from blocking all requests
    return true
  } finally {
    // Close the Redis connection to prevent memory leaks
    await redis.quit()
  }
}

/**
 * Get the current rate limit count for a user
 * 
 * Useful for displaying remaining quota to users.
 * 
 * @param userId - The ID of the user to check
 * @returns Current count of submissions in the current hour
 * 
 * @example
 * ```typescript
 * const count = await getRateLimitCount('user-123')
 * console.log(`You have used ${count} of 10 submissions this hour`)
 * ```
 */
export async function getRateLimitCount(userId: string): Promise<number> {
  const redis = createRedisConnection()

  try {
    const now = new Date()
    const hourTimestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}`
    
    const key = `ratelimit:${userId}:${hourTimestamp}`
    const currentCount = await redis.get(key)
    
    return currentCount ? parseInt(currentCount, 10) : 0
  } catch (error) {
    console.error('[Rate Limiter] Error getting rate limit count:', error)
    return 0
  } finally {
    await redis.quit()
  }
}

/**
 * Get the time remaining until the rate limit resets
 * 
 * @param userId - The ID of the user to check
 * @returns Minutes remaining until the current hour ends and limit resets
 * 
 * @example
 * ```typescript
 * const minutes = await getRateLimitResetTime('user-123')
 * console.log(`Rate limit resets in ${minutes} minutes`)
 * ```
 */
export async function getRateLimitResetTime(userId: string): Promise<number> {
  const now = new Date()
  const minutesUntilNextHour = 60 - now.getMinutes()
  return minutesUntilNextHour
}
