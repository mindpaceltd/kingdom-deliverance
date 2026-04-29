// Feature: kdcuganda-cms-platform, Property 8
// Property 8: Draft posts are invisible to public queries
// Validates: Requirements 3.8

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'

// ---------------------------------------------------------------------------
// Mock @/lib/env so it doesn't throw on missing env vars in test environment
// ---------------------------------------------------------------------------
vi.mock('@/lib/env', () => ({
  env: {
    supabaseUrl: 'http://localhost:54321',
    supabaseAnonKey: 'test-anon-key',
    supabaseServiceRoleKey: 'test-service-role-key',
  },
}))

// ---------------------------------------------------------------------------
// Mock @/lib/supabase/server
//
// Strategy for Property 8:
//
// The DAL functions (getPosts, getPostBySlug) must apply .eq('status', 'published').
// We verify this by:
//   1. Tracking the status filter applied via .eq('status', value)
//   2. Simulating a DB that returns a post ONLY when the filter matches the
//      post's actual status — i.e., the mock enforces the filter semantics.
//
// If the DAL applies .eq('status', 'published') and the mock post has
// status='draft', the filter won't match → mock returns null/[].
// If the DAL applies .eq('status', 'published') and the mock post has
// status='published', the filter matches → mock returns the post.
//
// This correctly models RLS/DB behaviour: the filter is applied server-side
// and only matching rows are returned.
// ---------------------------------------------------------------------------

/** The status filter value captured from the last .eq('status', ...) call */
let capturedStatusFilter: string | null = null

/** The post the mock DB "has" — returned only when the status filter matches */
let mockPost: Record<string, unknown> | null = null

/**
 * Build a chainable Supabase query builder.
 * - Intercepts .eq('status', value) to capture the filter
 * - On resolution, returns the mockPost only if capturedStatusFilter matches
 *   mockPost.status (simulating DB-side filtering)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function makeMockBuilder(useSingle: boolean) {
  // We need a local copy of the filter state per builder instance so that
  // the closure captures the right value at resolution time.
  let localStatusFilter: string | null = null

  const builder: Record<string, unknown> = {}

  const chainable = [
    'select', 'neq', 'gt', 'gte', 'lt', 'lte',
    'order', 'limit', 'range', 'maybeSingle',
    'or', 'in', 'filter', 'ilike',
  ]
  for (const method of chainable) {
    builder[method] = () => builder
  }

  // single() is a terminal method — mark it but keep chaining
  builder.single = () => {
    return builder
  }

  // Intercept .eq() to capture the status filter
  builder.eq = (column: string, value: string) => {
    if (column === 'status') {
      localStatusFilter = value
      capturedStatusFilter = value // also update module-level for assertions
    }
    return builder
  }

  // Resolve: return mockPost only when the status filter matches the post's status
  builder.then = (resolve: (v: unknown) => unknown) => {
    const filterMatchesPost =
      mockPost !== null && localStatusFilter === (mockPost.status as string)

    let result: { data: unknown; error: null }
    if (useSingle) {
      result = { data: filterMatchesPost ? mockPost : null, error: null }
    } else {
      result = { data: filterMatchesPost ? [mockPost] : [], error: null }
    }
    return Promise.resolve(result).then(resolve)
  }
  builder.catch = (reject: (v: unknown) => unknown) =>
    Promise.resolve({ data: null, error: null }).catch(reject)

  return builder
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    from: (_table: string) => {
      // We can't know ahead of time whether .single() will be called,
      // so we use a proxy that detects it and adjusts resolution accordingly.
      let singleCalled = false
      let localStatusFilter: string | null = null

      const builder: Record<string, unknown> = {}

      const chainable = [
        'select', 'neq', 'gt', 'gte', 'lt', 'lte',
        'order', 'limit', 'range', 'maybeSingle',
        'or', 'in', 'filter', 'ilike',
      ]
      for (const method of chainable) {
        builder[method] = () => builder
      }

      builder.single = () => {
        singleCalled = true
        return builder
      }

      builder.eq = (column: string, value: string) => {
        if (column === 'status') {
          localStatusFilter = value
          capturedStatusFilter = value
        }
        return builder
      }

      builder.then = (resolve: (v: unknown) => unknown) => {
        // The mock simulates DB-side filtering:
        // only return the post if the status filter matches the post's actual status
        const filterMatchesPost =
          mockPost !== null && localStatusFilter === (mockPost.status as string)

        let result: { data: unknown; error: null }
        if (singleCalled) {
          result = { data: filterMatchesPost ? mockPost : null, error: null }
        } else {
          result = { data: filterMatchesPost ? [mockPost] : [], error: null }
        }
        return Promise.resolve(result).then(resolve)
      }
      builder.catch = (reject: (v: unknown) => unknown) =>
        Promise.resolve({ data: null, error: null }).catch(reject)

      return builder
    },
  }),
}))

// ---------------------------------------------------------------------------
// Import DAL functions AFTER mocks are set up
// ---------------------------------------------------------------------------
import { getPosts, getPostBySlug } from '../supabase/queries'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate a valid URL-safe slug */
const slugArb = fc
  .string({ minLength: 1, maxLength: 80 })
  .map((s) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'fallback-slug'
  )

