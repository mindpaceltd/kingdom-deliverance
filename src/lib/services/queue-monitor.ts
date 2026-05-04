/**
 * Queue Monitor Service
 *
 * Checks critical queue conditions and logs alerts when thresholds are exceeded.
 * Used by the health check endpoint and can be called periodically for proactive monitoring.
 *
 * Alert thresholds:
 * - Queue length (waiting + active) > 100
 * - Failed jobs in past hour > 10
 * - Redis connection lost
 *
 * Requirements: 13.7
 */

import { Queue } from 'bullmq'
import { createRedisConnection } from '@/lib/config/redis'
import { SERMON_QUEUE_NAME } from '@/lib/config/queue'

/** Severity level of an alert */
export type AlertSeverity = 'warning' | 'error'

/** A single alert produced by checkQueueAlerts() */
export interface QueueAlert {
  severity: AlertSeverity
  condition: string
  currentValue: number | string
  threshold: number | string
  timestamp: string
  message: string
}

/** Thresholds used for alerting */
const THRESHOLDS = {
  QUEUE_LENGTH: 100,
  FAILED_JOBS_PER_HOUR: 10,
} as const

/**
 * Check all critical queue conditions and return an array of alerts.
 *
 * Side effects:
 * - Logs `console.warn` for WARNING-level alerts
 * - Logs `console.error` for ERROR-level alerts
 *
 * Each log line follows the format:
 *   [QueueMonitor] WARNING: <message>
 *   [QueueMonitor] ERROR: <message>
 */
export async function checkQueueAlerts(): Promise<QueueAlert[]> {
  const alerts: QueueAlert[] = []
  const timestamp = new Date().toISOString()

  // ── 1. Check Redis connectivity ──────────────────────────────────────────
  const redis = createRedisConnection()
  let redisUp = false

  try {
    const pong = await redis.ping()
    redisUp = pong === 'PONG'
  } catch {
    redisUp = false
  } finally {
    await redis.quit().catch(() => {
      // Ignore quit errors during monitoring
    })
  }

  if (!redisUp) {
    const alert: QueueAlert = {
      severity: 'error',
      condition: 'Redis connection lost',
      currentValue: 'unreachable',
      threshold: 'reachable',
      timestamp,
      message: 'Redis connection lost',
    }
    console.error(`[QueueMonitor] ERROR: ${alert.message}`)
    alerts.push(alert)

    // Cannot check queue stats without Redis — return early
    return alerts
  }

  // ── 2. Check queue length (waiting + active) ─────────────────────────────
  const connection = createRedisConnection()
  const queue = new Queue(SERMON_QUEUE_NAME, { connection })

  try {
    const [activeCount, waitingCount, failedCount] = await Promise.all([
      queue.getActiveCount(),
      queue.getWaitingCount(),
      queue.getFailedCount(),
    ])

    const totalQueueLength = activeCount + waitingCount

    if (totalQueueLength > THRESHOLDS.QUEUE_LENGTH) {
      const alert: QueueAlert = {
        severity: 'warning',
        condition: 'Queue length exceeds threshold',
        currentValue: totalQueueLength,
        threshold: THRESHOLDS.QUEUE_LENGTH,
        timestamp,
        message: `Queue length (${totalQueueLength}) exceeds threshold (${THRESHOLDS.QUEUE_LENGTH})`,
      }
      console.warn(`[QueueMonitor] WARNING: ${alert.message}`)
      alerts.push(alert)
    }

    // ── 3. Check failed jobs count ──────────────────────────────────────────
    if (failedCount > THRESHOLDS.FAILED_JOBS_PER_HOUR) {
      const alert: QueueAlert = {
        severity: 'warning',
        condition: 'Failed jobs count exceeds threshold',
        currentValue: failedCount,
        threshold: THRESHOLDS.FAILED_JOBS_PER_HOUR,
        timestamp,
        message: `Failed jobs in past hour (${failedCount}) exceeds threshold (${THRESHOLDS.FAILED_JOBS_PER_HOUR})`,
      }
      console.warn(`[QueueMonitor] WARNING: ${alert.message}`)
      alerts.push(alert)
    }
  } finally {
    await queue.close().catch(() => {
      // Ignore close errors during monitoring
    })
  }

  return alerts
}
