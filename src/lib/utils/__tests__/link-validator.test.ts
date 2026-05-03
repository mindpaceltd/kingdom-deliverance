/**
 * Unit Tests for Link Validator Utility
 * Feature: sermon-ai-link-processor
 * 
 * Tests URL validation logic for YouTube, Vimeo, and direct video files.
 * Validates Requirements 1.3, 2.1, 2.2
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { validateMediaLink } from '../link-validator'
import type { LinkValidation } from '../../types'

describe('validateMediaLink', () => {
  // ---------------------------------------------------------------------------
  // Valid YouTube URLs
  // ---------------------------------------------------------------------------

  describe('YouTube URLs (valid)', () => {
    it('returns valid for youtube.com/watch?v= URLs', () => {
      const urls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'http://youtube.com/watch?v=abc123defgh',
        'https://youtube.com/watch?v=XYZ_-123456',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s',
      ]

      for (const url of urls) {
        const result = validateMediaLink(url)
        expect(result.valid).toBe(true)
        expect(result.type).toBe('youtube')
        expect(result.error).toBeUndefined()
      }
    })

    it('returns valid for youtu.be short URLs', () => {
      const urls = [
        'https://youtu.be/dQw4w9WgXcQ',
        'http://youtu.be/abc123defgh',
        'https://youtu.be/XYZ_-123456',
        'https://youtu.be/dQw4w9WgXcQ?t=30',
      ]

      for (const url of urls) {
        const result = validateMediaLink(url)
        expect(result.valid).toBe(true)
        expect(result.type).toBe('youtube')
        expect(result.error).toBeUndefined()
      }
    })

    it('returns valid for youtube.com/embed URLs', () => {
      const urls = [
        'https://www.youtube.com/embed/dQw4w9WgXcQ',
        'http://youtube.com/embed/abc123defgh',
        'https://youtube.com/embed/XYZ_-123456',
      ]

      for (const url of urls) {
        const result = validateMediaLink(url)
        expect(result.valid).toBe(true)
        expect(result.type).toBe('youtube')
        expect(result.error).toBeUndefined()
      }
    })
  })

  // ---------------------------------------------------------------------------
  // Unsupported Vimeo URLs
  // ---------------------------------------------------------------------------

  describe('Vimeo URLs (unsupported)', () => {
    it('returns error for vimeo.com URLs', () => {
      const urls = [
        'https://vimeo.com/123456789',
        'http://www.vimeo.com/987654321',
        'https://vimeo.com/12345',
      ]

      for (const url of urls) {
        const result = validateMediaLink(url)
        expect(result.valid).toBe(false)
        expect(result.type).toBe('vimeo')
        expect(result.error).toBe(
          'Vimeo videos are not yet supported. Please use YouTube links or enter content manually.'
        )
      }
    })
  })

  // ---------------------------------------------------------------------------
  // Unsupported Direct Video Files
  // ---------------------------------------------------------------------------

  describe('Direct video files (unsupported)', () => {
    it('returns error for .mp4 URLs', () => {
      const urls = [
        'https://example.com/video.mp4',
        'http://cdn.church.org/sermons/message.mp4',
        'https://storage.example.com/file.MP4',
      ]

      for (const url of urls) {
        const result = validateMediaLink(url)
        expect(result.valid).toBe(false)
        expect(result.type).toBe('direct')
        expect(result.error).toBe(
          'Direct video files are not yet supported. Please use YouTube links or enter content manually.'
        )
      }
    })

    it('returns error for .webm URLs', () => {
      const result = validateMediaLink('https://example.com/video.webm')
      expect(result.valid).toBe(false)
      expect(result.type).toBe('direct')
      expect(result.error).toBe(
        'Direct video files are not yet supported. Please use YouTube links or enter content manually.'
      )
    })

    it('returns error for .ogg URLs', () => {
      const result = validateMediaLink('https://example.com/video.ogg')
      expect(result.valid).toBe(false)
      expect(result.type).toBe('direct')
      expect(result.error).toBe(
        'Direct video files are not yet supported. Please use YouTube links or enter content manually.'
      )
    })

    it('returns error for .mov URLs', () => {
      const result = validateMediaLink('https://example.com/video.mov')
      expect(result.valid).toBe(false)
      expect(result.type).toBe('direct')
      expect(result.error).toBe(
        'Direct video files are not yet supported. Please use YouTube links or enter content manually.'
      )
    })

    it('is case-insensitive for file extensions', () => {
      const urls = [
        'https://example.com/video.MP4',
        'https://example.com/video.WebM',
        'https://example.com/video.OGG',
        'https://example.com/video.MOV',
      ]

      for (const url of urls) {
        const result = validateMediaLink(url)
        expect(result.valid).toBe(false)
        expect(result.type).toBe('direct')
      }
    })
  })

  // ---------------------------------------------------------------------------
  // Invalid URL Formats
  // ---------------------------------------------------------------------------

  describe('Invalid URL formats', () => {
    it('returns error for malformed URLs', () => {
      const urls = [
        'not-a-url',
        'htp://broken.com',
        'www.youtube.com/watch?v=abc',
        'youtube.com/watch?v=abc',
        '//youtube.com/watch?v=abc',
      ]

      for (const url of urls) {
        const result = validateMediaLink(url)
        expect(result.valid).toBe(false)
        expect(result.error).toBe('Invalid URL format')
      }
    })

    it('returns error for empty string', () => {
      const result = validateMediaLink('')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid URL format')
    })

    it('returns error for unsupported platforms', () => {
      const urls = [
        'https://facebook.com/video/123',
        'https://twitter.com/user/status/123',
        'https://example.com/page',
        'https://example.com',
      ]

      for (const url of urls) {
        const result = validateMediaLink(url)
        expect(result.valid).toBe(false)
        expect(result.error).toBe('Unsupported link format. Please paste a YouTube video URL.')
      }
    })
  })

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------

  describe('Edge cases', () => {
    it('handles YouTube URLs with query parameters', () => {
      const urls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLxyz',
        'https://youtu.be/dQw4w9WgXcQ?t=30&feature=share',
      ]

      for (const url of urls) {
        const result = validateMediaLink(url)
        expect(result.valid).toBe(true)
        expect(result.type).toBe('youtube')
      }
    })

    it('handles YouTube URLs with fragments', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ#comments'
      const result = validateMediaLink(url)
      expect(result.valid).toBe(true)
      expect(result.type).toBe('youtube')
    })

    it('rejects YouTube URLs with invalid video ID length', () => {
      const urls = [
        'https://www.youtube.com/watch?v=short',
        'https://www.youtube.com/watch?v=toolongvideoid123',
        'https://youtu.be/abc',
      ]

      for (const url of urls) {
        const result = validateMediaLink(url)
        expect(result.valid).toBe(false)
      }
    })

    it('handles direct video URLs with query parameters', () => {
      const url = 'https://example.com/video.mp4?token=abc123&v=1'
      const result = validateMediaLink(url)
      expect(result.valid).toBe(false)
      expect(result.type).toBe('direct')
    })
  })

  // ---------------------------------------------------------------------------
  // Property-Based Tests
  // ---------------------------------------------------------------------------

  describe('Property-based tests', () => {
    it('Property: generated youtube.com/watch URLs with valid video IDs are always valid', () => {
      fc.assert(
        fc.property(
          // Generate valid YouTube video IDs (11 characters, alphanumeric + _ -)
          fc
            .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-'.split('')), {
              minLength: 11,
              maxLength: 11,
            })
            .map((chars) => chars.join('')),
          (videoId) => {
            const url = `https://www.youtube.com/watch?v=${videoId}`
            const result = validateMediaLink(url)
            return result.valid === true && result.type === 'youtube'
          }
        ),
        { numRuns: 100 }
      )
    })

    it('Property: generated youtu.be URLs with valid video IDs are always valid', () => {
      fc.assert(
        fc.property(
          fc
            .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-'.split('')), {
              minLength: 11,
              maxLength: 11,
            })
            .map((chars) => chars.join('')),
          (videoId) => {
            const url = `https://youtu.be/${videoId}`
            const result = validateMediaLink(url)
            return result.valid === true && result.type === 'youtube'
          }
        ),
        { numRuns: 100 }
      )
    })

    it('Property: generated vimeo.com URLs are always invalid with correct error', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 999_999_999 }), (videoId) => {
          const url = `https://vimeo.com/${videoId}`
          const result = validateMediaLink(url)
          return (
            result.valid === false &&
            result.type === 'vimeo' &&
            result.error === 'Vimeo videos are not yet supported. Please use YouTube links or enter content manually.'
          )
        }),
        { numRuns: 100 }
      )
    })

    it('Property: URLs ending with video extensions are always invalid with correct error', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('mp4', 'webm', 'ogg', 'mov', 'MP4', 'WEBM', 'OGG', 'MOV'),
          fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z0-9-]+$/.test(s)),
          (ext, filename) => {
            const url = `https://example.com/${filename}.${ext}`
            const result = validateMediaLink(url)
            return (
              result.valid === false &&
              result.type === 'direct' &&
              result.error === 'Direct video files are not yet supported. Please use YouTube links or enter content manually.'
            )
          }
        ),
        { numRuns: 100 }
      )
    })

    it('Property: random strings without valid patterns are always invalid', () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 100 })
            .filter(
              (s) =>
                !s.includes('youtube.com/watch') &&
                !s.includes('youtu.be/') &&
                !s.includes('youtube.com/embed') &&
                !s.includes('vimeo.com/') &&
                !/\.(mp4|webm|ogg|mov)$/i.test(s)
            ),
          (input) => {
            const result = validateMediaLink(input)
            return result.valid === false
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
