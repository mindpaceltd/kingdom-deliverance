'use client'

import { useMemo } from 'react'
import { computeSeoScore, type SeoScoreInput, type SeoScoreResult } from '@/lib/seo-scorer'

/**
 * React hook that computes the live SEO score from post fields.
 *
 * Memoizes the result so it only recomputes when inputs change.
 * Since `computeSeoScore` is O(n) on content length, no debounce is needed.
 */
export function useSeoScore(params: SeoScoreInput): SeoScoreResult {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => computeSeoScore(params), [
    params.focusKeyword,
    params.seoTitle,
    params.metaDescription,
    params.content,
    params.slug,
    params.featuredImage,
  ])
}
