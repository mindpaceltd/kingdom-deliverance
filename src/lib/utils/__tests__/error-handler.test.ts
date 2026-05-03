/**
 * Unit Tests for Error Handler Utility
 * 
 * Tests the getUserFriendlyError function to ensure it correctly maps
 * technical errors to user-friendly messages with recovery suggestions.
 */

import { describe, it, expect } from 'vitest'
import { getUserFriendlyError } from '../error-handler'

describe('getUserFriendlyError', () => {
  describe('Invalid URL format errors', () => {
    it('should map "invalid url" error', () => {
      const error = new Error('Invalid URL format')
      expect(getUserFriendlyError(error)).toBe(
        'Invalid URL format. Please paste a valid YouTube link.'
      )
    })

    it('should map "malformed url" error', () => {
      const error = new Error('Malformed URL provided')
      expect(getUserFriendlyError(error)).toBe(
        'Invalid URL format. Please paste a valid YouTube link.'
      )
    })

    it('should map "url format" error', () => {
      const error = new Error('URL format is incorrect')
      expect(getUserFriendlyError(error)).toBe(
        'Invalid URL format. Please paste a valid YouTube link.'
      )
    })
  })

  describe('Unsupported platform errors', () => {
    it('should map Vimeo error', () => {
      const error = new Error('Vimeo videos are not supported')
      expect(getUserFriendlyError(error)).toBe(
        'Vimeo/direct videos not yet supported. Use YouTube or enter manually.'
      )
    })

    it('should map direct video error', () => {
      const error = new Error('Direct video files are not supported')
      expect(getUserFriendlyError(error)).toBe(
        'Vimeo/direct videos not yet supported. Use YouTube or enter manually.'
      )
    })

    it('should map "not yet supported" error', () => {
      const error = new Error('This platform is not yet supported')
      expect(getUserFriendlyError(error)).toBe(
        'Vimeo/direct videos not yet supported. Use YouTube or enter manually.'
      )
    })

    it('should map "unsupported" error', () => {
      const error = new Error('Unsupported link format')
      expect(getUserFriendlyError(error)).toBe(
        'Vimeo/direct videos not yet supported. Use YouTube or enter manually.'
      )
    })
  })

  describe('Video inaccessible errors', () => {
    it('should map "private" video error', () => {
      const error = new Error('Video is private')
      expect(getUserFriendlyError(error)).toBe(
        'Video is private, deleted, or unavailable. Try a different video.'
      )
    })

    it('should map "deleted" video error', () => {
      const error = new Error('Video has been deleted')
      expect(getUserFriendlyError(error)).toBe(
        'Video is private, deleted, or unavailable. Try a different video.'
      )
    })

    it('should map "unavailable" video error', () => {
      const error = new Error('Video is unavailable')
      expect(getUserFriendlyError(error)).toBe(
        'Video is private, deleted, or unavailable. Try a different video.'
      )
    })

    it('should map "inaccessible" video error', () => {
      const error = new Error('Video is inaccessible')
      expect(getUserFriendlyError(error)).toBe(
        'Video is private, deleted, or unavailable. Try a different video.'
      )
    })

    it('should map "not found" video error', () => {
      const error = new Error('Video not found')
      expect(getUserFriendlyError(error)).toBe(
        'Video is private, deleted, or unavailable. Try a different video.'
      )
    })

    it('should map "video may be" error', () => {
      const error = new Error('Failed to extract transcript. The video may be private or unavailable.')
      expect(getUserFriendlyError(error)).toBe(
        'Video is private, deleted, or unavailable. Try a different video.'
      )
    })
  })

  describe('No transcript errors', () => {
    it('should map "transcripts disabled" error', () => {
      const error = new Error('Transcripts are disabled for this video')
      expect(getUserFriendlyError(error)).toBe(
        'Transcripts are disabled for this video. Please enter content manually.'
      )
    })

    it('should map "transcript not available" error', () => {
      const error = new Error('Transcript not available')
      expect(getUserFriendlyError(error)).toBe(
        'Transcripts are disabled for this video. Please enter content manually.'
      )
    })
  })

  describe('Transcript too short errors', () => {
    it('should map "transcript too short" error', () => {
      const error = new Error('Transcript too short or empty')
      expect(getUserFriendlyError(error)).toBe(
        'Transcript is too short to process. Please enter content manually.'
      )
    })

    it('should map "transcript empty" error', () => {
      const error = new Error('Transcript is empty')
      expect(getUserFriendlyError(error)).toBe(
        'Transcript is too short to process. Please enter content manually.'
      )
    })
  })

  describe('AI timeout errors', () => {
    it('should map "timeout" error', () => {
      const error = new Error('Request timeout')
      expect(getUserFriendlyError(error)).toBe(
        'Processing took too long. Please try again or enter content manually.'
      )
    })

    it('should map "took too long" error', () => {
      const error = new Error('Processing took too long')
      expect(getUserFriendlyError(error)).toBe(
        'Processing took too long. Please try again or enter content manually.'
      )
    })

    it('should map "timed out" error', () => {
      const error = new Error('Operation timed out')
      expect(getUserFriendlyError(error)).toBe(
        'Processing took too long. Please try again or enter content manually.'
      )
    })
  })

  describe('AI service errors', () => {
    it('should map "ai service" error', () => {
      const error = new Error('AI service error')
      expect(getUserFriendlyError(error)).toBe(
        'AI service temporarily unavailable. Please try again in a few minutes.'
      )
    })

    it('should map "gemini" error', () => {
      const error = new Error('Gemini API error')
      expect(getUserFriendlyError(error)).toBe(
        'AI service temporarily unavailable. Please try again in a few minutes.'
      )
    })

    it('should map "api error" error', () => {
      const error = new Error('API error occurred')
      expect(getUserFriendlyError(error)).toBe(
        'AI service temporarily unavailable. Please try again in a few minutes.'
      )
    })

    it('should map "service error" error', () => {
      const error = new Error('Service error')
      expect(getUserFriendlyError(error)).toBe(
        'AI service temporarily unavailable. Please try again in a few minutes.'
      )
    })

    it('should map "failed to generate" error', () => {
      const error = new Error('Failed to generate summary')
      expect(getUserFriendlyError(error)).toBe(
        'AI service temporarily unavailable. Please try again in a few minutes.'
      )
    })
  })

  describe('Rate limit errors', () => {
    it('should map "rate limit" error', () => {
      const error = new Error('Rate limit exceeded')
      expect(getUserFriendlyError(error)).toBe(
        "You've reached the limit of 5 processing requests per hour. Try again later."
      )
    })

    it('should map "too many requests" error', () => {
      const error = new Error('Too many requests')
      expect(getUserFriendlyError(error)).toBe(
        "You've reached the limit of 5 processing requests per hour. Try again later."
      )
    })

    it('should map "limit exceeded" error', () => {
      const error = new Error('Limit exceeded')
      expect(getUserFriendlyError(error)).toBe(
        "You've reached the limit of 5 processing requests per hour. Try again later."
      )
    })
  })

  describe('Network errors', () => {
    it('should map "network" error', () => {
      const error = new Error('Network error')
      expect(getUserFriendlyError(error)).toBe(
        'Network error. Check your connection and try again.'
      )
    })

    it('should map "connection" error', () => {
      const error = new Error('Connection failed')
      expect(getUserFriendlyError(error)).toBe(
        'Network error. Check your connection and try again.'
      )
    })

    it('should map "fetch failed" error', () => {
      const error = new Error('Fetch failed')
      expect(getUserFriendlyError(error)).toBe(
        'Network error. Check your connection and try again.'
      )
    })

    it('should map "ECONNREFUSED" error', () => {
      const error = new Error('ECONNREFUSED')
      expect(getUserFriendlyError(error)).toBe(
        'Network error. Check your connection and try again.'
      )
    })

    it('should map "ENOTFOUND" error', () => {
      const error = new Error('ENOTFOUND')
      expect(getUserFriendlyError(error)).toBe(
        'Network error. Check your connection and try again.'
      )
    })
  })

  describe('Generic/unknown errors', () => {
    it('should map unknown error to generic message', () => {
      const error = new Error('Something completely unexpected happened')
      expect(getUserFriendlyError(error)).toBe(
        'An unexpected error occurred. Please try again or enter content manually.'
      )
    })

    it('should handle empty error message', () => {
      const error = new Error('')
      expect(getUserFriendlyError(error)).toBe(
        'An unexpected error occurred. Please try again or enter content manually.'
      )
    })

    it('should handle error with special characters', () => {
      const error = new Error('Error: @#$%^&*()')
      expect(getUserFriendlyError(error)).toBe(
        'An unexpected error occurred. Please try again or enter content manually.'
      )
    })
  })

  describe('Case insensitivity', () => {
    it('should handle uppercase error messages', () => {
      const error = new Error('INVALID URL FORMAT')
      expect(getUserFriendlyError(error)).toBe(
        'Invalid URL format. Please paste a valid YouTube link.'
      )
    })

    it('should handle mixed case error messages', () => {
      const error = new Error('RaTe LiMiT ExCeEdEd')
      expect(getUserFriendlyError(error)).toBe(
        "You've reached the limit of 5 processing requests per hour. Try again later."
      )
    })
  })

  describe('Error message contains recovery suggestions', () => {
    it('should include recovery suggestion for invalid URL', () => {
      const error = new Error('Invalid URL')
      const message = getUserFriendlyError(error)
      expect(message).toContain('Please paste a valid YouTube link')
    })

    it('should include recovery suggestion for unsupported platform', () => {
      const error = new Error('Vimeo not supported')
      const message = getUserFriendlyError(error)
      expect(message).toContain('Use YouTube or enter manually')
    })

    it('should include recovery suggestion for inaccessible video', () => {
      const error = new Error('Video is private')
      const message = getUserFriendlyError(error)
      expect(message).toContain('Try a different video')
    })

    it('should include recovery suggestion for no transcript', () => {
      const error = new Error('Transcripts disabled')
      const message = getUserFriendlyError(error)
      expect(message).toContain('Please enter content manually')
    })

    it('should include recovery suggestion for timeout', () => {
      const error = new Error('Timeout')
      const message = getUserFriendlyError(error)
      expect(message).toContain('Please try again or enter content manually')
    })

    it('should include recovery suggestion for AI service error', () => {
      const error = new Error('AI service error')
      const message = getUserFriendlyError(error)
      expect(message).toContain('Please try again in a few minutes')
    })

    it('should include recovery suggestion for rate limit', () => {
      const error = new Error('Rate limit')
      const message = getUserFriendlyError(error)
      expect(message).toContain('Try again later')
    })

    it('should include recovery suggestion for network error', () => {
      const error = new Error('Network error')
      const message = getUserFriendlyError(error)
      expect(message).toContain('Check your connection and try again')
    })
  })
})
