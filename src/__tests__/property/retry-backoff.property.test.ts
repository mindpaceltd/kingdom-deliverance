/**
 * Property-Based Tests — Retry Logic with Exponential Backoff (Task 15.12)
 *
 * **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**
 *
 * Property 4: Retry Logic with Exponential Backoff
 *
 * For any job that fails with a retryable error (network timeout, Ollama
 * unavailable), the job SHALL be retried up to 3 times with exponential
 * backoff delays, and after 3 failed attempts the job SHALL be moved to the
 * dead letter queue (BullMQ failed state). For non-retryable errors (video
 * deleted, invalid URL), the job SHALL be marked as 'failed' immediately
 * without retry.
 *
 * BullMQ exponential backoff formula: delay * 2^(attemptsMade - 1)
 *   - Attempt 1 (attemptsMade=1): 60000 * 2^0 = 60 000 ms (1 min)
 *   - Attempt 2 (attemptsMade=2): 60000 * 2^1 = 120 000 ms (2 min)
 *   - Attempt 3 (attemptsMade=3): 60000 * 2^2 = 240 000 ms (4 min)
 *
 * The tests exercise the error classification logic and the worker's retry
 * simulation without requiring real infrastructure (no Redis, no BullMQ).
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  classifyError,
  isRetryableError,
  NonRetryableError,
} from '../../lib/errors/processing-errors'
import { DEFAULT_JOB_OPTIONS } from '../../lib/config/queue'

// ─────────────────────────────────────────────────────────────────────────────
// Constants — mirrors src/lib/config/queue.ts
// ─────────────────────────────────────────────────────────────────────────────

/** Maximum number of attempts BullMQ will make for a sermon processing job. */
const MAX_ATTEMPTS = 3

/** Base delay in milliseconds for exponential backoff (1 minute). */
const BASE_DELAY_MS = 60_000

/**
 * BullMQ exponential backoff formula.
 *
 * BullMQ computes the delay for attempt `n` (1-indexed) as:
 *   delay * 2^(n - 1)
 *
 * So:
 *   attempt 1 → 60 000 ms (1 min)
 *   attempt 2 → 120 000 ms (2 min)
 *   attempt 3 → 240 000 ms (4 min)
 */
function computeBackoffDelay(attemptNumber: number, baseDelay: number): number {
  return baseDelay * Math.pow(2, attemptNumber - 1)
}

// ─────────────────────────────────────────────────────────────────────────────
// Canonical error messages — retryable vs non-retryable
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retryable error messages produced by the processing pipeline.
 * These represent transient failures that should trigger automatic retry.
 * Requirements: 7.2, 7.3
 */
const RETRYABLE_ERROR_MESSAGES: string[] = [
  'connect ECONNREFUSED 127.0.0.1:11434',
  'read ECONNRESET',
  'connect ETIMEDOUT',
  'ENOTFOUND ollama.local',
  'Request timeout after 10000ms',
  'Audio extraction timed out (max 10 minutes)',
  'Transcription timed out (max 30 minutes)',
  'AI service unavailable. Please ensure Ollama is running.',
  'AI summarization timed out (max 10 minutes)',
  'SEO generation timed out (max 5 minutes)',
  'socket hang up',
  'network error: connection refused',
  'ollama service unavailable',
]

/**
 * Non-retryable error messages produced by the processing pipeline.
 * These represent permanent failures that should NOT trigger retry.
 * Requirements: 7.2, 7.4
 */
const NON_RETRYABLE_ERROR_MESSAGES: string[] = [
  'Failed to download audio: Private video',
  'Failed to download audio: Video unavailable',
  'Video not found or region-blocked',
  'Failed to download audio: region-blocked',
  'Failed to download audio: video deleted',
  'Invalid URL: not a valid video URL',
  'Transcript too short (50 words, min 100 words)',
  'Video too long (3.5 hours, max 3 hours)',
  'Failed to download audio: no video formats available',
  'Unsupported URL: platform not supported',
]

