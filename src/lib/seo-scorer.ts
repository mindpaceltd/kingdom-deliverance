/**
 * SEO Scorer — pure TypeScript utility with no side effects.
 *
 * Computes a 0–100 SEO score from post fields and returns a detailed
 * checks object so the UI can render a per-criterion checklist.
 *
 * Point values:
 *   keywordInTitle        15 pts
 *   keywordInIntro        15 pts
 *   metaDescriptionLength 15 pts
 *   seoTitleLength        15 pts
 *   contentWordCount      15 pts
 *   keywordInSlug         15 pts
 *   featuredImagePresent  10 pts
 *   ─────────────────────────────
 *   Maximum               100 pts
 */

import { generateSlug } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SeoScoreInput {
  focusKeyword: string
  seoTitle: string
  metaDescription: string
  content: string
  slug: string
  featuredImage: string
}

export interface SeoChecks {
  /** Focus keyword appears in the SEO title (case-insensitive) */
  keywordInTitle: boolean
  /** Focus keyword appears in the first 200 chars of content (case-insensitive) */
  keywordInIntro: boolean
  /** Meta description length is between 150 and 160 characters inclusive */
  metaDescriptionLength: boolean
  /** SEO title length is between 50 and 60 characters inclusive */
  seoTitleLength: boolean
  /** Post content word count is at least 300 words */
  contentWordCount: boolean
  /** Featured image URL is non-empty */
  featuredImagePresent: boolean
  /** Focus keyword (slugified) appears in the post slug */
  keywordInSlug: boolean
}

export interface SeoScoreResult {
  /** Aggregate score in the range [0, 100] */
  score: number
  /** Per-criterion pass/fail flags */
  checks: SeoChecks
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Count words in an HTML or plain-text string. */
function countWords(text: string): number {
  // Strip HTML tags first
  const plain = text.replace(/<[^>]*>/g, ' ')
  const words = plain.trim().split(/\s+/).filter((w) => w.length > 0)
  return words.length
}

// ---------------------------------------------------------------------------
// computeSeoScore
// ---------------------------------------------------------------------------

/**
 * Computes the SEO score for a post given the provided inputs.
 *
 * This function is pure: it has no side effects and always returns the same
 * result for the same inputs.
 */
export function computeSeoScore(input: SeoScoreInput): SeoScoreResult {
  const { focusKeyword, seoTitle, metaDescription, content, slug, featuredImage } = input

  const kw = focusKeyword.toLowerCase().trim()
  const titleLower = seoTitle.toLowerCase()
  const intro = content.toLowerCase().slice(0, 200)
  const slugifiedKw = generateSlug(focusKeyword)

  const checks: SeoChecks = {
    keywordInTitle:
      kw.length > 0 && titleLower.includes(kw),

    keywordInIntro:
      kw.length > 0 && intro.includes(kw),

    metaDescriptionLength:
      metaDescription.length >= 150 && metaDescription.length <= 160,

    seoTitleLength:
      seoTitle.length >= 50 && seoTitle.length <= 60,

    contentWordCount:
      countWords(content) >= 300,

    featuredImagePresent:
      featuredImage.length > 0,

    keywordInSlug:
      kw.length > 0 && slugifiedKw.length > 0 && slug.includes(slugifiedKw),
  }

  const score =
    (checks.keywordInTitle ? 15 : 0) +
    (checks.keywordInIntro ? 15 : 0) +
    (checks.metaDescriptionLength ? 15 : 0) +
    (checks.seoTitleLength ? 15 : 0) +
    (checks.contentWordCount ? 15 : 0) +
    (checks.featuredImagePresent ? 10 : 0) +
    (checks.keywordInSlug ? 15 : 0)

  return { score, checks }
}
