// Feature: kdcuganda-cms-platform, Property 6 / 9 / 10
// Property 6: Slug generation is deterministic and URL-safe — Validates: Requirements 3.3
// Property 9: Video URL validator correctly classifies URLs — Validates: Requirements 4.3
// Property 10: File size validator enforces 50 MB boundary — Validates: Requirements 7.4

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { generateSlug, validateVideoUrl, validateFileSize } from '../utils'

// ---------------------------------------------------------------------------
// Property 6 — generateSlug: deterministic and URL-safe
// Validates: Requirements 3.3
// ---------------------------------------------------------------------------

describe('Property 6 — generateSlug: deterministic and URL-safe', () => {
  const URL_SAFE_RE = /^[a-z0-9-]*$/

  it('returns only lowercase alphanumeric characters and hyphens', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 200 }), (input) => {
        const slug = generateSlug(input)
        return URL_SAFE_RE.test(slug)
      }),
      { numRuns: 100 }
    )
  })

  it('is deterministic — same input always produces same output', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 200 }), (input) => {
        return generateSlug(input) === generateSlug(input)
      }),
      { numRuns: 100 }
    )
  })

  it('never produces a leading or trailing hyphen', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 200 }), (input) => {
        const slug = generateSlug(input)
        if (slug.length === 0) return true // empty is fine
        return !slug.startsWith('-') && !slug.endsWith('-')
      }),
      { numRuns: 100 }
    )
  })

  it('never produces consecutive hyphens', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 200 }), (input) => {
        const slug = generateSlug(input)
        return !slug.includes('--')
      }),
      { numRuns: 100 }
    )
  })

  it('whitespace-only input produces an empty string', () => {
    fc.assert(
      fc.property(
        // Generate a string of 1–50 space characters
        fc.integer({ min: 1, max: 50 }).map((n) => ' '.repeat(n)),
        (input) => {
          return generateSlug(input) === ''
        }
      ),
      { numRuns: 100 }
    )
  })

  it('empty string input produces an empty string', () => {
    expect(generateSlug('')).toBe('')
  })

  it('preserves alphanumeric content (lowercased)', () => {
    expect(generateSlug('Hello World')).toBe('hello-world')
    expect(generateSlug('My Sermon Title')).toBe('my-sermon-title')
    expect(generateSlug('  leading and trailing  ')).toBe('leading-and-trailing')
  })
})

// ---------------------------------------------------------------------------
// Property 9 — validateVideoUrl: correctly classifies URLs
// Validates: Requirements 4.3
// ---------------------------------------------------------------------------