// ─────────────────────────────────────────────────────────────────────────────
// Arbitraries (fast-check generators)
// ─────────────────────────────────────────────────────────────────────────────

/** Generates one of the canonical retryable error messages. */
const arbRetryableErrorMessage = fc.constantFrom(...RETRYABLE_ERROR_MESSAGES)

/** Generates one of the canonical non-retryable error messages. */
const arbNonRetryableErrorMessage = fc.constantFrom(...NON_RETRYABLE_ERROR_MESSAGES)

/** Generates a retryable Error object. */
const arbRetryableError = arbRetryableErrorMessage.map((msg) => new Error(msg))

/** Generates a non-retryable Error object. */
const arbNonRetryableError = arbNonRetryableErrorMessage.map((msg) => new Error(msg))

/** Generates a NonRetryableError instance directly. */
const arbNonRetryableErrorInstance = arbNonRetryableErrorMessage.map(
  (msg) => new NonRetryableError(msg)
)

/**
 * Generates a valid attempt number (1-indexed, within the max attempts range).
 * Represents the `attemptsMade` value BullMQ passes to the job processor.
 */
const arbAttemptNumber = fc.integer({ min: 1, max: MAX_ATTEMPTS })

/**
 * Generates a sequence of retryable errors — one per attempt — simulating a
 * job that always fails with retryable errors until it exhausts all retries.
 */
const arbRetryableErrorSequence = fc
  .array(arbRetryableErrorMessage, {
    minLength: MAX_ATTEMPTS,
    maxLength: MAX_ATTEMPTS,
  })
  .map((messages) => messages.map((msg) => new Error(msg)))

/**
 * Generates a mixed error sequence where the job fails with retryable errors
 * for some attempts and then succeeds (null = success).
 */
const arbPartialRetrySequence = fc
  .integer({ min: 1, max: MAX_ATTEMPTS - 1 })
  .chain((failCount) =>
    fc
      .array(arbRetryableErrorMessage, { minLength: failCount, maxLength: failCount })
      .map((messages) => {
        const errors: (Error | null)[] = messages.map((msg) => new Error(msg))
        errors.push(null) // success on the next attempt
        return errors
      })
  )

// ─────────────────────────────────────────────────────────────────────────────
// Simulation helpers
// ─────────────────────────────────────────────────────────────────────────────

interface AttemptRecord {
  attemptNumber: number
  error: string | null
  wasRetried: boolean
  wasDiscarded: boolean
}

interface JobLifecycleResult {
  finalState: 'completed' | 'failed' | 'discarded'
  totalAttempts: number
  history: AttemptRecord[]
  discardCalled: boolean
}

/**
 * Simulate the worker's error-handling logic for a single attempt.
 *
 * Mirrors the logic in src/workers/sermon-processor.ts:
 *   - Classify the error
 *   - If NonRetryableError → call job.discard() and re-throw (no retry)
 *   - Otherwise → re-throw (BullMQ schedules retry)
 */
function simulateWorkerAttempt(
  error: Error,
  discardFn: () => void
): { retried: boolean; discarded: boolean } {
  const classified = classifyError(error)
  const isNonRetryable = classified instanceof NonRetryableError

  if (isNonRetryable) {
    discardFn()
    return { retried: false, discarded: true }
  }

  return { retried: true, discarded: false }
}

/**
 * Simulate a full job lifecycle through multiple attempts.
 *
 * @param errorFactory - Returns an Error for each attempt (null = success).
 * @param maxAttempts - Maximum number of attempts allowed.
 */
