/**
 * Unit Tests for Error Classification (processing-errors.ts)
 *
 * Validates that isRetryableError and classifyError correctly distinguish
 * between transient (retryable) failures and permanent (non-retryable)
 * failures, and that NonRetryableError is handled as a first-class type.
 *
 * Requirements: 7.2, 19.1
 */

import { describe, it, expect } from 'vitest'
import {
  NonRetryableError,
  isRetryableError,
  classifyError,
} from '../processing-errors'

// ---------------------------------------------------------------------------
// Task 15.3 – isRetryableError
// ---------------------------------------------------------------------------

describe('isRetryableError', () => {
  // -------------------------------------------------------------------------
  // Retryable errors
  // -------------------------------------------------------------------------

  describe('retryable errors', () => {
    it('classifies timeout errors as retryable', () => {
      expect(isRetryableError(new Error('Request timeout after 10 minutes'))).toBe(true)
    })

    it('classifies "timed out" errors as retryable', () => {
      expect(isRetryableError(new Error('Operation timed out'))).toBe(true)
    })

    it('classifies ECONNREFUSED as retryable', () => {
      expect(isRetryableError(new Error('connect ECONNREFUSED 127.0.0.1:11434'))).toBe(true)
    })

    it('classifies ECONNRESET as retryable', () => {
      expect(isRetryableError(new Error('read ECONNRESET'))).toBe(true)
    })

    it('classifies ETIMEDOUT as retryable', () => {
      expect(isRetryableError(new Error('connect ETIMEDOUT'))).toBe(true)
    })

    it('classifies ENOTFOUND (DNS failure) as retryable', () => {
      expect(isRetryableError(new Error('getaddrinfo ENOTFOUND localhost'))).toBe(true)
    })

    it('classifies generic network errors as retryable', () => {
      expect(isRetryableError(new Error('A network error occurred'))).toBe(true)
    })

    it('classifies "Ollama unavailable" as retryable', () => {
      expect(isRetryableError(new Error('Ollama unavailable'))).toBe(true)
    })

    it('classifies "AI service unavailable" as retryable', () => {
      expect(isRetryableError(new Error('AI service unavailable. Please ensure Ollama is running.'))).toBe(true)
    })

    it('classifies "transcription timed out" as retryable', () => {
      expect(isRetryableError(new Error('Transcription timed out after 30 minutes'))).toBe(true)
    })

    it('classifies "audio extraction timed out" as retryable', () => {
      expect(isRetryableError(new Error('Audio extraction timed out after 10 minutes'))).toBe(true)
    })

    it('classifies "socket hang up" as retryable', () => {
      expect(isRetryableError(new Error('socket hang up'))).toBe(true)
    })

    it('defaults unknown errors to retryable (conservative strategy)', () => {
      expect(isRetryableError(new Error('Something completely unexpected happened'))).toBe(true)
    })

    it('defaults non-Error objects to retryable', () => {
      expect(isRetryableError('raw string error')).toBe(true)
      expect(isRetryableError({ code: 'UNKNOWN' })).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // Non-retryable errors
  // -------------------------------------------------------------------------

  describe('non-retryable errors', () => {
    it('classifies NonRetryableError instances as non-retryable', () => {
      const err = new NonRetryableError('Video is private')
      expect(isRetryableError(err)).toBe(false)
    })

    it('classifies "video deleted" errors as non-retryable', () => {
      expect(isRetryableError(new Error('This video has been deleted'))).toBe(false)
    })

    it('classifies "video unavailable" errors as non-retryable', () => {
      expect(isRetryableError(new Error('Video unavailable in your region'))).toBe(false)
    })

    it('classifies "private video" errors as non-retryable', () => {
      expect(isRetryableError(new Error('This is a private video'))).toBe(false)
    })

    it('classifies "video not found" errors as non-retryable', () => {
      expect(isRetryableError(new Error('Video not found'))).toBe(false)
    })

    it('classifies "region blocked" errors as non-retryable', () => {
      expect(isRetryableError(new Error('This video is region-blocked'))).toBe(false)
    })

    it('classifies "invalid URL" errors as non-retryable', () => {
      expect(isRetryableError(new Error('Invalid URL format provided'))).toBe(false)
    })

    it('classifies "unsupported URL" errors as non-retryable', () => {
      expect(isRetryableError(new Error('Unsupported URL: cannot extract video'))).toBe(false)
    })

    it('classifies "transcript too short" errors as non-retryable', () => {
      expect(isRetryableError(new Error('Transcript too short (50 words, min 100 words)'))).toBe(false)
    })

    it('classifies "video too long" errors as non-retryable', () => {
      expect(isRetryableError(new Error('Video too long (4 hours, max 3 hours)'))).toBe(false)
    })

    it('classifies "no video formats" errors as non-retryable', () => {
      expect(isRetryableError(new Error('No video formats available for this URL'))).toBe(false)
    })

    it('gives non-retryable patterns priority over retryable patterns', () => {
      // A message that could match both: "invalid URL timeout" — non-retryable wins
      const err = new Error('invalid URL timeout')
      expect(isRetryableError(err)).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// Task 15.3 – classifyError
// ---------------------------------------------------------------------------

describe('classifyError', () => {
  it('returns the original NonRetryableError unchanged', () => {
    const original = new NonRetryableError('Video is private')
    const result = classifyError(original)
    expect(result).toBe(original)
    expect(result).toBeInstanceOf(NonRetryableError)
  })

  it('wraps a non-retryable plain Error in NonRetryableError', () => {
    const plain = new Error('Video not found')
    const result = classifyError(plain)
    expect(result).toBeInstanceOf(NonRetryableError)
    expect(result.message).toBe('Video not found')
  })

  it('preserves the original error as cause when wrapping', () => {
    const plain = new Error('Video unavailable')
    const result = classifyError(plain)
    expect(result).toBeInstanceOf(NonRetryableError)
    // The stack should contain "Caused by:" from NonRetryableError constructor
    expect(result.stack).toContain('Caused by:')
  })

  it('returns a retryable plain Error unchanged (not wrapped)', () => {
    const plain = new Error('connect ECONNREFUSED 127.0.0.1:11434')
    const result = classifyError(plain)
    expect(result).toBe(plain)
    expect(result).not.toBeInstanceOf(NonRetryableError)
  })

  it('converts a non-Error non-retryable value to NonRetryableError', () => {
    const result = classifyError('Video not found')
    expect(result).toBeInstanceOf(NonRetryableError)
    expect(result.message).toBe('Video not found')
  })

  it('converts an unknown non-Error retryable value to a plain Error', () => {
    const result = classifyError('connect ECONNREFUSED')
    expect(result).toBeInstanceOf(Error)
    expect(result).not.toBeInstanceOf(NonRetryableError)
    expect(result.message).toBe('connect ECONNREFUSED')
  })
})

// ---------------------------------------------------------------------------
// NonRetryableError class
// ---------------------------------------------------------------------------

describe('NonRetryableError', () => {
  it('has name "NonRetryableError"', () => {
    const err = new NonRetryableError('test')
    expect(err.name).toBe('NonRetryableError')
  })

  it('has isNonRetryable flag set to true', () => {
    const err = new NonRetryableError('test')
    expect(err.isNonRetryable).toBe(true)
  })

  it('is an instance of Error', () => {
    const err = new NonRetryableError('test')
    expect(err).toBeInstanceOf(Error)
  })

  it('accepts an optional cause and appends it to the stack', () => {
    const cause = new Error('root cause')
    const err = new NonRetryableError('wrapper', cause)
    expect(err.stack).toContain('Caused by:')
    expect(err.stack).toContain('root cause')
  })

  it('works without a cause', () => {
    const err = new NonRetryableError('no cause')
    expect(err.message).toBe('no cause')
    expect(err.stack).not.toContain('Caused by:')
  })
})
