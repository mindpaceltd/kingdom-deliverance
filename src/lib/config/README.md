# BullMQ Queue Configuration

This directory contains the Redis and BullMQ queue configuration for the Sermon Queue Processor.

## Overview

The Sermon Queue Processor uses BullMQ (backed by Redis) to manage asynchronous sermon processing jobs. This provides:

- **Asynchronous Processing**: Jobs are processed in background workers, never blocking the web server
- **Fault Tolerance**: Automatic retries with exponential backoff for transient failures
- **Horizontal Scalability**: Add more worker processes to increase throughput
- **Job Persistence**: Jobs survive server restarts and crashes
- **Progress Tracking**: Real-time status updates for users

## Files

### `redis.ts`

Provides Redis connection configuration and utilities:

- `createRedisConnection()`: Factory function for creating Redis connections
- `redis`: Shared Redis connection instance
- `testRedisConnection()`: Test Redis connectivity

**Usage:**

```typescript
import { redis, testRedisConnection } from './redis'

// Test connection
const isConnected = await testRedisConnection()

// Use shared connection
await redis.set('key', 'value')
const value = await redis.get('key')
```

### `queue.ts`

Provides BullMQ queue configuration and factory functions:

- `createQueue()`: Generic queue factory function
- `createSermonQueue()`: Factory for sermon processing queue
- `SERMON_QUEUE_NAME`: Queue name constant
- `DEFAULT_JOB_OPTIONS`: Default job configuration

**Usage:**

```typescript
import { createSermonQueue } from './queue'

// Create queue
const queue = createSermonQueue()

// Add job
const job = await queue.add('process-sermon', {
  userId: 'user-123',
  videoUrl: 'https://youtube.com/watch?v=...',
})

// Query job status
const jobStatus = await queue.getJob(job.id!)
const state = await jobStatus.getState()

// Close queue
await queue.close()
```

## Configuration

### Environment Variables

Required environment variables (set in `.env.local`):

```bash
# Redis URL
REDIS_URL=redis://localhost:6379
```

### Default Job Options

Jobs are configured with the following defaults:

- **Attempts**: 3 retries on failure
- **Backoff**: Exponential backoff (1 min, 5 min, 15 min)
- **Retention**: Keep completed/failed jobs for 7 days
- **Max Completed Jobs**: Keep max 1000 completed jobs

## Testing

### Unit Tests

Run unit tests for queue configuration:

```bash
npm test -- src/lib/config/__tests__/queue.test.ts
```

### Manual Testing

Run the test script to verify BullMQ setup:

```bash
npx tsx scripts/test-queue.ts
```

This script tests:
1. Redis connectivity
2. Queue creation
3. Job enqueueing
4. Job status queries
5. Queue statistics
6. Job removal
7. Queue cleanup

## Prerequisites

### Redis Installation

**Ubuntu/Debian:**
```bash
sudo apt-get install redis-server
redis-server
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Docker:**
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

### Verify Redis is Running

```bash
redis-cli ping
# Should return: PONG
```

## Architecture

### Queue Flow

```
User submits URL
    ↓
Server Action enqueues job
    ↓
Job stored in Redis (status: waiting)
    ↓
Worker consumes job
    ↓
Worker processes job (extract → transcribe → summarize → SEO)
    ↓
Job completed (status: completed)
    ↓
Draft stored in Redis (24h TTL)
```

### Retry Strategy

Jobs that fail with retryable errors are automatically retried:

1. **Attempt 1**: Immediate processing
2. **Attempt 2**: Retry after 1 minute
3. **Attempt 3**: Retry after 5 minutes
4. **Attempt 4**: Retry after 15 minutes
5. **After 3 failures**: Move to dead letter queue

### Error Classification

**Retryable Errors:**
- Network timeouts
- Ollama unavailable
- Transcription service unavailable
- Temporary file system errors

**Non-Retryable Errors:**
- Invalid URL
- Video unavailable/private
- Video too long (>3 hours)
- Transcript too short (<100 words)
- Rate limit exceeded

## Next Steps

After completing Task 1.2 (Install BullMQ and configure queue), the next tasks are:

1. **Task 1.3**: Extend database schema for queue processor
2. **Task 1.4**: Add environment variables and validation
3. **Task 1.5**: Create TypeScript types for queue processor
4. **Task 2.1**: Create job queue service class

## References

- [BullMQ Documentation](https://docs.bullmq.io/)
- [ioredis Documentation](https://github.com/redis/ioredis)
- [Redis Documentation](https://redis.io/docs/)