function simulateJobLifecycle(
  errorFactory: (attempt: number) => Error | null,
  maxAttempts = MAX_ATTEMPTS
): JobLifecycleResult {
  const history: AttemptRecord[] = []
  let discardCalled = false
  const discardFn = () => { discardCalled = true }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const error = errorFactory(attempt)

    if (!error) {
      history.push({ attemptNumber: attempt, error: null, wasRetried: false, wasDiscarded: false })
      return { finalState: 'completed', totalAttempts: attempt, history, discardCalled }
    }

    const { retried, discarded } = simulateWorkerAttempt(error, discardFn)
    history.push({ attemptNumber: attempt, error: error.message, wasRetried: retried, wasDiscarded: discarded })

    if (discarded) {
      return { finalState: 'discarded', totalAttempts: attempt, history, discardCalled }
    }

    if (attempt === maxAttempts) {
      // Exhausted all retries → dead letter queue (BullMQ failed state)
      return { finalState: 'failed', totalAttempts: attempt, history, discardCalled }
    }
  }

  return { finalState: 'failed', totalAttempts: maxAttempts, history, discardCalled }
}

// ─────────────────────────────────────────────────────────────────────────────
// Property 4: Retry Logic with Exponential Backoff
// ─────────────────────────────────────────────────────────────────────────────

