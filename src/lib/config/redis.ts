/**
 * Redis Connection Configuration
 * 
 * Provides a centralized Redis connection instance for BullMQ and other Redis operations.
 * Uses ioredis for connection management with automatic reconnection and error handling.
 */

import Redis from 'ioredis'

// Redis connection URL from environment variables
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

/**
 * Create a new Redis connection instance
 * 
 * Configuration:
 * - maxRetriesPerRequest: null (required for BullMQ)
 * - enableReadyCheck: false (improves connection performance)
 * - retryStrategy: Exponential backoff with max 3 seconds delay
 */
export function createRedisConnection(): Redis {
  const redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 3000)
      return delay
    },
  })

  redis.on('error', (error) => {
    console.error('[Redis] Connection error:', error.message)
  })

  redis.on('connect', () => {
    console.log('[Redis] Connected successfully')
  })

  redis.on('ready', () => {
    console.log('[Redis] Ready to accept commands')
  })

  redis.on('close', () => {
    console.log('[Redis] Connection closed')
  })

  return redis
}

/**
 * Shared Redis connection instance for the application
 * Use this for general Redis operations (not BullMQ queues)
 *
 * Lazily initialized to avoid connecting at module load time,
 * which would cause build failures in environments without Redis (e.g. Vercel CI).
 */
let _redis: Redis | null = null

export function getRedis(): Redis {
  if (!_redis) {
    _redis = createRedisConnection()
  }
  return _redis
}

/**
 * @deprecated Use getRedis() for new code. This proxy exists for backward compatibility
 * and avoids an eager connection at import time.
 */
export const redis = new Proxy({} as Redis, {
  get(_target, prop) {
    return (getRedis() as any)[prop]
  },
})

/**
 * Test Redis connectivity
 * Returns true if Redis is accessible, false otherwise
 */
export async function testRedisConnection(): Promise<boolean> {
  try {
    const result = await getRedis().ping()
    return result === 'PONG'
  } catch (error) {
    console.error('[Redis] Connection test failed:', error)
    return false
  }
}
