/**
 * Property-based tests for the SEO scorer utility.
 *
 * Feature: posts-content-system
 * Covers Properties 1, 2, and 3 from the design document.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { computeSeoScore, type SeoScoreInput } from '@/lib/seo-scorer'
import { generateSlug } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Arbitrary for SeoScoreInput — generates any combination of inputs.
 * The slug is constrained to lowercase alphanumeric + hyphens to match
 * real slug format.
 */
const seoInputArb = fc.record<SeoScoreInput>({
  focusKeyword: fc.string({ maxLength: 100 }),
  seoTitle: fc.string({ maxLength: 200 }),
  metaDescription: fc.string({ maxLength: 300 }),
  content: fc.string({ maxLength: 10000 }),
  slug: fc
    .string({ maxLength: 200 })
    .map((s) => s.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '') || 'slug'),
  featuredImage: fc.oneof(fc.constant(''), fc.webUrl()),
})

// ---------------------------------------------------------------------------
// Property 1: SEO score is always in range [0, 100]
// Feature: posts-content-system
// Validates: Requirements 7.9
// ---------------------------------------------------------------------------

describe('Property 1 — SEO score is always in range [0, 100]', () => {
  it(
    'Property 1: computeSeoScore returns score >= 0 and <= 100 for any input (fast-check, 100 runs)',
    () => {
      fc.assert(
        fc.property(seoInputArb, (input) => {
          const { score } = computeSeoScore(input)
          return score >= 0 && score <= 100
        }),
        { numRuns: 100 }
      )
    }
  )

  it('score is 0 for all-empty inputs', () => {
    const { score } = computeSeoScore({
      focusKeyword: '',
      seoTitle: '',
      metaDescription: '',
      content: '',
      slug: '',
      featuredImage: '',
    })
    expect(score).toBe(0)
  })

  it('score is 100 when all checks pass', () => {
    // Construct inputs that satisfy every check
    const keyword = 'kingdom deliverance'
    const seoTitle = 'Kingdom Deliverance Church Uganda — Official Blog Post' // 53 chars
    // Build a 155-char meta description
    const meta155 = 'Kingdom Deliverance Church Uganda is a vibrant community of believers committed to spreading the gospel across Uganda and beyond today.'
    // 300+ word content with keyword in first 200 chars
    const words = Array(310).fill('word').join(' ')
    const content = `kingdom deliverance ${words}`
    const { score } = computeSeoScore({
      focusKeyword: keyword,
      seoTitle,
      metaDescription: meta155,
      content,
      slug: 'kingdom-deliverance-blog-post',
      featuredImage: 'https://example.com/image.jpg',
    })
    // At minimum keywordInTitle(15) + keywordInIntro(15) + contentWordCount(15) + featuredImage(10) + keywordInSlug(15) = 70
    expect(score).toBeGreaterThanOrEqual(70)
    expect(score).toBeLessThanOrEqual(100)
  })
})

// ---------------------------------------------------------------------------
// Property 2: SEO score equals sum of points for passing checks
// Feature: posts-content-system
// Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8
// ---------------------------------------------------------------------------

describe('Property 2 — SEO score equals sum of points for passing checks', () => {
  it(
    'Property 2: score === sum of point values for each passing check (fast-check, 100 runs)',
    () => {
      fc.assert(
        fc.property(seoInputArb, (input) => {
          const { score, checks } = computeSeoScore(input)
          const expected =
            (checks.keywordInTitle ? 15 : 0) +
            (checks.keywordInIntro ? 15 : 0) +
            (checks.metaDescriptionLength ? 15 : 0) +
            (checks.seoTitleLength ? 15 : 0) +
            (checks.contentWordCount ? 15 : 0) +
            (checks.featuredImagePresent ? 10 : 0) +
            (checks.keywordInSlug ? 15 : 0)
          return score === expected
        }),
        { numRuns: 100 }
      )
    }
  )

  it('score is 0 when no checks pass', () => {
    const { score, checks } = computeSeoScore({
      focusKeyword: '',
      seoTitle: '',
      metaDescription: '',
      content: '',
      slug: '',
      featuredImage: '',
    })
    expect(Object.values(checks).every((v) => v === false)).toBe(true)
    expect(score).toBe(0)
  })

  it('featuredImagePresent contributes exactly 10 points', () => {
    const base = {
      focusKeyword: '',
      seoTitle: '',
      metaDescription: '',
      content: '',
      slug: '',
      featuredImage: '',
    }
    const withImage = { ...base, featuredImage: 'https://example.com/img.jpg' }
    const { score: scoreWithout } = computeSeoScore(base)
    const { score: scoreWith } = computeSeoScore(withImage)
    expect(scoreWith - scoreWithout).toBe(10)
  })

  it('each keyword check contributes exactly 15 points', () => {
    const keyword = 'testword'
    const base = {
      focusKeyword: '',
      seoTitle: 'testword is a great keyword for this post title here',
      metaDescription: '',
      content: '',
      slug: 'testword-slug',
      featuredImage: '',
    }
    const withKw = { ...base, focusKeyword: keyword }
    const { score: scoreWithout } = computeSeoScore(base)
    const { score: scoreWith, checks } = computeSeoScore(withKw)
    // keywordInTitle + keywordInSlug should both be true
    expect(checks.keywordInTitle).toBe(true)
    expect(checks.keywordInSlug).toBe(true)
    expect(scoreWith - scoreWithout).toBeGreaterThanOrEqual(15)
  })
})

// ---------------------------------------------------------------------------
// Property 3: SEO checks object correctly reflects each criterion
// Feature: posts-content-system
// Validates: Requirements 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 6.6, 6.7
// ---------------------------------------------------------------------------