/** Generate a non-published post status */
const nonPublishedStatus = fc.oneof(
  fc.constant('draft'),
  fc.constant('archived'),
)

/** Build a mock post record */
function makePostRecord(slug: string, status: string): Record<string, unknown> {
  return {
    id: 'post-id-' + slug,
    title: 'Test Post ' + slug,
    slug,
    content: 'Some content',
    excerpt: 'Some excerpt',
    featured_image: null,
    author_id: null,
    type: 'blog',
    status,
    published_at: status === 'published' ? '2024-01-01T00:00:00Z' : null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    profiles: null,
  }
}

// ---------------------------------------------------------------------------
// Property 8 — Draft posts are invisible to public queries
// Validates: Requirements 3.8
// ---------------------------------------------------------------------------

describe('Property 8 — Draft posts are invisible to public queries', () => {
  beforeEach(() => {
    capturedStatusFilter = null
    mockPost = null
  })

  // -------------------------------------------------------------------------
  // Property 8a: getPosts never returns draft or archived posts
  //
  // The mock simulates a DB that enforces the status filter: it only returns
  // the post when the filter matches the post's actual status. Since getPosts
  // applies .eq('status', 'published'), draft/archived posts are never returned.
  // -------------------------------------------------------------------------

  describe('Property 8a — getPosts never returns draft or archived posts', () => {
    it('Property 8a: getPosts returns [] when the only available post is a draft (fast-check, 100 runs)', async () => {
      await fc.assert(
        fc.asyncProperty(
          slugArb,
          nonPublishedStatus,
          async (slug, status) => {
            capturedStatusFilter = null
            mockPost = makePostRecord(slug, status)

            const results = await getPosts()

            // getPosts applies .eq('status', 'published')
            // The mock only returns the post when filter matches post.status
            // Since post.status is 'draft'/'archived', filter won't match → []
            return Array.isArray(results) && results.length === 0
          }
        ),
        { numRuns: 100 }
      )
    })

    it('Property 8a: getPosts applies the published status filter (fast-check, 100 runs)', async () => {
      await fc.assert(
        fc.asyncProperty(
          slugArb,
          nonPublishedStatus,
          async (slug, status) => {
            capturedStatusFilter = null
            mockPost = makePostRecord(slug, status)

            await getPosts()

            // The DAL must have called .eq('status', 'published')
            return capturedStatusFilter === 'published'
          }
        ),
        { numRuns: 100 }
      )
    })

    it('Property 8a: getPosts returns the post when status is published', async () => {
      const slug = 'published-post-slug'
      capturedStatusFilter = null
      mockPost = makePostRecord(slug, 'published')

      const results = await getPosts()

      // When the post is published, the filter matches and the mock returns it
      expect(results).toHaveLength(1)
      expect(results[0].slug).toBe(slug)
      expect(results[0].status).toBe('published')
    })

    it('Property 8a: getPosts returns [] for a draft post', async () => {
      capturedStatusFilter = null
      mockPost = makePostRecord('draft-post', 'draft')

      const results = await getPosts()
      expect(results).toEqual([])
    })

    it('Property 8a: getPosts returns [] for an archived post', async () => {
      capturedStatusFilter = null
      mockPost = makePostRecord('archived-post', 'archived')

      const results = await getPosts()
      expect(results).toEqual([])
    })
  })

  // -------------------------------------------------------------------------
  // Property 8b: getPostBySlug never returns draft or archived posts
  //
  // The mock simulates a DB that enforces the status filter. Since
  // getPostBySlug applies .eq('status', 'published'), it returns null for
  // any post whose status is not 'published'.
  // -------------------------------------------------------------------------

  describe('Property 8b — getPostBySlug returns null for draft or archived posts', () => {
    it('Property 8b: getPostBySlug returns null for any draft post slug (fast-check, 100 runs)', async () => {
      await fc.assert(
        fc.asyncProperty(
          slugArb,
          async (slug) => {
            capturedStatusFilter = null
            mockPost = makePostRecord(slug, 'draft')

            const result = await getPostBySlug(slug)

            // getPostBySlug applies .eq('status', 'published')
            // The mock returns null because 'published' !== 'draft'
            return result === null
          }
        ),
        { numRuns: 100 }
      )
    })

    it('Property 8b: getPostBySlug returns null for any archived post slug (fast-check, 100 runs)', async () => {
      await fc.assert(
        fc.asyncProperty(
          slugArb,
          async (slug) => {
            capturedStatusFilter = null
            mockPost = makePostRecord(slug, 'archived')

            const result = await getPostBySlug(slug)

            return result === null
          }
        ),
        { numRuns: 100 }
      )
    })

    it('Property 8b: getPostBySlug returns null for any non-published status (fast-check, 100 runs)', async () => {
      await fc.assert(
        fc.asyncProperty(
          slugArb,
          nonPublishedStatus,
          async (slug, status) => {
            capturedStatusFilter = null
            mockPost = makePostRecord(slug, status)

            const result = await getPostBySlug(slug)

            return result === null
          }
        ),
        { numRuns: 100 }
      )
    })

    it('Property 8b: getPostBySlug applies the published status filter (fast-check, 100 runs)', async () => {
      await fc.assert(
        fc.asyncProperty(
          slugArb,
          nonPublishedStatus,
          async (slug, status) => {
            capturedStatusFilter = null
            mockPost = makePostRecord(slug, status)

            await getPostBySlug(slug)

            // The DAL must have called .eq('status', 'published')
            return capturedStatusFilter === 'published'
          }
        ),
        { numRuns: 100 }
      )
    })

    it('Property 8b: getPostBySlug returns the post when status is published', async () => {
      const slug = 'published-post-slug'
      capturedStatusFilter = null
      mockPost = makePostRecord(slug, 'published')

      const result = await getPostBySlug(slug)

      expect(result).not.toBeNull()
      expect(result?.slug).toBe(slug)
      expect(result?.status).toBe('published')
    })

    it('Property 8b: getPostBySlug returns null for a draft post', async () => {
      capturedStatusFilter = null
      mockPost = makePostRecord('my-draft', 'draft')

      const result = await getPostBySlug('my-draft')
      expect(result).toBeNull()
    })

    it('Property 8b: getPostBySlug returns null for an archived post', async () => {
      capturedStatusFilter = null
      mockPost = makePostRecord('my-archived', 'archived')

      const result = await getPostBySlug('my-archived')
      expect(result).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // Property 8c: The status filter is always 'published' regardless of the
  //              slug or options passed to the DAL functions
  // -------------------------------------------------------------------------

  describe('Property 8c — Status filter is always "published" for public DAL queries', () => {
    it('Property 8c: getPosts always applies .eq("status", "published") regardless of options (fast-check, 100 runs)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.option(fc.oneof(fc.constant('blog' as const), fc.constant('news' as const))),
          fc.option(fc.integer({ min: 1, max: 100 })),
          async (type, limit) => {
            capturedStatusFilter = null
            mockPost = null

            await getPosts({
              ...(type !== null ? { type } : {}),
              ...(limit !== null ? { limit } : {}),
            })

            return capturedStatusFilter === 'published'
          }
        ),
        { numRuns: 100 }
      )
    })

    it('Property 8c: getPostBySlug always applies .eq("status", "published") for any slug (fast-check, 100 runs)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 0, maxLength: 200 }),
          async (slug) => {
            capturedStatusFilter = null
            mockPost = null

            await getPostBySlug(slug)

            return capturedStatusFilter === 'published'
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
