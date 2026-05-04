/**
 * Unit Tests for BullMQ Queue Configuration
 * 
 * Tests queue creation, configuration, and basic operations
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { createSermonQueue, SERMON_QUEUE_NAME, DEFAULT_JOB_OPTIONS } from '../queue'
import { testRedisConnection } from '../redis'
import { Queue } from 'bullmq'

describe('Queue Configuration', () => {
  let queue: Queue

  beforeAll(async () => {
    // Verify Redis is available before running tests
    const isConnected = await testRedisConnection()
    if (!isConnected) {
      throw new Error('Redis is not available. Please start Redis server.')
    }
  })

  beforeEach(async () => {
    // Create fresh queue for each test
    queue = createSermonQueue()
    // Clean up any existing jobs
    await queue.obliterate({ force: true })
  })

  afterAll(async () => {
    // Clean up and close connections
    if (queue) {
      await queue.obliterate({ force: true })
      await queue.close()
    }
  })

  describe('Queue Creation', () => {
    it('should create a queue with the correct name', () => {
      expect(queue.name).toBe(SERMON_QUEUE_NAME)
    })

    it('should have default job options configured', () => {
      expect(queue.opts.defaultJobOptions).toMatchObject({
        attempts: DEFAULT_JOB_OPTIONS.attempts,
        backoff: DEFAULT_JOB_OPTIONS.backoff,
      })
    })
  })

  describe('Job Enqueueing', () => {
    it('should enqueue a job successfully', async () => {
      const jobData = {
        testId: 'test-001',
        message: 'Test job',
        timestamp: new Date().toISOString(),
      }

      const job = await queue.add('test-job', jobData)

      expect(job.id).toBeDefined()
      expect(job.name).toBe('test-job')
      expect(job.data).toEqual(jobData)
    })

    it('should enqueue multiple jobs', async () => {
      const job1 = await queue.add('job-1', { id: 1 })
      const job2 = await queue.add('job-2', { id: 2 })
      const job3 = await queue.add('job-3', { id: 3 })

      expect(job1.id).toBeDefined()
      expect(job2.id).toBeDefined()
      expect(job3.id).toBeDefined()

      const counts = await queue.getJobCounts('waiting', 'prioritized')
      const totalJobs = (counts.waiting || 0) + (counts.prioritized || 0)
      expect(totalJobs).toBe(3)
    })

    it('should respect job priority', async () => {
      const lowPriorityJob = await queue.add('low', { priority: 'low' }, { priority: 10 })
      const highPriorityJob = await queue.add('high', { priority: 'high' }, { priority: 1 })
      const normalPriorityJob = await queue.add('normal', { priority: 'normal' }, { priority: 5 })

      expect(lowPriorityJob.id).toBeDefined()
      expect(highPriorityJob.id).toBeDefined()
      expect(normalPriorityJob.id).toBeDefined()

      // Verify jobs are in queue
      const counts = await queue.getJobCounts('waiting', 'prioritized')
      const totalJobs = (counts.waiting || 0) + (counts.prioritized || 0)
      expect(totalJobs).toBe(3)
    })
  })

  describe('Job Status Queries', () => {
    it('should retrieve a job by ID', async () => {
      const jobData = { testId: 'retrieve-test' }
      const addedJob = await queue.add('retrieve-job', jobData)

      const retrievedJob = await queue.getJob(addedJob.id!)
      expect(retrievedJob).toBeDefined()
      expect(retrievedJob!.id).toBe(addedJob.id)
      expect(retrievedJob!.data).toEqual(jobData)
    })

    it('should return null for non-existent job', async () => {
      const job = await queue.getJob('non-existent-id')
      expect(job).toBeUndefined()
    })

    it('should get job state', async () => {
      const job = await queue.add('state-test', { test: true })
      const state = await job.getState()
      
      // Job should be in waiting or prioritized state
      expect(['waiting', 'prioritized']).toContain(state)
    })
  })

  describe('Queue Statistics', () => {
    it('should return correct job counts', async () => {
      // Add some jobs
      await queue.add('job-1', { id: 1 })
      await queue.add('job-2', { id: 2 })
      await queue.add('job-3', { id: 3 })

      const counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'prioritized')
      
      // All jobs should be in waiting or prioritized state
      const totalJobs = (counts.waiting || 0) + (counts.prioritized || 0)
      expect(totalJobs).toBe(3)
      expect(counts.active).toBe(0)
      expect(counts.completed).toBe(0)
      expect(counts.failed).toBe(0)
    })

    it('should handle empty queue statistics', async () => {
      const counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed')
      
      expect(counts.waiting).toBe(0)
      expect(counts.active).toBe(0)
      expect(counts.completed).toBe(0)
      expect(counts.failed).toBe(0)
    })
  })

  describe('Job Removal', () => {
    it('should remove a job successfully', async () => {
      const job = await queue.add('remove-test', { test: true })
      const jobId = job.id!

      await job.remove()

      const retrievedJob = await queue.getJob(jobId)
      expect(retrievedJob).toBeUndefined()
    })

    it('should handle removing non-existent job gracefully', async () => {
      const job = await queue.add('remove-test', { test: true })
      const jobId = job.id!
      await job.remove()

      // Verify job is removed
      const retrievedJob = await queue.getJob(jobId)
      expect(retrievedJob).toBeUndefined()

      // Try to remove again - BullMQ handles this gracefully without throwing
      await job.remove()
    })
  })

  describe('Default Job Options', () => {
    it('should apply retry attempts configuration', () => {
      expect(DEFAULT_JOB_OPTIONS.attempts).toBe(3)
    })

    it('should apply exponential backoff configuration', () => {
      expect(DEFAULT_JOB_OPTIONS.backoff.type).toBe('exponential')
      expect(DEFAULT_JOB_OPTIONS.backoff.delay).toBe(60000) // 1 minute
    })

    it('should apply job retention configuration', () => {
      expect(DEFAULT_JOB_OPTIONS.removeOnComplete.age).toBe(7 * 24 * 60 * 60) // 7 days
      expect(DEFAULT_JOB_OPTIONS.removeOnComplete.count).toBe(1000)
      expect(DEFAULT_JOB_OPTIONS.removeOnFail.age).toBe(7 * 24 * 60 * 60) // 7 days
    })
  })
})
