/**
 * Property-Based Tests — Error Handling and Status Updates (Task 15.10)
 *
 * **Validates: Requirements 3.6, 4.7, 5.7, 15.5**
 *
 * Property 2: Error Handling and Status Updates
 *
 * For any processing error that occurs during the sermon pipeline:
 *   1. The job MUST be marked as 'failed' with an error message.
 *   2. The error message MUST include the failure reason.
 *   3. The error message MUST NOT expose sensitive data (passwords, tokens,
 *      API keys, private keys, secrets, credentials).
 *
 * The tests simulate the worker's error-handling path by exercising the
 * `classifyError` function and the error message patterns produced by each
 * service (AudioExtractor, TranscriptionService, OllamaAIService). No real
 * infrastructure is required.
 *
 * Requirements: 3.6, 4.7, 5.7, 15.5
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  classifyError,
  isRetryableError,
  NonRetryableError,
} from '../../lib/errors/processing-errors'

// ─────────────────────────────────────────────────────────────────────────────
// Sensitive data patterns (mirrors the task description)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Regex patterns that should NEVER appear in an error message surfaced to the
 * job record. These represent sensitive data that must be scrubbed.
 *
 * Requirement 15.5: The System SHALL NOT expose sensitive data in error messages.
 */
const SENSITIVE_PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: 'password',    pattern: /password\s*[:=]\s*\S+/i },
  { label: 'token',       pattern: /token\s*[:=]\s*\S+/i },
  { label: 'api_key',     pattern: /api[_-]?key\s*[:=]\s*\S+/i },
  { label: 'private_key', pattern: /private[_-]?key\s*[:=]\s*\S+/i },
  { label: 'secret',      pattern: /secret\s*[:=]\s*\S+/i },
  { label: 'credential',  pattern: /credential\s*[:=]\s*\S+/i },
  { label: 'bearer',      pattern: /bearer\s+[A-Za-z0-9\-._~+/]+=*/i },
  { label: 'auth_header', pattern: /authorization\s*:\s*\S+/i },
]

// ─────────────────────────────────────────────────────────────────────────────
// Canonical error messages produced by each service
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Error messages that the AudioExtractor produces (Requirement 3.6).
 * Each entry is [message, isNonRetryable].
 */
const AUDIO_EXTRACTOR_ERRORS: [string, boolean][] = [
  ['Failed to download audio: Video unavailable', true],
  ['Failed to download audio: Private video', true],
  ['Failed to download audio: region-blocked', true],
  ['Failed to download audio: no video formats available', true],
  ['Audio extraction timed out (max 10 minutes)', false],
  ['Video too long (3.5 hours, max 3 hours)', true],
  ['Failed to download audio: network error', false],
]

/**
 * Error messages that the TranscriptionService produces (Requirement 4.7).
 * Note: "unsupported audio format" is retryable by default (no matching
 * non-retryable pattern in processing-errors.ts). Only "transcript too short"
 * matches a non-retryable pattern (/transcript too short/i).
 */
const TRANSCRIPTION_ERRORS: [string, boolean][] = [
  ['Transcription failed: corrupted audio file', false],
  ['Transcription failed: unsupported audio format', false],
  ['Transcription timed out (max 30 minutes)', false],
  ['Transcript too short (50 words, min 100 words)', true],
  ['Failed to start transcription process: ENOENT', false],
]

/**
 * Error messages that the OllamaAIService produces (Requirement 5.7).
 */
const OLLAMA_ERRORS: [string, boolean][] = [
  ['AI service unavailable. Please ensure Ollama is running.', false],
  ['AI summarization timed out (max 10 minutes)', false],
  ['SEO generation timed out (max 5 minutes)', false],
  ['AI summarization failed: connect ECONNREFUSED 127.0.0.1:11434', false],
  ['Generated summary too short (80 words, min 100 words)', false],
  ['Failed to parse SEO content from AI response', false],
]

