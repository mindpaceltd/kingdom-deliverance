/**
 * Error Classification Utility
 * 
 * Classifies errors as retryable or non-retryable for the queue system.
 * Retryable errors trigger automatic retry with exponential backoff.
 * Non-retryable errors fail immediately without retry.
 * 
 * Requirements: 7.2
 */

export type ErrorClassification = 'retryable' | 'non-retryable'

/**
 * Determine if an error is retryable
 * 
 * Retryable errors include:
 * - Network timeouts (ETIMEDOUT, timeout)
 * - Connection refused (ECONNREFUSED)
 * - DNS resolution failures (ENOTFOUND)
 * - AI service unavailable
 * - Temporary service errors
 * 
 * Non-retryable errors include:
 * - Invalid URL format
 * - Video unavailable/private/deleted
 * - Video too long
 * - Transcript too short
 * - Invalid content structure
 * - Rate limit exceeded
 */
export function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase()
  
  const retryablePatterns = [
    'timeout',
    'timed out',
    'econnrefused',
    'etimedout',
    'enotfound',
    'ai service unavailable',
    'ollama unavailable',
    'network error',
    'fetch failed',
    'connection refused',
    'transcription service unavailable',
  ]
  
  return retryablePatterns.some(pattern => message.includes(pattern))
}

/**
 * Classify an error as retryable or non-retryable
 */
export function classifyError(error: Error): ErrorClassification {
  return isRetryableError(error) ? 'retryable' : 'non-retryable'
}

/**
 * Check if an error is a specific type
 */
export function isConnectionError(error: Error): boolean {
  const message = error.message.toLowerCase()
  return message.includes('econnrefused') || 
         message.includes('connection refused') ||
         message.includes('fetch failed')
}

export function isTimeoutError(error: Error): boolean {
  const message = error.message.toLowerCase()
  return message.includes('timeout') || message.includes('timed out')
}

export function isServiceUnavailableError(error: Error): boolean {
  const message = error.message.toLowerCase()
  return message.includes('service unavailable') || 
         message.includes('unavailable')
}