describe('Property 9 — validateVideoUrl: correctly classifies URLs', () => {
  // --- valid patterns ---

  it('returns "valid" for youtube.com/watch URLs', () => {
    const youtubeUrls = [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'http://youtube.com/watch?v=abc123',
      'https://youtube.com/watch?v=XYZ&t=30s',
    ]
    for (const url of youtubeUrls) {
      expect(validateVideoUrl(url)).toBe('valid')
    }
  })

  it('returns "valid" for youtu.be short URLs', () => {
    const shortUrls = [
      'https://youtu.be/dQw4w9WgXcQ',
      'http://youtu.be/abc123',
      'https://youtu.be/XYZ?t=30',
    ]
    for (const url of shortUrls) {
      expect(validateVideoUrl(url)).toBe('valid')
    }
  })

  it('returns "valid" for vimeo.com URLs', () => {
    const vimeoUrls = [
      'https://vimeo.com/123456789',
      'http://www.vimeo.com/channels/staffpicks/123',
      'https://vimeo.com/album/1234/video/5678',
    ]
    for (const url of vimeoUrls) {
      expect(validateVideoUrl(url)).toBe('valid')
    }
  })

  it('returns "valid" for direct .mp4 URLs', () => {
    const mp4Urls = [
      'https://example.com/video.mp4',
      'http://cdn.church.org/sermons/2024/message.mp4',
      'https://storage.example.com/file.mp4?token=abc',
    ]
    for (const url of mp4Urls) {
      expect(validateVideoUrl(url)).toBe('valid')
    }
  })

  it('returns "valid" for direct .webm URLs', () => {
    expect(validateVideoUrl('https://example.com/video.webm')).toBe('valid')
    expect(validateVideoUrl('https://example.com/video.webm?v=1')).toBe('valid')
  })

  it('returns "valid" for direct .ogg URLs', () => {
    expect(validateVideoUrl('https://example.com/video.ogg')).toBe('valid')
    expect(validateVideoUrl('https://example.com/video.ogg?v=1')).toBe('valid')
  })

  // --- fast-check: generated valid YouTube patterns ---

  it('Property 9: generated youtube.com/watch URLs are always valid (fast-check, 100 runs)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z0-9_-]+$/.test(s)),
        (videoId) => {
          const url = `https://www.youtube.com/watch?v=${videoId}`
          return validateVideoUrl(url) === 'valid'
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 9: generated youtu.be URLs are always valid (fast-check, 100 runs)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z0-9_-]+$/.test(s)),
        (videoId) => {
          const url = `https://youtu.be/${videoId}`
          return validateVideoUrl(url) === 'valid'
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 9: generated vimeo.com URLs are always valid (fast-check, 100 runs)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 999_999_999 }),
        (videoId) => {
          const url = `https://vimeo.com/${videoId}`
          return validateVideoUrl(url) === 'valid'
        }
      ),
      { numRuns: 100 }
    )
  })

  // --- invalid patterns ---

  it('returns "invalid" for plain HTTP pages', () => {
    const invalidUrls = [
      'http://example.com/page',
      'https://example.com',
      'https://example.com/about',
      'https://notavideo.com/file.pdf',
    ]
    for (const url of invalidUrls) {
      expect(validateVideoUrl(url)).toBe('invalid')
    }
  })

  it('returns "invalid" for empty string', () => {
    expect(validateVideoUrl('')).toBe('invalid')
  })

  it('Property 9: random strings without video patterns are always invalid (fast-check, 100 runs)', () => {
    // Generate strings that do NOT contain any of the valid patterns
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 0, maxLength: 100 })
          .filter(
            (s) =>
              !s.includes('youtube.com/watch') &&
              !s.includes('youtu.be/') &&
              !s.includes('vimeo.com/') &&
              !/\.(mp4|webm|ogg)(\?|$)/i.test(s)
          ),
        (input) => {
          return validateVideoUrl(input) === 'invalid'
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ---------------------------------------------------------------------------
// Property 10 — validateFileSize: enforces 50 MB boundary
// Validates: Requirements 7.4
// ---------------------------------------------------------------------------

const MAX_BYTES = 52_428_800 // 50 MB

describe('Property 10 — validateFileSize: enforces 50 MB boundary', () => {
  it('returns true for exactly 50 MB (52_428_800 bytes)', () => {
    expect(validateFileSize(MAX_BYTES)).toBe(true)
  })

  it('returns true for 0 bytes', () => {
    expect(validateFileSize(0)).toBe(true)
  })

  it('returns false for 50 MB + 1 byte', () => {
    expect(validateFileSize(MAX_BYTES + 1)).toBe(false)
  })

  it('Property 10: any value <= 52_428_800 returns true (fast-check, 100 runs)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: MAX_BYTES }),
        (bytes) => {
          return validateFileSize(bytes) === true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 10: any value > 52_428_800 returns false (fast-check, 100 runs)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: MAX_BYTES + 1, max: MAX_BYTES * 10 }),
        (bytes) => {
          return validateFileSize(bytes) === false
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 10: boundary is exactly at 52_428_800 — values on both sides (fast-check, 100 runs)', () => {
    fc.assert(
      fc.property(
        // Generate an offset in [-MAX_BYTES, MAX_BYTES] and add to boundary
        fc.integer({ min: -MAX_BYTES, max: MAX_BYTES }),
        (offset) => {
          const bytes = MAX_BYTES + offset
          if (bytes < 0) return true // skip negative (not a real file size)
          const expected = bytes <= MAX_BYTES
          return validateFileSize(bytes) === expected
        }
      ),
      { numRuns: 100 }
    )
  })
})
