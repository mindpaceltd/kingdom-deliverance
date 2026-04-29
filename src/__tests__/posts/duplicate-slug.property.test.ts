/**
 * Property-based tests for duplicate slug generation.
 *
 * Feature: posts-content-system
 * Covers Property 7 from the design document.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { generateCopySlug } from '@/lib/posts-helpers'

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Generates a valid slug string (lowercase alphanumeric + hyphens) */
const slugArb = fc
  .string({ minLength: 1, maxLength: 50 })
  .map((s) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '') || 'post'
  )

/** Generates a set of existing slugs (may or may not include copy variants) */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const existingSlugsArb = (_sourceSlug: string) =>
  fc
    .array(slugArb, { maxLength: 20 })
    .map((slugs) => new Set([...slugs]))

// ---------------------------------------------------------------------------
// Property 7: Duplicate slug generation produces a unique, well-formed slug
// Feature: posts-content-system
// Validates: Requirements 8.6
// ---------------------------------------------------------------------------

describe('Property 7 — Duplicate slug generation produces a unique, well-formed slug', () => {
  it(
    'Property 7: generateCopySlug returns a slug not present in existingSlugs (fast-check, 100 runs)',
    () => {
      fc.assert(
        fc.property(
          slugArb,
          fc.array(slugArb, { maxLength: 10 }).map((s) => new Set(s)),
          (sourceSlug, existingSlugs) => {
            const result = generateCopySlug(sourceSlug, existingSlugs)
            if (result === null) return true // only null when all 99 variants taken
            return !existingSlugs.has(result)
          }
        ),
        { numRuns: 100 }
      )
    }
  )

  it(
    'Property 7: result starts with sourceSlug followed by -copy (fast-check, 100 runs)',
    () => {
      fc.assert(
        fc.property(
          slugArb,
          fc.array(slugArb, { maxLength: 5 }).map((s) => new Set(s)),
          (sourceSlug, existingSlugs) => {
            const result = generateCopySlug(sourceSlug, existingSlugs)
            if (result === null) return true
            return result.startsWith(`${sourceSlug}-copy`)
          }
        ),
        { numRuns: 100 }
      )
    }
  )

  it(
    'Property 7: first attempt is exactly sourceSlug + -copy when not taken (fast-check, 100 runs)',
    () => {
      fc.assert(
        fc.property(slugArb, (sourceSlug) => {
          // Empty set — no existing slugs
          const result = generateCopySlug(sourceSlug, new Set())
          return result === `${sourceSlug}-copy`
        }),
        { numRuns: 100 }
      )
    }
  )

  it('returns sourceSlug-copy when not taken', () => {
    const result = generateCopySlug('my-post', new Set())
    expect(result).toBe('my-post-copy')
  })

  it('returns sourceSlug-copy-2 when -copy is taken', () => {
    const result = generateCopySlug('my-post', new Set(['my-post-copy']))
    expect(result).toBe('my-post-copy-2')
  })

  it('returns sourceSlug-copy-3 when -copy and -copy-2 are taken', () => {
    const result = generateCopySlug(
      'my-post',
      new Set(['my-post-copy', 'my-post-copy-2'])
    )
    expect(result).toBe('my-post-copy-3')
  })

  it('returns null when all 99 variants are taken', () => {
    const taken = new Set<string>()
    taken.add('my-post-copy')
    for (let i = 2; i <= 99; i++) {
      taken.add(`my-post-copy-${i}`)
    }
    const result = generateCopySlug('my-post', taken)
    expect(result).toBeNull()
  })

  it('result is not in the existing slugs set', () => {
    const existing = new Set(['my-post-copy', 'my-post-copy-2', 'my-post-copy-3'])
    const result = generateCopySlug('my-post', existing)
    expect(result).toBe('my-post-copy-4')
    expect(existing.has(result!)).toBe(false)
  })
})
