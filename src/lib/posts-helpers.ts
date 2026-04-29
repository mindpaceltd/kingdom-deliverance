/**
 * Pure helper functions for the posts CMS UI.
 *
 * All functions are side-effect-free and easily testable.
 */

import type { Post } from '@/lib/types'

// ---------------------------------------------------------------------------
// Status badge variant
// ---------------------------------------------------------------------------

export type StatusBadgeVariant = 'yellow' | 'green' | 'blue' | 'red' | 'gray'

/**
 * Returns the color variant for a post status badge.
 *
 * - draft     → yellow
 * - published → green
 * - scheduled → blue
 * - trash     → red
 * - archived  → gray (fallback)
 */
export function getStatusBadgeVariant(status: Post['status']): StatusBadgeVariant {
  switch (status) {
    case 'draft':
      return 'yellow'
    case 'published':
      return 'green'
    case 'scheduled':
      return 'blue'
    case 'trash':
      return 'red'
    default:
      return 'gray'
  }
}

// ---------------------------------------------------------------------------
// SEO score color
// ---------------------------------------------------------------------------

export type SeoScoreColor = 'red' | 'yellow' | 'green'

/**
 * Returns the color indicator for a numeric SEO score.
 *
 * - [0, 50]   → red
 * - [51, 79]  → yellow
 * - [80, 100] → green
 */
export function getSeoScoreColor(score: number): SeoScoreColor {
  if (score <= 50) return 'red'
  if (score <= 79) return 'yellow'
  return 'green'
}

// ---------------------------------------------------------------------------
// Status filter
// ---------------------------------------------------------------------------

export type PostStatusFilter = 'all' | Post['status']

/**
 * Filters an array of posts by status.
 *
 * When filter is 'all', returns all posts.
 * Otherwise returns only posts whose status matches the filter.
 */
export function filterPostsByStatus(
  posts: Post[],
  filter: PostStatusFilter
): Post[] {
  if (filter === 'all') return posts
  return posts.filter((p) => p.status === filter)
}

// ---------------------------------------------------------------------------
// Duplicate slug generation
// ---------------------------------------------------------------------------

/**
 * Generates a unique slug for a duplicated post.
 *
 * Strategy:
 *   1. Try `{sourceSlug}-copy`
 *   2. If taken, try `{sourceSlug}-copy-2`, `-copy-3`, etc.
 *
 * Returns the first candidate not present in `existingSlugs`.
 * Returns null if all 99 variants are taken (extremely unlikely).
 */
export function generateCopySlug(
  sourceSlug: string,
  existingSlugs: Set<string>
): string | null {
  const candidate = `${sourceSlug}-copy`
  if (!existingSlugs.has(candidate)) return candidate

  for (let i = 2; i <= 99; i++) {
    const numbered = `${sourceSlug}-copy-${i}`
    if (!existingSlugs.has(numbered)) return numbered
  }

  return null
}
