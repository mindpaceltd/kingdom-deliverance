/**
 * BullMQ Queue Configuration
 * 
 * Provides queue configuration and factory functions for creating BullMQ queues.
 * This module sets up the sermon processing queue with appropriate defaults.
 */

import { Queue, QueueOptions } from 'bullmq'
import { createRedisConnection } from './redis'

/**
 * Queue name for sermon processing jobs
 */
export const SERMON_QUEUE_NAME = 'sermon-processing'

/**
 * Default job options for sermon processing queue
 * 
 * Configuration:
 * - attempts: 3 (retry up to 3 times on failure)
 * - backoff: Exponential backoff starting at 1 minute
 * - removeOnComplete: Keep completed jobs for 7 days
 * - removeOnFail: Keep failed jobs for 7 days
 */
export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 60000, // 1 minute base delay (1min, 5min, 15min)
  },
  removeOnComplete: {
    age: 7 * 24 * 60 * 60, // 7 days in seconds
    count: 1000, // Keep max 1000 completed jobs
  },
  removeOnFail: {
    age: 7 * 24 * 60 * 60, // 7 days in seconds
  },
}

/**
 * Create a BullMQ queue instance
 * 
 * @param queueName - Name of the queue
 * @param options - Optional queue configuration
 * @returns Configured Queue instance
 */
export function createQueue<T = any, R = any>(
  queueName: string,
  options?: Partial<QueueOptions>
): Queue<T, R> {
  const connection = createRedisConnection()

  return new Queue<T, R>(queueName, {
    connection,
    defaultJobOptions: DEFAULT_JOB_OPTIONS,
    ...options,
  })
}

/**
 * Create the sermon processing queue
 * 
 * @returns Configured sermon processing Queue instance
 */
export function createSermonQueue() {
  return createQueue(SERMON_QUEUE_NAME)
}
