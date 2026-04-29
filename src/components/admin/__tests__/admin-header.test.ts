// Feature: kdcuganda-cms-platform, Property 3
// Property 3: User header renders correct initials fallback
// Validates: Requirements 1.6

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { getInitials } from '../initials'

// ---------------------------------------------------------------------------
// Property 3 — getInitials: correct initials fallback
// Validates: Requirements 1.6
// ---------------------------------------------------------------------------

describe('Property 3 — getInitials: correct initials fallback', () => {
  // --- Unit tests for specific examples ---

  it('returns "JD" for "John Doe"', () => {
    expect(getInitials('John Doe')).toBe('JD')
  })

  it('returns "J" for single name "John"', () => {
    expect(getInitials('John')).toBe('J')
  })

  it('returns first and last initials for multi-word names', () => {
    expect(getInitials('John Michael Doe')).toBe('JD')
    expect(getInitials('Alice Bob Carol')).toBe('AC')
  })

  it('returns "?" for null input', () => {
    expect(getInitials(null)).toBe('?')
  })

  it('returns "?" for empty string', () => {
    expect(getInitials('')).toBe('?')
  })

  it('returns "?" for whitespace-only string', () => {
    expect(getInitials('   ')).toBe('?')
  })

  it('returns uppercase initials', () => {
    expect(getInitials('john doe')).toBe('JD')
    expect(getInitials('alice')).toBe('A')
  })

  // --- Property-based tests ---

  it('Property 3: initials are always uppercase for any non-empty name (fast-check, 100 runs)', () => {
    fc.assert(
      fc.property(
        // Generate names with at least one non-whitespace character
        fc
          .string({ minLength: 1, maxLength: 100 })
          .filter((s) => s.trim().length > 0 && /[a-zA-Z]/.test(s)),
        (name) => {
          const initials = getInitials(name)
          // Initials should be uppercase (or '?')
          return initials === initials.toUpperCase()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 3: initials are never empty for non-empty input (fast-check, 100 runs)', () => {
    fc.assert(
      fc.property(
        // Any non-empty string (including whitespace-only — those return '?')
        fc.string({ minLength: 1, maxLength: 100 }),
        (name) => {
          const initials = getInitials(name)
          return initials.length > 0
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 3: single-word names produce exactly one character (fast-check, 100 runs)', () => {
    fc.assert(
      fc.property(
        // Generate a single word (no spaces, at least one letter)
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => /^[a-zA-Z]+$/.test(s)),
        (word) => {
          const initials = getInitials(word)
          return initials.length === 1
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 3: two-word names produce exactly two characters (fast-check, 100 runs)', () => {
    fc.assert(
      fc.property(
        // Generate two words separated by a single space
        fc
          .tuple(
            fc.string({ minLength: 1, maxLength: 30 }).filter((s) => /^[a-zA-Z]+$/.test(s)),
            fc.string({ minLength: 1, maxLength: 30 }).filter((s) => /^[a-zA-Z]+$/.test(s))
          )
          .map(([first, last]) => `${first} ${last}`),
        (fullName) => {
          const initials = getInitials(fullName)
          return initials.length === 2
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 3: initials match first letter of first and last word (fast-check, 100 runs)', () => {
    fc.assert(
      fc.property(
        // Generate two words separated by a single space
        fc
          .tuple(
            fc.string({ minLength: 1, maxLength: 30 }).filter((s) => /^[a-zA-Z]+$/.test(s)),
            fc.string({ minLength: 1, maxLength: 30 }).filter((s) => /^[a-zA-Z]+$/.test(s))
          )
          .map(([first, last]) => `${first} ${last}`),
        (fullName) => {
          const words = fullName.trim().split(/\s+/)
          const expectedFirst = words[0][0].toUpperCase()
          const expectedLast = words[words.length - 1][0].toUpperCase()
          const initials = getInitials(fullName)
          return initials === expectedFirst + expectedLast
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 3: null input always returns "?" (fast-check, 100 runs)', () => {
    // null is a fixed input — verify the fallback is always '?'
    expect(getInitials(null)).toBe('?')
  })
})
