import { describe, it, expect } from 'vitest'
import {
  isRetryableError,
  classifyError,
  isConnectionError,
  isTimeoutError,
  isServiceUnavailableError,
} from '../error-classifier'

describe('Error Classifier', () => {
  describe('isRetryableError', () => {
    it('should classify ECONNREFUSED as retryable', () => {
      const error = new Error('connect ECONNREFUSED 127.0.0.1:11434')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should classify connection refused as retryable', () => {
      const error = new Error('Connection refused by server')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should classify timeout errors as retryable', () => {
      const error = new Error('Request timeout after 10 minutes')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should classify timed out errors as retryable', () => {
      const error = new Error('Operation timed out')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should classify ETIMEDOUT as retryable', () => {
      const error = new Error('connect ETIMEDOUT')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should classify ENOTFOUND as retryable', () => {
      const error = new Error('getaddrinfo ENOTFOUND localhost')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should classify AI service unavailable as retryable', () => {
      const error = new Error('AI service unavailable. Please ensure Ollama is running.')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should classify Ollama unavailable as retryable', () => {
      const error = new Error('Ollama unavailable')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should classify network errors as retryable', () => {
      const error = new Error('Network error occurred')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should classify fetch failed as retryable', () => {
      const error = new Error('fetch failed')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should classify transcription service unavailable as retryable', () => {
      const error = new Error('Transcription service unavailable')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should classify invalid URL as non-retryable', () => {
      const error = new Error('Invalid URL format')
      expect(isRetryableError(error)).toBe(false)
    })

    it('should classify video unavailable as non-retryable', () => {
      const error = new Error('Video is private or unavailable')
      expect(isRetryableError(error)).toBe(false)
    })

    it('should classify video too long as non-retryable', () => {
      const error = new Error('Video too long (4 hours, max 3 hours)')
      expect(isRetryableError(error)).toBe(false)
    })

    it('should classify transcript too short as non-retryable', () => {
      const error = new Error('Transcript too short (50 words, min 100 words)')
      expect(isRetryableError(error)).toBe(false)
    })

    it('should classify invalid content structure as non-retryable', () => {
      const error = new Error('Invalid SEO content structure')
      expect(isRetryableError(error)).toBe(false)
    })

    it('should classify rate limit exceeded as non-retryable', () => {
      const error = new Error('Rate limit exceeded')
      expect(isRetryableError(error)).toBe(false)
    })

    it('should be case-insensitive', () => {
      const error1 = new Error('ECONNREFUSED')
      const error2 = new Error('econnrefused')
      const error3 = new Error('EConnRefused')
      
      expect(isRetryableError(error1)).toBe(true)
      expect(isRetryableError(error2)).toBe(true)
      expect(isRetryableError(error3)).toBe(true)
    })
  })

  describe('classifyError', () => {
    it('should return "retryable" for connection errors', () => {
      const error = new Error('ECONNREFUSED')
      expect(classifyError(error)).toBe('retryable')
    })

    it('should return "retryable" for timeout errors', () => {
      const error = new Error('Request timed out')
      expect(classifyError(error)).toBe('retryable')
    })

    it('should return "non-retryable" for invalid URL', () => {
      const error = new Error('Invalid URL format')
      expect(classifyError(error)).toBe('non-retryable')
    })

    it('should return "non-retryable" for video unavailable', () => {
      const error = new Error('Video is private or unavailable')
      expect(classifyError(error)).toBe('non-retryable')
    })
  })

  describe('isConnectionError', () => {
    it('should detect ECONNREFUSED', () => {
      const error = new Error('connect ECONNREFUSED 127.0.0.1:11434')
      expect(isConnectionError(error)).toBe(true)
    })

    it('should detect connection refused', () => {
      const error = new Error('Connection refused by server')
      expect(isConnectionError(error)).toBe(true)
    })

    it('should detect fetch failed', () => {
      const error = new Error('fetch failed')
      expect(isConnectionError(error)).toBe(true)
    })

    it('should not detect timeout as connection error', () => {
      const error = new Error('Request timeout')
      expect(isConnectionError(error)).toBe(false)
    })

    it('should not detect invalid URL as connection error', () => {
      const error = new Error('Invalid URL format')
      expect(isConnectionError(error)).toBe(false)
    })
  })

  describe('isTimeoutError', () => {
    it('should detect timeout', () => {
      const error = new Error('Request timeout')
      expect(isTimeoutError(error)).toBe(true)
    })

    it('should detect timed out', () => {
      const error = new Error('Operation timed out')
      expect(isTimeoutError(error)).toBe(true)
    })

    it('should not detect connection error as timeout', () => {
      const error = new Error('ECONNREFUSED')
      expect(isTimeoutError(error)).toBe(false)
    })

    it('should not detect invalid URL as timeout', () => {
      const error = new Error('Invalid URL format')
      expect(isTimeoutError(error)).toBe(false)
    })
  })

  describe('isServiceUnavailableError', () => {
    it('should detect service unavailable', () => {
      const error = new Error('AI service unavailable')
      expect(isServiceUnavailableError(error)).toBe(true)
    })

    it('should detect unavailable', () => {
      const error = new Error('Ollama unavailable')
      expect(isServiceUnavailableError(error)).toBe(true)
    })

    it('should not detect connection error as service unavailable', () => {
      const error = new Error('ECONNREFUSED')
      expect(isServiceUnavailableError(error)).toBe(false)
    })

    it('should not detect timeout as service unavailable', () => {
      const error = new Error('Request timeout')
      expect(isServiceUnavailableError(error)).toBe(false)
    })
  })
})
