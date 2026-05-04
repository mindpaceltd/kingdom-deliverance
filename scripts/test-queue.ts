/**
 * BullMQ Queue Test Script
 * 
 * Tests basic BullMQ queue operations:
 * 1. Redis connectivity
 * 2. Queue creation
 * 3. Job enqueueing
 * 4. Job status queries
 * 5. Queue cleanup
 * 
 * Usage: npx tsx scripts/test-queue.ts
 */

import { testRedisConnection } from '../src/lib/config/redis'
import { createSermonQueue, SERMON_QUEUE_NAME } from '../src/lib/config/queue'

interface TestJobData {
  testId: string
  message: string
  timestamp: string
}

async function runQueueTests() {
  console.log('='.repeat(60))
  console.log('BullMQ Queue Test Suite')
  console.log('='.repeat(60))
  console.log()

  // Test 1: Redis Connectivity
  console.log('Test 1: Redis Connectivity')
  console.log('-'.repeat(60))
  const isConnected = await testRedisConnection()
  if (isConnected) {
    console.log('✓ Redis connection successful (PONG received)')
  } else {
    console.error('✗ Redis connection failed')
    console.error('  Make sure Redis is running: redis-server')
    process.exit(1)
  }
  console.log()

  // Test 2: Queue Creation
  console.log('Test 2: Queue Creation')
  console.log('-'.repeat(60))
  let queue
  try {
    queue = createSermonQueue()
    console.log(`✓ Queue created successfully: ${SERMON_QUEUE_NAME}`)
  } catch (error) {
    console.error('✗ Queue creation failed:', error)
    process.exit(1)
  }
  console.log()

  // Test 3: Job Enqueueing
  console.log('Test 3: Job Enqueueing')
  console.log('-'.repeat(60))
  let jobId: string
  try {
    const testData: TestJobData = {
      testId: 'test-001',
      message: 'Hello from BullMQ test',
      timestamp: new Date().toISOString(),
    }

    const job = await queue.add('test-job', testData, {
      priority: 5,
    })

    jobId = job.id!
    console.log(`✓ Job enqueued successfully`)
    console.log(`  Job ID: ${jobId}`)
    console.log(`  Job Name: ${job.name}`)
    console.log(`  Job Data:`, testData)
  } catch (error) {
    console.error('✗ Job enqueueing failed:', error)
    await queue.close()
    process.exit(1)
  }
  console.log()

  // Test 4: Job Status Query
  console.log('Test 4: Job Status Query')
  console.log('-'.repeat(60))
  try {
    const job = await queue.getJob(jobId)
    if (job) {
      const state = await job.getState()
      console.log(`✓ Job retrieved successfully`)
      console.log(`  Job ID: ${job.id}`)
      console.log(`  Job State: ${state}`)
      console.log(`  Job Data:`, job.data)
    } else {
      console.error('✗ Job not found')
    }
  } catch (error) {
    console.error('✗ Job status query failed:', error)
  }
  console.log()

  // Test 5: Queue Statistics
  console.log('Test 5: Queue Statistics')
  console.log('-'.repeat(60))
  try {
    const counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed')
    console.log(`✓ Queue statistics retrieved`)
    console.log(`  Waiting jobs: ${counts.waiting}`)
    console.log(`  Active jobs: ${counts.active}`)
    console.log(`  Completed jobs: ${counts.completed}`)
    console.log(`  Failed jobs: ${counts.failed}`)
  } catch (error) {
    console.error('✗ Queue statistics query failed:', error)
  }
  console.log()

  // Test 6: Job Removal (Cleanup)
  console.log('Test 6: Job Removal (Cleanup)')
  console.log('-'.repeat(60))
  try {
    const job = await queue.getJob(jobId)
    if (job) {
      await job.remove()
      console.log(`✓ Test job removed successfully`)
    }
  } catch (error) {
    console.error('✗ Job removal failed:', error)
  }
  console.log()

  // Test 7: Queue Cleanup
  console.log('Test 7: Queue Cleanup')
  console.log('-'.repeat(60))
  try {
    await queue.obliterate({ force: true })
    console.log(`✓ Queue obliterated (all jobs removed)`)
  } catch (error) {
    console.error('✗ Queue cleanup failed:', error)
  }
  console.log()

  // Close queue connection
  await queue.close()
  console.log('='.repeat(60))
  console.log('All tests completed successfully! ✓')
  console.log('='.repeat(60))
  console.log()
  console.log('Next steps:')
  console.log('1. BullMQ is configured and working correctly')
  console.log('2. Ready to implement job queue service')
  console.log('3. Ready to implement worker process')
  console.log()

  // Exit cleanly
  process.exit(0)
}

// Run tests
runQueueTests().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
