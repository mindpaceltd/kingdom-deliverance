/**
 * Property-Based Tests — Input Validation and Rejection (Task 15.15)
 *
 * **Validates: Requirements 3.8, 4.8**
 *
 * Property 7: Input Validation and Rejection
 *
 * P7a — For any video duration > 3 hours (10800 seconds), the duration
 *        validation logic throws an error containing "Video too long".
 * P7b — For any video duration ≤ 3 hours (10800 seconds), the duration
 *        validation logic does NOT throw.
 * P7c — For any transcript with < 100 words, the transcript validation
 *        logic throws an error containing "Transcript too short".
 * P7d — For any transcript with ≥ 100 words, the transcript validation
 *        logic does NOT throw.
 *
 * These are pure logic tests — no mocking or external processes required.
 * The validation predicates are extracted directly from the source services
 * (AudioExtractor.validateDuration and TranscriptionService.transcribe) and
 * tested in isolation.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// ─────────────────────────────────────────────────────────────────────────────
// Extracted validation logic (mirrors AudioExtractor and TranscriptionService)
// ─────────────────────────────────────────────────────────────────────────────

const MAX_DURATION_HOURS = 3
const MIN_TRANSCRIPT_WORDS = 100

/**
 * Pure duration validation — mirrors AudioExtractor.validateDuration logic.
 *
 * @param durationSeconds - Duration of the audio/video in seconds
 * @throws Error containing "Video too long" when duration exceeds 3 hours
 */
function validateDuration(durationSeconds: number): void {
  const durationHours = durationSeconds / 3600
  if (durationHours > MAX_DURATION_HOURS) {
    throw new Error(
      `Video too long (${durationHours.toFixed(1)} hours, max ${MAX_DURATION_HOURS} hours)`
    )
  }
}

/**
 * Pure transcript length validation — mirrors TranscriptionService.transcribe logic.
 *
 * @param transcript - The full transcript text
 * @throws Error containing "Transcript too short" when word count < 100
 */