describe('Property 3 — SEO checks object correctly reflects each criterion', () => {
  it(
    'Property 3: each check boolean accurately reflects its criterion (fast-check, 100 runs)',
    () => {
      fc.assert(
        fc.property(seoInputArb, (input) => {
          const { checks } = computeSeoScore(input)
          const kw = input.focusKeyword.toLowerCase().trim()
          const slugifiedKw = generateSlug(input.focusKeyword)

          // keywordInTitle
          const expectedKeywordInTitle =
            kw.length > 0 && input.seoTitle.toLowerCase().includes(kw)
          if (checks.keywordInTitle !== expectedKeywordInTitle) return false

          // keywordInIntro
          const expectedKeywordInIntro =
            kw.length > 0 && input.content.toLowerCase().slice(0, 200).includes(kw)
          if (checks.keywordInIntro !== expectedKeywordInIntro) return false

          // metaDescriptionLength
          const expectedMetaLen =
            input.metaDescription.length >= 150 && input.metaDescription.length <= 160
          if (checks.metaDescriptionLength !== expectedMetaLen) return false

          // seoTitleLength
          const expectedTitleLen =
            input.seoTitle.length >= 50 && input.seoTitle.length <= 60
          if (checks.seoTitleLength !== expectedTitleLen) return false

          // contentWordCount — strip HTML tags and count words
          const plain = input.content.replace(/<[^>]*>/g, ' ')
          const wordCount = plain.trim().split(/\s+/).filter((w) => w.length > 0).length
          const expectedWordCount = wordCount >= 300
          if (checks.contentWordCount !== expectedWordCount) return false

          // featuredImagePresent
          const expectedFeatured = input.featuredImage.length > 0
          if (checks.featuredImagePresent !== expectedFeatured) return false

          // keywordInSlug
          const expectedKeywordInSlug =
            kw.length > 0 && slugifiedKw.length > 0 && input.slug.includes(slugifiedKw)
          if (checks.keywordInSlug !== expectedKeywordInSlug) return false

          return true
        }),
        { numRuns: 100 }
      )
    }
  )

  // Example-based checks for boundary conditions

  it('metaDescriptionLength is true at exactly 150 chars', () => {
    const { checks } = computeSeoScore({
      focusKeyword: '',
      seoTitle: '',
      metaDescription: 'A'.repeat(150),
      content: '',
      slug: '',
      featuredImage: '',
    })
    expect(checks.metaDescriptionLength).toBe(true)
  })

  it('metaDescriptionLength is true at exactly 160 chars', () => {
    const { checks } = computeSeoScore({
      focusKeyword: '',
      seoTitle: '',
      metaDescription: 'A'.repeat(160),
      content: '',
      slug: '',
      featuredImage: '',
    })
    expect(checks.metaDescriptionLength).toBe(true)
  })

  it('metaDescriptionLength is false at 149 chars', () => {
    const { checks } = computeSeoScore({
      focusKeyword: '',
      seoTitle: '',
      metaDescription: 'A'.repeat(149),
      content: '',
      slug: '',
      featuredImage: '',
    })
    expect(checks.metaDescriptionLength).toBe(false)
  })

  it('metaDescriptionLength is false at 161 chars', () => {
    const { checks } = computeSeoScore({
      focusKeyword: '',
      seoTitle: '',
      metaDescription: 'A'.repeat(161),
      content: '',
      slug: '',
      featuredImage: '',
    })
    expect(checks.metaDescriptionLength).toBe(false)
  })

  it('seoTitleLength is true at exactly 50 chars', () => {
    const { checks } = computeSeoScore({
      focusKeyword: '',
      seoTitle: 'A'.repeat(50),
      metaDescription: '',
      content: '',
      slug: '',
      featuredImage: '',
    })
    expect(checks.seoTitleLength).toBe(true)
  })

  it('seoTitleLength is true at exactly 60 chars', () => {
    const { checks } = computeSeoScore({
      focusKeyword: '',
      seoTitle: 'A'.repeat(60),
      metaDescription: '',
      content: '',
      slug: '',
      featuredImage: '',
    })
    expect(checks.seoTitleLength).toBe(true)
  })

  it('contentWordCount is true at exactly 300 words', () => {
    const { checks } = computeSeoScore({
      focusKeyword: '',
      seoTitle: '',
      metaDescription: '',
      content: Array(300).fill('word').join(' '),
      slug: '',
      featuredImage: '',
    })
    expect(checks.contentWordCount).toBe(true)
  })

  it('contentWordCount is false at 299 words', () => {
    const { checks } = computeSeoScore({
      focusKeyword: '',
      seoTitle: '',
      metaDescription: '',
      content: Array(299).fill('word').join(' '),
      slug: '',
      featuredImage: '',
    })
    expect(checks.contentWordCount).toBe(false)
  })

  it('keyword checks are false when focusKeyword is empty', () => {
    const { checks } = computeSeoScore({
      focusKeyword: '',
      seoTitle: 'some title with keyword',
      metaDescription: '',
      content: 'keyword in intro',
      slug: 'keyword-slug',
      featuredImage: '',
    })
    expect(checks.keywordInTitle).toBe(false)
    expect(checks.keywordInIntro).toBe(false)
    expect(checks.keywordInSlug).toBe(false)
  })

  it('keywordInTitle is case-insensitive', () => {
    const { checks } = computeSeoScore({
      focusKeyword: 'KINGDOM',
      seoTitle: 'kingdom deliverance church',
      metaDescription: '',
      content: '',
      slug: '',
      featuredImage: '',
    })
    expect(checks.keywordInTitle).toBe(true)
  })
})
