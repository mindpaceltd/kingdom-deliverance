/**
 * Property-based tests for slug generation utilities.
 *
 * Feature: posts-content-system
 * Covers Properties 8 and 9 from the design document.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { generateSlug } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Property 8: Slug generation produces valid URL-safe slugs
// Feature: posts-content-system
// Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5
// ---------------------------------------------------------------------------

describe('Property 8 — Slug generation produces valid URL-safe slugs', () => {
  it(
    'Property 8a: slug contains only lowercase letters, digits, and hyphens (fast-check, 100 runs)',
    () => {
      fc.assert(
        fc.property(fc.string(), (title) => {
          const slug = generateSlug(title)
          return /^[a-z0-9-]*$/.test(slug)
        }),
        { numRuns: 100 }
      )
    }
  )

  it(
    'Property 8b: slug does not start or end with a hyphen (fast-check, 100 runs)',
    () => {
      fc.assert(
        fc.property(fc.string(), (title) => {
          const slug = generateSlug(title)
          return !slug.startsWith('-') && !slug.endsWith('-')
        }),
        { numRuns: 100 }
      )
    }
  )

  it(
    'Property 8c: slug contains no consecutive hyphens (fast-check, 100 runs)',
    () => {
      fc.assert(
        fc.property(fc.string(), (title) => {
          const slug = generateSlug(title)
          return !slug.includes('--')
        }),
        { numRuns: 100 }
      )
    }
  )

  it(
    'Property 8d: slug is empty only when input contains no alphanumeric characters (fast-check, 100 runs)',
    () => {
      fc.assert(
        fc.property(fc.string(), (title) => {
          const slug = generateSlug(title)
          const hasAlphanumeric = /[a-zA-Z0-9]/.test(title)
          if (slug === '') {
            // If slug is empty, input must have had no alphanumeric characters
            return !hasAlphanumeric
          } else {
            // If slug is non-empty, input must have had at least one alphanumeric character
            return hasAlphanumeric
          }
        }),
        { numRuns: 100 }
      )
    }
  )

  // Combined property: all constraints hold simultaneously
  it(
    'Property 8 (combined): all URL-safe slug constraints hold for any title (fast-check, 100 runs)',
    () => {
      fc.assert(
        fc.property(fc.string(), (title) => {
          const slug = generateSlug(title)
          const validChars = /^[a-z0-9-]*$/.test(slug)
          const noLeadingHyphen = !slug.startsWith('-')
          const noTrailingHyphen = !slug.endsWith('-')
          const noConsecutiveHyphens = !slug.includes('--')
          const hasAlphanumeric = /[a-zA-Z0-9]/.test(title)
          const emptyOnlyWhenNoAlphanumeric = slug === '' ? !hasAlphanumeric : hasAlphanumeric
          return (
            validChars &&
            noLeadingHyphen &&
            noTrailingHyphen &&
            noConsecutiveHyphens &&
            emptyOnlyWhenNoAlphanumeric
          )
        }),
        { numRuns: 100 }
      )
    }
  )

  // Example-based checks for known inputs
  it('converts spaces to hyphens', () => {
    expect(generateSlug('Hello World')).toBe('hello-world')
  })

  it('removes non-alphanumeric characters', () => {
    expect(generateSlug('Hello, World!')).toBe('hello-world')
  })

  it('collapses consecutive hyphens', () => {
    expect(generateSlug('Hello   World')).toBe('hello-world')
  })

  it('trims leading and trailing hyphens', () => {
    expect(generateSlug('  Hello World  ')).toBe('hello-world')
  })

  it('returns empty string for input with no alphanumeric characters', () => {
    expect(generateSlug('!@#$%^&*()')).toBe('')
  })

  it('returns empty string for empty input', () => {
    expect(generateSlug('')).toBe('')
  })

  it('lowercases the result', () => {
    expect(generateSlug('HELLO WORLD')).toBe('hello-world')
  })

  it('handles unicode characters by removing them', () => {
    const slug = generateSlug('Héllo Wörld')
    expect(/^[a-z0-9-]*$/.test(slug)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Property 9: Duplicate post title prefix is applied exactly once
// Feature: posts-content-system
// Validates: Requirements 8.6
// ---------------------------------------------------------------------------

/**
 * Replicates the duplicate post title logic from duplicatePost server action:
 *   title.startsWith('Copy of ') ? title : 'Copy of ' + title
 */
function applyDuplicatePrefix(title: string): string {
  return title.startsWith('Copy of ') ? title : `Copy of ${title}`
}

describe('Property 9 — Duplicate post title prefix is applied exactly once', () => {
  it(
    'Property 9a: result always starts with "Copy of " (fast-check, 100 runs)',
    () => {
      fc.assert(
        fc.property(fc.string(), (title) => {
          const result = applyDuplicatePrefix(title)
          return result.startsWith('Copy of ')
        }),
        { numRuns: 100 }
      )
    }
  )

  it(
    'Property 9b: "Copy of " prefix appears exactly once in the result (fast-check, 100 runs)',
    () => {
      fc.assert(
        fc.property(fc.string(), (title) => {
          const result = applyDuplicatePrefix(title)
          const firstIndex = result.indexOf('Copy of ')
          const lastIndex = result.lastIndexOf('Copy of ')
          return firstIndex === lastIndex
        }),
        { numRuns: 100 }
      )
    }
  )

  it(
    'Property 9c: if title already starts with "Copy of ", it remains unchanged (fast-check, 100 runs)',
    () => {
      fc.assert(
        fc.property(fc.string(), (suffix) => {
          const title = `Copy of ${suffix}`
          const result = applyDuplicatePrefix(title)
          return result === title
        }),
        { numRuns: 100 }
      )
    }
  )

  it(
    'Property 9d: if title does not start with "Copy of ", "Copy of " is prepended exactly once (fast-check, 100 runs)',
    () => {
      // Generate strings that do NOT start with 'Copy of '
      const nonCopyTitleArb = fc.string().filter((s) => !s.startsWith('Copy of '))
      fc.assert(
        fc.property(nonCopyTitleArb, (title) => {
          const result = applyDuplicatePrefix(title)
          return result === `Copy of ${title}`
        }),
        { numRuns: 100 }
      )
    }
  )

  // Example-based checks
  it('prepends "Copy of " to a plain title', () => {
    expect(applyDuplicatePrefix('My Post Title')).toBe('Copy of My Post Title')
  })

  it('does not double-prefix a title already starting with "Copy of "', () => {
    expect(applyDuplicatePrefix('Copy of My Post Title')).toBe('Copy of My Post Title')
  })

  it('handles empty string by prepending "Copy of "', () => {
    expect(applyDuplicatePrefix('')).toBe('Copy of ')
  })

  it('handles title that is exactly "Copy of " (no suffix)', () => {
    expect(applyDuplicatePrefix('Copy of ')).toBe('Copy of ')
  })

  it('does not modify a title that starts with "Copy of " followed by more text', () => {
    const title = 'Copy of Copy of Something'
    expect(applyDuplicatePrefix(title)).toBe(title)
  })
})