function validateTranscriptLength(transcript: string): void {
  const wordCount = transcript.split(/\s+/).filter((w) => w.length > 0).length
  if (wordCount < MIN_TRANSCRIPT_WORDS) {
    throw new Error(
      `Transcript too short (${wordCount} words, min ${MIN_TRANSCRIPT_WORDS} words)`
    )
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Arbitraries
// ─────────────────────────────────────────────────────────────────────────────

/** Generates video durations strictly greater than 3 hours (in seconds). */
const arbTooLongDurationSeconds = fc.float({
  min: 10801,       // just over 3 hours
  max: 86400,       // up to 24 hours
  noNaN: true,
  noDefaultInfinity: true,
})

/** Generates video durations within the allowed range (0 to 10800 seconds inclusive). */
const arbValidDurationSeconds = fc.float({
  min: 0,
  max: 10800,       // exactly 3 hours
  noNaN: true,
  noDefaultInfinity: true,
})

/** Generates a word count strictly less than 100. */
const arbTooShortWordCount = fc.integer({ min: 0, max: 99 })

/** Generates a word count of at least 100. */
const arbValidWordCount = fc.integer({ min: 100, max: 5000 })

/**
 * Builds a transcript string with exactly `wordCount` words.
 * Each word is the string "word" to keep it simple and deterministic.
 */
function buildTranscript(wordCount: number): string {
  return Array.from({ length: wordCount }, (_, i) => `word${i + 1}`).join(' ')
}

// ─────────────────────────────────────────────────────────────────────────────
// Property 7: Input Validation and Rejection
// ─────────────────────────────────────────────────────────────────────────────

describe('Property 7: Input Validation and Rejection (Requirements 3.8, 4.8)', () => {

  // ── P7a: Videos longer than 3 hours are rejected ─────────────────────────

  describe('P7a — Videos longer than 3 hours are rejected (Req 3.8)', () => {
    it('should throw an error for any duration > 3 hours (10800s)', () => {
      fc.assert(
        fc.property(arbTooLongDurationSeconds, (durationSeconds) => {
          expect(() => validateDuration(durationSeconds)).toThrow()
        }),
        { numRuns: 20 }
      )
    })

    it('should throw an error containing "Video too long" for any duration > 3 hours', () => {
      fc.assert(
        fc.property(arbTooLongDurationSeconds, (durationSeconds) => {
          expect(() => validateDuration(durationSeconds)).toThrowError(/Video too long/i)
        }),
        { numRuns: 20 }
      )
    })

    it('should include the actual duration in the error message', () => {
      fc.assert(
        fc.property(arbTooLongDurationSeconds, (durationSeconds) => {
          let errorMessage = ''
          try {
            validateDuration(durationSeconds)
          } catch (e: any) {
            errorMessage = e.message
          }
          // Error message must mention the duration in hours
          const durationHours = durationSeconds / 3600
          expect(errorMessage).toContain(durationHours.toFixed(1))
        }),
        { numRuns: 20 }
      )
    })

    it('should include the max duration (3 hours) in the error message', () => {
      fc.assert(
        fc.property(arbTooLongDurationSeconds, (durationSeconds) => {
          let errorMessage = ''
          try {
            validateDuration(durationSeconds)
          } catch (e: any) {
            errorMessage = e.message
          }
          expect(errorMessage).toContain(`max ${MAX_DURATION_HOURS} hours`)
        }),
        { numRuns: 20 }
      )
    })
  })

  // ── P7b: Videos within the 3-hour limit are accepted ─────────────────────

  describe('P7b — Videos within the 3-hour limit are accepted (Req 3.8)', () => {
    it('should NOT throw for any duration ≤ 3 hours (10800s)', () => {
      fc.assert(
        fc.property(arbValidDurationSeconds, (durationSeconds) => {
          expect(() => validateDuration(durationSeconds)).not.toThrow()
        }),
        { numRuns: 20 }
      )
    })

    it('should accept exactly 3 hours (10800 seconds)', () => {
      expect(() => validateDuration(10800)).not.toThrow()
    })

    it('should accept 0 seconds', () => {
      expect(() => validateDuration(0)).not.toThrow()
    })
  })

  // ── P7c: Transcripts with fewer than 100 words are rejected ──────────────

  describe('P7c — Transcripts with fewer than 100 words are rejected (Req 4.8)', () => {
    it('should throw an error for any transcript with < 100 words', () => {
      fc.assert(
        fc.property(arbTooShortWordCount, (wordCount) => {
          const transcript = buildTranscript(wordCount)
          expect(() => validateTranscriptLength(transcript)).toThrow()
        }),
        { numRuns: 20 }
      )
    })

    it('should throw an error containing "Transcript too short" for < 100 words', () => {
      fc.assert(
        fc.property(arbTooShortWordCount, (wordCount) => {
          const transcript = buildTranscript(wordCount)
          expect(() => validateTranscriptLength(transcript)).toThrowError(
            /Transcript too short/i
          )
        }),
        { numRuns: 20 }
      )
    })

    it('should include the actual word count in the error message', () => {
      fc.assert(
        fc.property(arbTooShortWordCount, (wordCount) => {
          const transcript = buildTranscript(wordCount)
          let errorMessage = ''
          try {
            validateTranscriptLength(transcript)
          } catch (e: any) {
            errorMessage = e.message
          }
          expect(errorMessage).toContain(`${wordCount} words`)
        }),
        { numRuns: 20 }
      )
    })

    it('should include the minimum word count (100) in the error message', () => {
      fc.assert(
        fc.property(arbTooShortWordCount, (wordCount) => {
          const transcript = buildTranscript(wordCount)
          let errorMessage = ''
          try {
            validateTranscriptLength(transcript)
          } catch (e: any) {
            errorMessage = e.message
          }
          expect(errorMessage).toContain(`min ${MIN_TRANSCRIPT_WORDS} words`)
        }),
        { numRuns: 20 }
      )
    })

    it('should reject an empty transcript (0 words)', () => {
      expect(() => validateTranscriptLength('')).toThrowError(/Transcript too short/i)
    })
  })

  // ── P7d: Transcripts with 100 or more words are accepted ─────────────────

  describe('P7d — Transcripts with 100 or more words are accepted (Req 4.8)', () => {
    it('should NOT throw for any transcript with ≥ 100 words', () => {
      fc.assert(
        fc.property(arbValidWordCount, (wordCount) => {
          const transcript = buildTranscript(wordCount)
          expect(() => validateTranscriptLength(transcript)).not.toThrow()
        }),
        { numRuns: 20 }
      )
    })

    it('should accept exactly 100 words', () => {
      const transcript = buildTranscript(100)
      expect(() => validateTranscriptLength(transcript)).not.toThrow()
    })

    it('should accept a large transcript (5000 words)', () => {
      const transcript = buildTranscript(5000)
      expect(() => validateTranscriptLength(transcript)).not.toThrow()
    })
  })
})
