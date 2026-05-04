/**
 * Health Check API Endpoint for Queue Processor
 *
 * GET /api/health/queue
 *
 * Returns the health status of all queue processor dependencies:
 * - Redis connectivity and latency
 * - Ollama availability and version
 * - BullMQ queue stats (active, waiting, failed jobs)
 * - Active alerts from queue monitor (queue length, failed jobs, Redis connectivity)
 *
 * Response codes:
 * - 200: healthy or degraded (Redis is up)
 * - 503: unhealthy (Redis is down)
 *
 * Requirements: 13.3, 13.7
 */

import { NextResponse } from 'next/server'
import { Queue } from 'bullmq'
import { createRedisConnection } from '@/lib/config/redis'
import { SERMON_QUEUE_NAME } from '@/lib/config/queue'
import { checkQueueAlerts, type QueueAlert } from '@/lib/services/queue-monitor'

const OLLAMA_ENDPOINT = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434'

interface RedisServiceStatus {
  status: 'up' | 'down'
  latencyMs?: number
  error?: string
}

interface OllamaServiceStatus {
  status: 'up' | 'down'
  version?: string
  error?: string
}

interface QueueServiceStatus {
  activeJobs: number
  waitingJobs: number
  failedJobs: number
  error?: string
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  services: {
    redis: RedisServiceStatus
    ollama: OllamaServiceStatus
    queue: QueueServiceStatus
  }
  alerts: QueueAlert[]
}

/**
 * Check Redis connectivity and measure latency
 */
async function checkRedis(): Promise<RedisServiceStatus> {
  const redis = createRedisConnection()
  try {
    const start = Date.now()
    const result = await redis.ping()
    const latencyMs = Date.now() - start

    if (result === 'PONG') {
      return { status: 'up', latencyMs }
    }
    return { status: 'down', error: 'Unexpected PING response' }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { status: 'down', error: message }
  } finally {
    await redis.quit().catch(() => {
      // Ignore quit errors during health check
    })
  }
}

/**
 * Check Ollama availability and retrieve version
 */
async function checkOllama(): Promise<OllamaServiceStatus> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`${OLLAMA_ENDPOINT}/api/version`, {
      method: 'GET',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return { status: 'down', error: `HTTP ${response.status}` }
    }

    const data = await response.json()
    return { status: 'up', version: data.version ?? 'unknown' }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { status: 'down', error: message }
  }
}

/**
 * Query BullMQ for queue statistics
 */
async function checkQueue(): Promise<QueueServiceStatus> {
  const connection = createRedisConnection()
  const queue = new Queue(SERMON_QUEUE_NAME, { connection })

  try {
    const [activeCount, waitingCount, failedCount] = await Promise.all([
      queue.getActiveCount(),
      queue.getWaitingCount(),
      queue.getFailedCount(),
    ])

    return {
      activeJobs: activeCount,
      waitingJobs: waitingCount,
      failedJobs: failedCount,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      activeJobs: 0,
      waitingJobs: 0,
      failedJobs: 0,
      error: message,
    }
  } finally {
    await queue.close().catch(() => {
      // Ignore close errors during health check
    })
  }
}

/**
 * Determine overall health status based on service statuses
 *
 * - unhealthy: Redis is down (queue cannot function without Redis)
 * - degraded: Redis is up but Ollama is down (queue works but processing will fail)
 * - healthy: All services are up
 */
function determineOverallStatus(
  redisStatus: RedisServiceStatus,
  ollamaStatus: OllamaServiceStatus
): 'healthy' | 'degraded' | 'unhealthy' {
  if (redisStatus.status === 'down') {
    return 'unhealthy'
  }
  if (ollamaStatus.status === 'down') {
    return 'degraded'
  }
  return 'healthy'
}

export async function GET(): Promise<NextResponse<HealthResponse>> {
  const [redisStatus, ollamaStatus, queueStatus, alerts] = await Promise.all([
    checkRedis(),
    checkOllama(),
    checkQueue(),
    checkQueueAlerts(),
  ])

  const overallStatus = determineOverallStatus(redisStatus, ollamaStatus)

  const body: HealthResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    services: {
      redis: redisStatus,
      ollama: ollamaStatus,
      queue: queueStatus,
    },
    alerts,
  }

  const httpStatus = overallStatus === 'unhealthy' ? 503 : 200

  return NextResponse.json(body, { status: httpStatus })
}
