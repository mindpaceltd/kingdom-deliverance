# Rate Limiter Service

## Overview

Redis-based rate limiting service for the Sermon Queue Processor. Implements a 1-hour sliding window to prevent queue flooding and ensure fair resource usage.

## Features

- **Redis-backed counters**: Persistent, distributed rate limiting
- **1-hour sliding window**: Automatic reset every hour
- **Configurable limits**: Default 10 submissions per hour
- **Fail-open design**: Allows requests if Redis is unavailable
- **User-friendly helpers**: Get current count and reset time

## Implementation Details

### Key Format

```
ratelimit:{userId}:{hour_timestamp}
```

Example: `ratelimit:user-123:2024-01-15-14`

### Sliding Window

The rate limiter uses hour-based timestamps to create a sliding window:
- Each hour gets a unique key (e.g., `2024-01-15-14` for 2:00 PM)
- Keys automatically expire after 1 hour (3600 seconds)
- Counter resets at the start of each new hour

### Atomic Operations

1. **GET** current count for the hour
2. **Check** if count >= limit
3. **INCR** counter if under limit
4. **EXPIRE** key to 1 hour (only on first request)

## API Reference

### `checkRateLimit(userId, limit?)`

Check if a user can submit a new job.

**Parameters:**
- `userId` (string): User ID to check
- `limit` (number, optional): Max submissions per hour (default: 10)

**Returns:**
- `true`: User can submit (under limit)
- `false`: User cannot submit (at or over limit)

**Example:**
```typescript
const canSubmit = await checkRateLimit('user-123', 10)
if (!canSubmit) {
  return { error: 'Rate limit exceeded' }
}
```

### `getRateLimitCount(userId)`

Get the current submission count for the user in the current hour.

**Parameters:**
- `userId` (string): User ID to check

**Returns:**
- `number`: Current count (0 if no submissions)

**Example:**
```typescript
const count = await getRateLimitCount('user-123')
console.log(`Used ${count} of 10 submissions`)
```

### `getRateLimitResetTime(userId)`

Get minutes remaining until the rate limit resets.

**Parameters:**
- `userId` (string): User ID to check

**Returns:**
- `number`: Minutes until next hour (1-60)

**Example:**
```typescript
const minutes = await getRateLimitResetTime('user-123')
console.log(`Resets in ${minutes} minutes`)
```

## Usage in Server Actions

```typescript
import { checkRateLimit, getRateLimitResetTime } from '@/lib/services/rate-limiter'

export async function processSermonLink(url: string) {
  // Get user ID from session
  const userId = await getUserId()
  
  // Check rate limit
  const canProcess = await checkRateLimit(userId, 10)
  
  if (!canProcess) {
    const minutes = await getRateLimitResetTime(userId)
    return {
      error: `Rate limit exceeded. Try again in ${minutes} minutes.`
    }
  }
  
  // Proceed with job submission
  // ...
}
```

## Testing

Comprehensive unit tests cover:
- ✅ Rate limit counter increments
- ✅ Rate limit enforcement (10 jobs per hour)
- ✅ Counter reset after 1 hour
- ✅ Concurrent requests handling
- ✅ Error handling (fail open)
- ✅ Redis key format validation
- ✅ Different user IDs tracked independently
- ✅ Custom limits
- ✅ Hour-based key generation

Run tests:
```bash
npm test -- src/lib/services/__tests__/rate-limiter.test.ts
```

## Configuration

Set the rate limit in environment variables:

```bash
# .env.local
QUEUE_RATE_LIMIT_PER_HOUR=10
```

Or configure in `src/lib/env.ts`:

```typescript
export const queueProcessorEnv = {
  rateLimitPerHour: parseInt(process.env.QUEUE_RATE_LIMIT_PER_HOUR || '10'),
  // ...
}
```

## Requirements Validation

This implementation satisfies:

- **Requirement 10.1**: Enforces rate limit of 10 job submissions per user per hour
- **Requirement 10.3**: Tracks rate limit counters in Redis with 1-hour sliding window

## Error Handling

The rate limiter uses a **fail-open** strategy:
- If Redis is unavailable, requests are **allowed** (returns `true`)
- This prevents rate limiter failures from blocking all requests
- Errors are logged for monitoring

## Performance

- **O(1)** time complexity for all operations
- **Minimal Redis calls**: 2-3 operations per check (GET, INCR, EXPIRE)
- **Automatic cleanup**: Keys expire after 1 hour
- **Connection pooling**: Uses shared Redis connection

## Future Enhancements

Potential improvements:
- [ ] Token bucket algorithm for smoother rate limiting
- [ ] Distributed rate limiting across multiple Redis instances
- [ ] Per-endpoint rate limits (different limits for different operations)
- [ ] Rate limit analytics and monitoring
- [ ] Whitelist/blacklist support
- [ ] Burst allowance for premium users

## Related Files

- `src/lib/services/rate-limiter.ts` - Main implementation
- `src/lib/services/__tests__/rate-limiter.test.ts` - Unit tests
- `src/lib/services/rate-limiter.example.ts` - Usage examples
- `src/lib/config/redis.ts` - Redis connection configuration
- `src/lib/env.ts` - Environment configuration

## Next Steps

Task 8.1 is complete. The rate limiter is ready for integration in:
- **Task 9.1**: Server actions for job management
- **Task 11.3**: UI error handling and user feedback