/** All canonical service errors combined. */
const ALL_SERVICE_ERRORS: [string, boolean][] = [
  ...AUDIO_EXTRACTOR_ERRORS,
  ...TRANSCRIPTION_ERRORS,
  ...OLLAMA_ERRORS,
]

// ─────────────────────────────────────────────────────────────────────────────
// Arbitraries (fast-check generators)
// ─────────────────────────────────────────────────────────────────────────────

/** Generates one of the canonical service error messages. */
const arbServiceErrorMessage = fc.constantFrom(
  ...ALL_SERVICE_ERRORS.map(([msg]) => msg)
)

/** Generates an Error object from a canonical service error message. */
const arbServiceError = arbServiceErrorMessage.map((msg) => new Error(msg))

/** Generates a NonRetryableError directly. */
const arbNonRetryableError = arbServiceErrorMessage.map(
  (msg) => new NonRetryableError(msg)
)

/**
 * Generates an error message that contains a sensitive data pattern.
 * Used to verify that such messages would be detected.
 */
const arbSensitiveErrorMessage = fc.oneof(
  fc.constant('Failed to connect: password=supersecret123'),
  fc.constant('Auth failed: token=eyJhbGciOiJIUzI1NiJ9.payload.sig'),
  fc.constant('Request error: api_key=sk-abc123def456'),
  fc.constant('TLS error: private_key=-----BEGIN RSA PRIVATE KEY-----'),
  fc.constant('Config error: secret=my-very-secret-value'),
  fc.constant('Login failed: credential=admin:password123'),
  fc.constant('HTTP 401: Authorization: Bearer eyJhbGciOiJIUzI1NiJ9'),
)

/**
 * Generates an arbitrary plain error message (no sensitive data).
 * Constrained to realistic failure descriptions.
 */
const arbPlainErrorMessage = fc.oneof(
  fc.constant('Network timeout after 30 seconds'),
  fc.constant('Connection refused to localhost:11434'),
  fc.constant('Video not found or region-blocked'),
  fc.constant('Transcription process exited with code 1'),
  fc.constant('Audio file corrupted or unreadable'),
  fc.constant('Disk space insufficient'),
  fc.constant('Worker process killed by OOM'),
  fc.constant('Redis connection lost'),
)

// ─────────────────────────────────────────────────────────────────────────────
// Helper: check if a message contains sensitive data
// ─────────────────────────────────────────────────────────────────────────────

function containsSensitiveData(message: string): boolean {
  return SENSITIVE_PATTERNS.some(({ pattern }) => pattern.test(message))
}

// ─────────────────────────────────────────────────────────────────────────────
// Property 2: Error Handling and Status Updates
// ─────────────────────────────────────────────────────────────────────────────

