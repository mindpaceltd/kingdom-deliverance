/**
 * Rate Limiter Usage Examples
 * 
 * This file demonstrates how to use the rate limiter service in server actions.
 * These examples show the integration pattern for the sermon queue processor.
 */

import { checkRateLimit, getRateLimitCount, getRateLimitResetTime } from './rate-limiter'

/**
 * Example 1: Basic rate limit check in a server action
 */
export async function exampleServerAction(userId: string, videoUrl: string) {
  // Check if user has exceeded rate limit (10 submissions per hour)
  const canSubmit = await checkRateLimit(userId, 10)
  
  if (!canSubmit) {
    // Get reset time for user-friendly error message
    const minutesUntilReset = await getRateLimitResetTime(userId)
    
    return {
      error: `Rate limit exceeded. You can submit 10 videos per hour. Try again in ${minutesUntilReset} minutes.`
    }
  }
  
  // Proceed with job submission
  // ... enqueue job logic here ...
  
  return { success: true }
}

/**
 * Example 2: Display remaining quota to user
 */
export async function exampleGetQuotaInfo(userId: string) {
  const currentCount = await getRateLimitCount(userId)
  const limit = 10
  const remaining = Math.max(0, limit - currentCount)
  const minutesUntilReset = await getRateLimitResetTime(userId)
  
  return {
    used: currentCount,
    limit,
    remaining,
    resetInMinutes: minutesUntilReset,
    message: `You have ${remaining} of ${limit} submissions remaining. Resets in ${minutesUntilReset} minutes.`
  }
}

/**
 * Example 3: Custom rate limit for different user tiers
 */
export async function exampleTieredRateLimit(userId: string, userTier: 'free' | 'premium' | 'admin') {
  // Different limits for different user tiers
  const limits = {
    free: 5,
    premium: 20,
    admin: 100
  }
  
  const limit = limits[userTier]
  const canSubmit = await checkRateLimit(userId, limit)
  
  if (!canSubmit) {
    return {
      error: `Rate limit exceeded for ${userTier} tier (${limit} per hour).`
    }
  }
  
  return { success: true }
}

/**
 * Example 4: Integration with sermon queue processor (Task 9.1)
 * 
 * This is how the rate limiter will be used in the actual server action:
 */
export async function exampleProcessSermonLink(userId: string, videoUrl: string) {
  // Step 1: Verify user authentication (not shown)
  
  // Step 2: Check rate limit
  const canProcess = await checkRateLimit(userId, 10)
  
  if (!canProcess) {
    const minutesUntilReset = await getRateLimitResetTime(userId)
    return {
      error: `Rate limit exceeded. You can submit 10 videos per hour. Try again in ${minutesUntilReset} minutes.`
    }
  }
  
  // Step 3: Validate URL (not shown)
  
  // Step 4: Enqueue job (not shown)
  // const jobId = await jobQueue.enqueueJob(userId, videoUrl)
  
  return {
    success: true,
    // jobId: jobId
  }
}