describe('Property 4: Retry Logic with Exponential Backoff (Requirements 7.1, 7.2, 7.3, 7.4, 7.5)', () => {

  // ── 4a. Queue configuration: attempts=3, exponential backoff ─────────────

  describe('4a. Queue is configured with attempts=3 and exponential backoff (Req 7.1)', () => {
    it('should configure the queue with exactly 3 retry attempts', () => {
      expect(DEFAULT_JOB_OPTIONS.attempts).toBe(MAX_ATTEMPTS)
    })

    it('should configure exponential backoff type', () => {
      expect(DEFAULT_JOB_OPTIONS.backoff.type).toBe('exponential')
    })

    it('should configure base delay of 60 000 ms (1 minute)', () => {
      expect(DEFAULT_JOB_OPTIONS.backoff.delay).toBe(BASE_DELAY_MS)
    })

    it('should compute correct backoff delay for each attempt number', () => {
      fc.assert(
        fc.property(arbAttemptNumber, (attemptNumber) => {
          const delay = computeBackoffDelay(attemptNumber, BASE_DELAY_MS)
          // Delay must be a positive multiple of the base delay
          expect(delay).toBeGreaterThan(0)
          expect(delay % BASE_DELAY_MS).toBe(0)
          // Delay must be exactly BASE_DELAY_MS * 2^(attemptNumber - 1)
          expect(delay).toBe(BASE_DELAY_MS * Math.pow(2, attemptNumber - 1))
        }),
        { numRuns: 20 }
      )
    })

    it('should have strictly increasing backoff delays across attempts', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: MAX_ATTEMPTS - 1 }),
          (attemptNumber) => {
            const currentDelay = computeBackoffDelay(attemptNumber, BASE_DELAY_MS)
            const nextDelay = computeBackoffDelay(attemptNumber + 1, BASE_DELAY_MS)
            expect(nextDelay).toBeGreaterThan(currentDelay)
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should double the delay on each successive attempt (exponential growth)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: MAX_ATTEMPTS - 1 }),
          (attemptNumber) => {
            const currentDelay = computeBackoffDelay(attemptNumber, BASE_DELAY_MS)
            const nextDelay = computeBackoffDelay(attemptNumber + 1, BASE_DELAY_MS)
            expect(nextDelay).toBe(currentDelay * 2)
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should compute the correct delays for all 3 attempts', () => {
      // Attempt 1: 60 000 ms (1 min)
      expect(computeBackoffDelay(1, BASE_DELAY_MS)).toBe(60_000)
      // Attempt 2: 120 000 ms (2 min)
      expect(computeBackoffDelay(2, BASE_DELAY_MS)).toBe(120_000)
      // Attempt 3: 240 000 ms (4 min)
      expect(computeBackoffDelay(3, BASE_DELAY_MS)).toBe(240_000)
    })
  })

  // ── 4b. Retryable errors trigger retry (Req 7.2, 7.3) ────────────────────

  describe('4b. Retryable errors cause the job to retry (Req 7.2, 7.3)', () => {
    it('should classify all canonical retryable errors as retryable', () => {
      fc.assert(
        fc.property(arbRetryableError, (error) => {
          expect(isRetryableError(error)).toBe(true)
        }),
        { numRuns: 25 }
      )
    })

    it('should NOT discard the job when a retryable error occurs', () => {
      fc.assert(
        fc.property(arbRetryableError, (error) => {
          let discardCalled = false
          const { retried, discarded } = simulateWorkerAttempt(error, () => { discardCalled = true })

          expect(retried).toBe(true)
          expect(discarded).toBe(false)
          expect(discardCalled).toBe(false)
        }),
        { numRuns: 25 }
      )
    })

    it('should allow the job to succeed after a retryable failure', () => {
      fc.assert(
        fc.property(arbRetryableError, (firstError) => {
          // Fails once with a retryable error, then succeeds
          const result = simulateJobLifecycle(
            (attempt) => (attempt === 1 ? firstError : null)
          )

          expect(result.finalState).toBe('completed')
          expect(result.totalAttempts).toBe(2)
          expect(result.history[0].wasRetried).toBe(true)
          expect(result.history[1].error).toBeNull()
        }),
        { numRuns: 25 }
      )
    })

    it('should retry up to MAX_ATTEMPTS times for persistent retryable errors', () => {
      fc.assert(
        fc.property(arbRetryableErrorSequence, (errors) => {
          const result = simulateJobLifecycle(
            (attempt) => errors[attempt - 1] ?? null
          )

          // All 3 attempts exhausted → dead letter queue
          expect(result.finalState).toBe('failed')
          expect(result.totalAttempts).toBe(MAX_ATTEMPTS)
          expect(result.discardCalled).toBe(false)
        }),
        { numRuns: 25 }
      )
    })

    it('should record a retry for each retryable failure in the history', () => {
      fc.assert(
        fc.property(arbRetryableErrorSequence, (errors) => {
          const result = simulateJobLifecycle(
            (attempt) => errors[attempt - 1] ?? null
          )

          // All attempts except the last should be marked as retried
          for (let i = 0; i < result.history.length - 1; i++) {
            expect(result.history[i].wasRetried).toBe(true)
          }
        }),
        { numRuns: 25 }
      )
    })

    it('should succeed before exhausting retries when error resolves', () => {
      fc.assert(
        fc.property(arbPartialRetrySequence, (errorSequence) => {
          const result = simulateJobLifecycle(
            (attempt) => errorSequence[attempt - 1] ?? null
          )

          expect(result.finalState).toBe('completed')
          expect(result.totalAttempts).toBeLessThanOrEqual(MAX_ATTEMPTS)
        }),
        { numRuns: 25 }
      )
    })
  })

  // ── 4c. Job moves to dead letter queue after 3 failures (Req 7.5) ─────────

  describe('4c. Job moves to dead letter queue after 3 retryable failures (Req 7.5)', () => {
    it('should move job to failed state after exhausting all 3 attempts', () => {
      fc.assert(
        fc.property(arbRetryableErrorSequence, (errors) => {
          const result = simulateJobLifecycle(
            (attempt) => errors[attempt - 1] ?? null
          )

          expect(result.finalState).toBe('failed')
          expect(result.totalAttempts).toBe(MAX_ATTEMPTS)
        }),
        { numRuns: 25 }
      )
    })

    it('should NOT exceed MAX_ATTEMPTS regardless of how many retryable errors occur', () => {
      fc.assert(
        fc.property(arbRetryableErrorSequence, (errors) => {
          const result = simulateJobLifecycle(
            (attempt) => errors[attempt - 1] ?? null
          )

          expect(result.totalAttempts).toBeLessThanOrEqual(MAX_ATTEMPTS)
        }),
        { numRuns: 25 }
      )
    })

    it('should NOT call discard when job exhausts retries via retryable errors', () => {
      fc.assert(
        fc.property(arbRetryableErrorSequence, (errors) => {
          const result = simulateJobLifecycle(
            (attempt) => errors[attempt - 1] ?? null
          )

          // discard() is only called for non-retryable errors
          expect(result.discardCalled).toBe(false)
        }),
        { numRuns: 25 }
      )
    })

    it('should have exactly MAX_ATTEMPTS entries in the history when all attempts fail', () => {
      fc.assert(
        fc.property(arbRetryableErrorSequence, (errors) => {
          const result = simulateJobLifecycle(
            (attempt) => errors[attempt - 1] ?? null
          )

          expect(result.history).toHaveLength(MAX_ATTEMPTS)
        }),
        { numRuns: 25 }
      )
    })
  })

  // ── 4d. Non-retryable errors fail immediately without retry (Req 7.2, 7.4) ─

  describe('4d. Non-retryable errors fail immediately without retry (Req 7.2, 7.4)', () => {
    it('should classify all canonical non-retryable errors as non-retryable', () => {
      fc.assert(
        fc.property(arbNonRetryableError, (error) => {
          expect(isRetryableError(error)).toBe(false)
        }),
        { numRuns: 25 }
      )
    })

    it('should classify NonRetryableError instances as non-retryable regardless of message', () => {
      fc.assert(
        fc.property(arbNonRetryableErrorInstance, (error) => {
          expect(isRetryableError(error)).toBe(false)
        }),
        { numRuns: 25 }
      )
    })

    it('should call discard() immediately for non-retryable errors', () => {
      fc.assert(
        fc.property(arbNonRetryableError, (error) => {
          let discardCalled = false
          const { retried, discarded } = simulateWorkerAttempt(error, () => { discardCalled = true })

          expect(discarded).toBe(true)
          expect(retried).toBe(false)
          expect(discardCalled).toBe(true)
        }),
        { numRuns: 25 }
      )
    })

    it('should fail on the first attempt for non-retryable errors (no retry)', () => {
      fc.assert(
        fc.property(arbNonRetryableError, (error) => {
          const result = simulateJobLifecycle(
            (attempt) => (attempt === 1 ? error : null)
          )

          expect(result.finalState).toBe('discarded')
          expect(result.totalAttempts).toBe(1)
          expect(result.discardCalled).toBe(true)
        }),
        { numRuns: 25 }
      )
    })

    it('should wrap non-retryable pattern errors in NonRetryableError', () => {
      fc.assert(
        fc.property(arbNonRetryableError, (error) => {
          const classified = classifyError(error)
          expect(classified).toBeInstanceOf(NonRetryableError)
        }),
        { numRuns: 25 }
      )
    })

    it('should NOT retry even if non-retryable error occurs on a later attempt', () => {
      fc.assert(
        fc.property(
          arbRetryableError,
          arbNonRetryableError,
          (retryableError, nonRetryableError) => {
            // First attempt: retryable (triggers retry)
            // Second attempt: non-retryable (should stop immediately)
            const result = simulateJobLifecycle((attempt) => {
              if (attempt === 1) return retryableError
              if (attempt === 2) return nonRetryableError
              return null
            })

            expect(result.finalState).toBe('discarded')
            expect(result.totalAttempts).toBe(2)
            expect(result.discardCalled).toBe(true)
          }
        ),
        { numRuns: 25 }
      )
    })
  })

  // ── 4e. Error classification is consistent (Req 7.2) ─────────────────────

  describe('4e. Error classification is consistent and deterministic (Req 7.2)', () => {
    it('should produce the same retryability result for the same error every time', () => {
      fc.assert(
        fc.property(arbRetryableError, (error) => {
          const first = isRetryableError(error)
          const second = isRetryableError(error)
          expect(first).toBe(second)
        }),
        { numRuns: 25 }
      )
    })

    it('should produce the same retryability result for non-retryable errors every time', () => {
      fc.assert(
        fc.property(arbNonRetryableError, (error) => {
          const first = isRetryableError(error)
          const second = isRetryableError(error)
          expect(first).toBe(second)
        }),
        { numRuns: 25 }
      )
    })

    it('should classify retryable and non-retryable errors consistently across all messages', () => {
      // Retryable errors must always be retryable
      for (const message of RETRYABLE_ERROR_MESSAGES) {
        expect(isRetryableError(new Error(message))).toBe(true)
      }
      // Non-retryable errors must always be non-retryable
      for (const message of NON_RETRYABLE_ERROR_MESSAGES) {
        expect(isRetryableError(new Error(message))).toBe(false)
      }
    })

    it('should classify NonRetryableError as non-retryable regardless of message content', () => {
      fc.assert(
        fc.property(
          fc.oneof(arbRetryableErrorMessage, arbNonRetryableErrorMessage),
          (message) => {
            // Even if the message looks retryable, NonRetryableError is always non-retryable
            const error = new NonRetryableError(message)
            expect(isRetryableError(error)).toBe(false)
          }
        ),
        { numRuns: 25 }
      )
    })
  })

  // ── 4f. Attempt count is bounded by MAX_ATTEMPTS (Req 7.1) ───────────────

  describe('4f. Total attempts never exceed MAX_ATTEMPTS (Req 7.1)', () => {
    it('should never exceed MAX_ATTEMPTS for any combination of retryable errors', () => {
      fc.assert(
        fc.property(arbRetryableErrorSequence, (errors) => {
          const result = simulateJobLifecycle(
            (attempt) => errors[attempt - 1] ?? null
          )
          expect(result.totalAttempts).toBeLessThanOrEqual(MAX_ATTEMPTS)
        }),
        { numRuns: 25 }
      )
    })

    it('should stop at 1 attempt for non-retryable errors', () => {
      fc.assert(
        fc.property(arbNonRetryableError, (error) => {
          const result = simulateJobLifecycle(() => error)
          expect(result.totalAttempts).toBe(1)
        }),
        { numRuns: 25 }
      )
    })

    it('should use exactly MAX_ATTEMPTS when all attempts fail with retryable errors', () => {
      fc.assert(
        fc.property(arbRetryableErrorSequence, (errors) => {
          const result = simulateJobLifecycle(
            (attempt) => errors[attempt - 1] ?? null
          )
          expect(result.totalAttempts).toBe(MAX_ATTEMPTS)
        }),
        { numRuns: 25 }
      )
    })
  })

  // ── 4g. Backoff delay is always positive and finite (Req 7.1) ────────────

  describe('4g. Backoff delay is always positive and finite (Req 7.1)', () => {
    it('should produce a positive finite delay for any valid attempt number', () => {
      fc.assert(
        fc.property(arbAttemptNumber, (attemptNumber) => {
          const delay = computeBackoffDelay(attemptNumber, BASE_DELAY_MS)
          expect(Number.isFinite(delay)).toBe(true)
          expect(delay).toBeGreaterThan(0)
        }),
        { numRuns: 20 }
      )
    })

    it('should produce a delay that is a multiple of the base delay', () => {
      fc.assert(
        fc.property(arbAttemptNumber, (attemptNumber) => {
          const delay = computeBackoffDelay(attemptNumber, BASE_DELAY_MS)
          expect(delay % BASE_DELAY_MS).toBe(0)
        }),
        { numRuns: 20 }
      )
    })

    it('should produce the minimum delay (BASE_DELAY_MS) on the first attempt', () => {
      expect(computeBackoffDelay(1, BASE_DELAY_MS)).toBe(BASE_DELAY_MS)
    })
  })
})
