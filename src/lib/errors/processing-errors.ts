/**
 * Custom error classes for sermon processing pipeline.
 *
 * BullMQ retries any thrown error by default. To prevent retries for
 * non-recoverable failures, throw a `NonRetryableError`. The worker
 * catches this and re-throws it with `job.discard()` called first so
 * BullMQ moves the job straight to the failed state without consuming
 * any remaining retry attempts.
 *
 * Requirements: 7.2, 7.4
 */

/**
 * Thrown when a job failure is permanent and should NOT be retried.
 * Examples: video deleted/private, invalid URL, transcript too short,
 * video too long.
 */
export class NonRetryableError extends Error {
  readonly isNonRetryable = true

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'NonRetryableError'
    if (cause instanceof Error) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`
    }
  }
}

/**
 * Patterns that indicate a transient / retryable failure.
 * Network issues, service unavailability, and timeouts are all
 * candidates for automatic retry with exponential backoff.
 */
const RETRYABLE_PATTERNS: RegExp[] = [
  /timeout/i,
  /ECONNREFUSED/,
  /ECONNRESET/,
  /ETIMEDOUT/,
  /ENOTFOUND/,
  /network/i,
  /ollama.*unavailable/i,
  /ai service unavailable/i,
  /transcription.*timed out/i,
  /audio extraction timed out/i,
  /socket hang up/i,
  /connect ECONNREFUSED/i,
]

/**
 * Patterns that indicate a permanent / non-retryable failure.
 * These represent problems with the input data that will not resolve
 * on their own regardless of how many times the job is retried.
 */
const NON_RETRYABLE_PATTERNS: RegExp[] = [
  /private.*video|video.*private/i,
  /video.*unavailable|unavailable.*video/i,
  /video not found/i,
  /region.?blocked/i,
  /video.*deleted|deleted.*video/i,
  /invalid.*url|url.*invalid/i,
  /transcript too short/i,
  /video too long/i,
  /unsupported.*url/i,
  /no video formats/i,
]

/**
 * Classify an error as retryable or non-retryable.
 *
 * - If the error is already a `NonRetryableError`, it is non-retryable.
 * - If the message matches a non-retryable pattern, it is non-retryable.
 * - If the message matches a retryable pattern, it is retryable.
 * - Unknown errors default to retryable so they get a chance to recover.
 *
 * @returns `true` if the error should trigger a retry, `false` otherwise.
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof NonRetryableError) {
    return false
  }

  const message =
    error instanceof Error ? error.message : String(error)

  // Explicit non-retryable patterns take priority
  if (NON_RETRYABLE_PATTERNS.some((p) => p.test(message))) {
    return false
  }

  // Explicit retryable patterns
  if (RETRYABLE_PATTERNS.some((p) => p.test(message))) {
    return true
  }

  // Default: retry unknown errors (conservative — let BullMQ decide)
  return true
}

/**
 * Wrap an error in a `NonRetryableError` if it matches a non-retryable
 * pattern, otherwise return the original error unchanged.
 */
export function classifyError(error: unknown): Error {
  if (error instanceof NonRetryableError) {
    return error
  }

  const message =
    error instanceof Error ? error.message : String(error)

  if (NON_RETRYABLE_PATTERNS.some((p) => p.test(message))) {
    return new NonRetryableError(message, error instanceof Error ? error : undefined)
  }

  return error instanceof Error ? error : new Error(message)
}