describe('Property 2: Error Handling and Status Updates (Requirements 3.6, 4.7, 5.7, 15.5)', () => {

  // ── 2a. classifyError always returns an Error instance ───────────────────

  describe('2a. classifyError always returns an Error instance', () => {
    it('should return an Error for any service error message', () => {
      fc.assert(
        fc.property(arbServiceError, (error) => {
          const classified = classifyError(error)
          expect(classified).toBeInstanceOf(Error)
        }),
        { numRuns: 25 }
      )
    })

    it('should return an Error when given a NonRetryableError', () => {
      fc.assert(
        fc.property(arbNonRetryableError, (error) => {
          const classified = classifyError(error)
          expect(classified).toBeInstanceOf(Error)
        }),
        { numRuns: 20 }
      )
    })

    it('should return an Error when given a plain string (non-Error throw)', () => {
      fc.assert(
        fc.property(arbPlainErrorMessage, (message) => {
          const classified = classifyError(message)
          expect(classified).toBeInstanceOf(Error)
        }),
        { numRuns: 20 }
      )
    })
  })

  // ── 2b. Error message includes the failure reason ─────────────────────────

  describe('2b. Error message includes the failure reason', () => {
    it('should preserve the original error message in the classified error', () => {
      fc.assert(
        fc.property(arbServiceError, (error) => {
          const classified = classifyError(error)
          // The classified error message must contain the original reason
          expect(classified.message).toBe(error.message)
        }),
        { numRuns: 25 }
      )
    })

    it('should preserve the failure reason for NonRetryableError inputs', () => {
      fc.assert(
        fc.property(arbNonRetryableError, (error) => {
          const classified = classifyError(error)
          expect(classified.message).toBe(error.message)
        }),
        { numRuns: 20 }
      )
    })

    it('should produce a non-empty error message for every service error', () => {
      fc.assert(
        fc.property(arbServiceError, (error) => {
          const classified = classifyError(error)
          expect(classified.message.length).toBeGreaterThan(0)
        }),
        { numRuns: 25 }
      )
    })

    it('should include the failure reason for audio extraction errors (Req 3.6)', () => {
      for (const [message] of AUDIO_EXTRACTOR_ERRORS) {
        const classified = classifyError(new Error(message))
        expect(classified.message).toContain(
          // The reason is the part after "Failed to download audio: " or the full message
          message.includes(':') ? message.split(':').slice(1).join(':').trim() : message
        )
      }
    })

    it('should include the failure reason for transcription errors (Req 4.7)', () => {
      for (const [message] of TRANSCRIPTION_ERRORS) {
        const classified = classifyError(new Error(message))
        expect(classified.message.length).toBeGreaterThan(0)
        expect(classified.message).toBe(message)
      }
    })

    it('should include the failure reason for Ollama AI errors (Req 5.7)', () => {
      for (const [message] of OLLAMA_ERRORS) {
        const classified = classifyError(new Error(message))
        expect(classified.message.length).toBeGreaterThan(0)
        expect(classified.message).toBe(message)
      }
    })
  })

  // ── 2c. No sensitive data in error messages ───────────────────────────────

  describe('2c. No sensitive data in error messages (Req 15.5)', () => {
    it('should not expose sensitive data in canonical service error messages', () => {
      fc.assert(
        fc.property(arbServiceError, (error) => {
          const classified = classifyError(error)
          expect(containsSensitiveData(classified.message)).toBe(false)
        }),
        { numRuns: 25 }
      )
    })

    it('should not expose sensitive data in NonRetryableError messages', () => {
      fc.assert(
        fc.property(arbNonRetryableError, (error) => {
          const classified = classifyError(error)
          expect(containsSensitiveData(classified.message)).toBe(false)
        }),
        { numRuns: 20 }
      )
    })

    it('should detect sensitive data patterns correctly (validation of the detector)', () => {
      fc.assert(
        fc.property(arbSensitiveErrorMessage, (message) => {
          // The sensitive data detector must flag these messages
          expect(containsSensitiveData(message)).toBe(true)
        }),
        { numRuns: 20 }
      )
    })

    it('should not flag plain error messages as containing sensitive data', () => {
      fc.assert(
        fc.property(arbPlainErrorMessage, (message) => {
          expect(containsSensitiveData(message)).toBe(false)
        }),
        { numRuns: 20 }
      )
    })

    it('should not flag any canonical service error message as sensitive', () => {
      for (const [message] of ALL_SERVICE_ERRORS) {
        expect(containsSensitiveData(message)).toBe(false)
      }
    })
  })

  // ── 2d. Non-retryable errors are correctly classified ─────────────────────

  describe('2d. Non-retryable errors result in immediate failure (no retry)', () => {
    it('should classify video-unavailable errors as non-retryable', () => {
      const nonRetryableMessages = ALL_SERVICE_ERRORS
        .filter(([, isNonRetryable]) => isNonRetryable)
        .map(([msg]) => msg)

      fc.assert(
        fc.property(fc.constantFrom(...nonRetryableMessages), (message) => {
          const error = new Error(message)
          expect(isRetryableError(error)).toBe(false)
        }),
        { numRuns: 20 }
      )
    })

    it('should classify network/timeout errors as retryable', () => {
      const retryableMessages = ALL_SERVICE_ERRORS
        .filter(([, isNonRetryable]) => !isNonRetryable)
        .map(([msg]) => msg)

      fc.assert(
        fc.property(fc.constantFrom(...retryableMessages), (message) => {
          const error = new Error(message)
          expect(isRetryableError(error)).toBe(true)
        }),
        { numRuns: 20 }
      )
    })

    it('should classify NonRetryableError instances as non-retryable regardless of message', () => {
      fc.assert(
        fc.property(arbServiceErrorMessage, (message) => {
          const error = new NonRetryableError(message)
          expect(isRetryableError(error)).toBe(false)
        }),
        { numRuns: 25 }
      )
    })

    it('should wrap non-retryable pattern errors in NonRetryableError', () => {
      const nonRetryableMessages = ALL_SERVICE_ERRORS
        .filter(([, isNonRetryable]) => isNonRetryable)
        .map(([msg]) => msg)

      fc.assert(
        fc.property(fc.constantFrom(...nonRetryableMessages), (message) => {
          const classified = classifyError(new Error(message))
          expect(classified).toBeInstanceOf(NonRetryableError)
        }),
        { numRuns: 20 }
      )
    })

    it('should NOT wrap retryable errors in NonRetryableError', () => {
      const retryableMessages = ALL_SERVICE_ERRORS
        .filter(([, isNonRetryable]) => !isNonRetryable)
        .map(([msg]) => msg)

      fc.assert(
        fc.property(fc.constantFrom(...retryableMessages), (message) => {
          const classified = classifyError(new Error(message))
          expect(classified).not.toBeInstanceOf(NonRetryableError)
        }),
        { numRuns: 20 }
      )
    })
  })

  // ── 2e. Error classification is idempotent ────────────────────────────────

  describe('2e. Error classification is idempotent', () => {
    it('should produce the same result when classifyError is called twice', () => {
      fc.assert(
        fc.property(arbServiceError, (error) => {
          const first = classifyError(error)
          const second = classifyError(first)

          expect(second.message).toBe(first.message)
          expect(second instanceof NonRetryableError).toBe(
            first instanceof NonRetryableError
          )
        }),
        { numRuns: 25 }
      )
    })

    it('should produce the same retryability result when isRetryableError is called twice', () => {
      fc.assert(
        fc.property(arbServiceError, (error) => {
          const classified = classifyError(error)
          const firstCall = isRetryableError(classified)
          const secondCall = isRetryableError(classified)

          expect(firstCall).toBe(secondCall)
        }),
        { numRuns: 25 }
      )
    })
  })

  // ── 2f. Error message structure is well-formed ────────────────────────────

  describe('2f. Error message structure is well-formed', () => {
    it('should produce a string message for every classified error', () => {
      fc.assert(
        fc.property(arbServiceError, (error) => {
          const classified = classifyError(error)
          expect(typeof classified.message).toBe('string')
        }),
        { numRuns: 25 }
      )
    })

    it('should produce a non-empty name for every classified error', () => {
      fc.assert(
        fc.property(arbServiceError, (error) => {
          const classified = classifyError(error)
          expect(classified.name.length).toBeGreaterThan(0)
        }),
        { numRuns: 25 }
      )
    })

    it('should set name to NonRetryableError for non-retryable classified errors', () => {
      const nonRetryableMessages = ALL_SERVICE_ERRORS
        .filter(([, isNonRetryable]) => isNonRetryable)
        .map(([msg]) => msg)

      fc.assert(
        fc.property(fc.constantFrom(...nonRetryableMessages), (message) => {
          const classified = classifyError(new Error(message))
          expect(classified.name).toBe('NonRetryableError')
        }),
        { numRuns: 20 }
      )
    })
  })
})
