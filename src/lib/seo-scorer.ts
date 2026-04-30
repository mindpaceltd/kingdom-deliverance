export interface SeoScoreInput {
  focusKeyword: string
  seoTitle: string
  metaDescription: string
  content: string
  slug: string
  featuredImage: string
}

export interface SeoChecks {
  keywordInTitle: boolean
  keywordInIntro: boolean       // first 200 chars of content
  metaDescriptionLength: boolean
  seoTitleLength: boolean
  contentWordCount: boolean
  featuredImagePresent: boolean
  keywordInSlug: boolean
}

export interface SeoScoreResult {
  score: number   // 0–100
  checks: SeoChecks
}

/**
 * Converts a string to a URL-safe slug.
 * Mirrors the generateSlug logic in src/lib/utils.ts.
 */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Pure function that computes an SEO score (0–100) and a checks object
 * from the provided post fields. No side effects.
 */
export function computeSeoScore(input: SeoScoreInput): SeoScoreResult {
  const { focusKeyword, seoTitle, metaDescription, content, slug, featuredImage } = input

  const keywordNonEmpty = focusKeyword.length > 0
  const keywordLower = focusKeyword.toLowerCase()

  const keywordInTitle =
    keywordNonEmpty && seoTitle.toLowerCase().includes(keywordLower)

  const keywordInIntro =
    keywordNonEmpty && content.toLowerCase().slice(0, 200).includes(keywordLower)

  const metaDescriptionLength =
    metaDescription.length >= 150 && metaDescription.length <= 160

  const seoTitleLength =
    seoTitle.length >= 50 && seoTitle.length <= 60

  const wordCount = content.trim() === '' ? 0 : content.trim().split(/\s+/).length
  const contentWordCount = wordCount >= 300

  const featuredImagePresent = featuredImage.length > 0

  const slugifiedKeyword = slugify(focusKeyword)
  const keywordInSlug =
    keywordNonEmpty && slugifiedKeyword.length > 0 && slug.includes(slugifiedKeyword)

  const checks: SeoChecks = {
    keywordInTitle,
    keywordInIntro,
    metaDescriptionLength,
    seoTitleLength,
    contentWordCount,
    featuredImagePresent,
    keywordInSlug,
  }

  const score =
    (keywordInTitle ? 15 : 0) +
    (keywordInIntro ? 15 : 0) +
    (metaDescriptionLength ? 15 : 0) +
    (seoTitleLength ? 15 : 0) +
    (contentWordCount ? 15 : 0) +
    (featuredImagePresent ? 10 : 0) +
    (keywordInSlug ? 15 : 0)

  return { score, checks }
}
