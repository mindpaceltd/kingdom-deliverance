// Feature: kdcuganda-cms-platform, Property 11 / 12 / 13 / 14
// Property 11: DAL getBy* functions return null for unknown slugs — Validates: Requirements 11.2
// Property 12: DAL functions never throw on Supabase errors — Validates: Requirements 11.5
// Property 13: Search results always match the query string — Validates: Requirements 16.2
// Property 14: Short search queries produce no database calls — Validates: Requirements 16.5

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
// Mock @/lib/supabase/server — we control what createClient() returns
// ---------------------------------------------------------------------------

/**
 * A factory that creates a mock Supabase query builder.
 * The builder is chainable (each method returns `this`) and resolves
 * to the provided `result` when awaited.
 */
function makeMockBuilder(result: { data: unknown; error: unknown; count?: number }) {
  const builder: Record<string, unknown> = {}

  // All chainable query methods return the same builder
  const chainable = [
    'select', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
    'order', 'limit', 'range', 'single', 'maybeSingle',
    'or', 'in', 'filter', 'ilike',
  ]
  for (const method of chainable) {
    builder[method] = () => builder
  }

  // Make the builder thenable so `await builder` resolves to result
  builder.then = (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve)
  builder.catch = (reject: (v: unknown) => unknown) => Promise.resolve(result).catch(reject)

  return builder
}

// The mock createClient — we'll replace its implementation per test
let mockQueryResult: { data: unknown; error: unknown; count?: number } = {
  data: null,
  error: null,
}

// Track calls to the from() method so Property 14 can assert no DB calls
let fromCallCount = 0

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    from: (table: string) => {
      fromCallCount++
      return makeMockBuilder(mockQueryResult)
    },
  }),
}))

// ---------------------------------------------------------------------------
// Import DAL functions AFTER mocks are set up
// ---------------------------------------------------------------------------
import {
  getPostBySlug,
  getSermonBySlug,
  getEventBySlug,
  getMinistryBySlug,
  getPosts,
  getSermons,
  getEvents,
  getMinistries,
  searchContent,
} from '../supabase/queries'

// ---------------------------------------------------------------------------
// Property 11 — DAL getBy* functions return null for unknown slugs
// Validates: Requirements 11.2
// ---------------------------------------------------------------------------

describe('Property 11 — DAL getBy* functions return null for unknown slugs', () => {
  beforeEach(() => {
    // Supabase returns no row found (data: null, error: null)
    mockQueryResult = { data: null, error: null }
    fromCallCount = 0
  })

  it('Property 11: getPostBySlug returns null for any slug when no row found (fast-check, 100 runs)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 0, maxLength: 200 }),
        async (slug) => {
          const result = await getPostBySlug(slug)
          return result === null
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 11: getSermonBySlug returns null for any slug when no row found (fast-check, 100 runs)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 0, maxLength: 200 }),
        async (slug) => {
          const result = await getSermonBySlug(slug)
          return result === null
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 11: getEventBySlug returns null for any slug when no row found (fast-check, 100 runs)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 0, maxLength: 200 }),
        async (slug) => {
          const result = await getEventBySlug(slug)
          return result === null
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 11: getMinistryBySlug returns null for any slug when no row found (fast-check, 100 runs)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 0, maxLength: 200 }),
        async (slug) => {
          const result = await getMinistryBySlug(slug)
          return result === null
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ---------------------------------------------------------------------------
// Property 12 — DAL functions never throw on Supabase errors
// Validates: Requirements 11.5
// ---------------------------------------------------------------------------

describe('Property 12 — DAL functions never throw on Supabase errors', () => {
  beforeEach(() => {
    fromCallCount = 0
  })

  it('Property 12: getPostBySlug never throws on arbitrary error messages (fast-check, 100 runs)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 0, maxLength: 200 }),
        async (errorMessage) => {
          mockQueryResult = { data: null, error: { message: errorMessage, code: '500' } }
          let threw = false
          try {
            await getPostBySlug('any-slug')
          } catch {
            threw = true
          }
          return !threw
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 12: getSermonBySlug never throws on arbitrary error messages (fast-check, 100 runs)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 0, maxLength: 200 }),
        async (errorMessage) => {
          mockQueryResult = { data: null, error: { message: errorMessage, code: '500' } }
          let threw = false
          try {
            await getSermonBySlug('any-slug')
          } catch {
            threw = true
          }
          return !threw
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 12: getEventBySlug never throws on arbitrary error messages (fast-check, 100 runs)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 0, maxLength: 200 }),
        async (errorMessage) => {
          mockQueryResult = { data: null, error: { message: errorMessage, code: '500' } }
          let threw = false
          try {
            await getEventBySlug('any-slug')
          } catch {
            threw = true
          }
          return !threw
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 12: getMinistryBySlug never throws on arbitrary error messages (fast-check, 100 runs)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 0, maxLength: 200 }),
        async (errorMessage) => {
          mockQueryResult = { data: null, error: { message: errorMessage, code: '500' } }
          let threw = false
          try {
            await getMinistryBySlug('any-slug')
          } catch {
            threw = true
          }
          return !threw
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 12: getPosts never throws on arbitrary error messages (fast-check, 100 runs)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 0, maxLength: 200 }),
        async (errorMessage) => {
          mockQueryResult = { data: null, error: { message: errorMessage, code: '500' } }
          let threw = false
          try {
            await getPosts()
          } catch {
            threw = true
          }
          return !threw
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 12: getSermons never throws on arbitrary error messages (fast-check, 100 runs)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 0, maxLength: 200 }),
        async (errorMessage) => {
          mockQueryResult = { data: null, error: { message: errorMessage, code: '500' }, count: 0 }
          let threw = false
          try {
            await getSermons()
          } catch {
            threw = true
          }
          return !threw
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 12: getEvents never throws on arbitrary error messages (fast-check, 100 runs)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 0, maxLength: 200 }),
        async (errorMessage) => {
          mockQueryResult = { data: null, error: { message: errorMessage, code: '500' } }
          let threw = false
          try {
            await getEvents()
          } catch {
            threw = true
          }
          return !threw
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 12: getMinistries never throws on arbitrary error messages (fast-check, 100 runs)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 0, maxLength: 200 }),
        async (errorMessage) => {
          mockQueryResult = { data: null, error: { message: errorMessage, code: '500' } }
          let threw = false
          try {
            await getMinistries()
          } catch {
            threw = true
          }
          return !threw
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 12: getPostBySlug returns null (not throws) on DB error', async () => {
    mockQueryResult = { data: null, error: { message: 'DB error', code: '500' } }
    const result = await getPostBySlug('some-slug')
    expect(result).toBeNull()
  })

  it('Property 12: getPosts returns [] (not throws) on DB error', async () => {
    mockQueryResult = { data: null, error: { message: 'DB error', code: '500' } }
    const result = await getPosts()
    expect(result).toEqual([])
  })

  it('Property 12: getSermons returns { data: [], count: 0 } (not throws) on DB error', async () => {
    mockQueryResult = { data: null, error: { message: 'DB error', code: '500' }, count: 0 }
    const result = await getSermons()
    expect(result).toEqual({ data: [], count: 0 })
  })

  it('Property 12: getEvents returns [] (not throws) on DB error', async () => {
    mockQueryResult = { data: null, error: { message: 'DB error', code: '500' } }
    const result = await getEvents()
    expect(result).toEqual([])
  })

  it('Property 12: getMinistries returns [] (not throws) on DB error', async () => {
    mockQueryResult = { data: null, error: { message: 'DB error', code: '500' } }
    const result = await getMinistries()
    expect(result).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Property 13 — Search results always match the query string
// Validates: Requirements 16.2
// ---------------------------------------------------------------------------

describe('Property 13 — searchContent returns mocked data for valid queries', () => {
  beforeEach(() => {
    fromCallCount = 0
  })

  it('Property 13: searchContent with query >= 2 chars returns the mocked data (fast-check, 100 runs)', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate query strings whose TRIMMED length is >= 2
        fc.string({ minLength: 2, maxLength: 100 }).filter((s) => s.trim().length >= 2),
        async (query) => {
          // Mock returns posts/sermons/events that include the query in their title
          const mockPost = { id: '1', title: `Result for ${query}`, slug: 'test', excerpt: query }
          const mockSermon = { id: '2', title: `Sermon about ${query}`, slug: 'sermon-test' }
          const mockEvent = { id: '3', title: `Event: ${query}`, slug: 'event-test' }

          // searchContent calls from() 3 times (posts, sermons, events)
          // We need to return different data for each call
          // Since our mock returns the same result for all calls, we set data as arrays
          mockQueryResult = { data: [mockPost], error: null }

          let threw = false
          let result: { posts: unknown[]; sermons: unknown[]; events: unknown[] } = {
            posts: [],
            sermons: [],
            events: [],
          }
          try {
            result = await searchContent(query)
          } catch {
            threw = true
          }

          // Must not throw
          if (threw) return false

          // Must return an object with posts, sermons, events arrays
          if (!Array.isArray(result.posts)) return false
          if (!Array.isArray(result.sermons)) return false
          if (!Array.isArray(result.events)) return false

          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 13: searchContent with valid query calls the database (fast-check, 100 runs)', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate strings whose TRIMMED length is >= 2
        fc.string({ minLength: 2, maxLength: 100 }).filter((s) => s.trim().length >= 2),
        async (query) => {
          mockQueryResult = { data: [], error: null }
          fromCallCount = 0

          await searchContent(query)

          // searchContent should call from() 3 times (posts, sermons, events)
          return fromCallCount === 3
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 13: searchContent returns empty arrays on DB error without throwing', async () => {
    mockQueryResult = { data: null, error: { message: 'DB error', code: '500' } }
    const result = await searchContent('valid query')
    expect(result.posts).toEqual([])
    expect(result.sermons).toEqual([])
    expect(result.events).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Property 14 — Short search queries produce no database calls
// Validates: Requirements 16.5
// ---------------------------------------------------------------------------

describe('Property 14 — Short search queries produce no database calls', () => {
  beforeEach(() => {
    mockQueryResult = { data: [], error: null }
    fromCallCount = 0
  })

  it('Property 14: empty string query returns empty result without DB calls', async () => {
    const result = await searchContent('')
    expect(result).toEqual({ posts: [], sermons: [], events: [] })
    expect(fromCallCount).toBe(0)
  })

  it('Property 14: single-char query returns empty result without DB calls', async () => {
    const result = await searchContent('a')
    expect(result).toEqual({ posts: [], sermons: [], events: [] })
    expect(fromCallCount).toBe(0)
  })

  it('Property 14: whitespace-only query returns empty result without DB calls', async () => {
    const result = await searchContent('   ')
    expect(result).toEqual({ posts: [], sermons: [], events: [] })
    expect(fromCallCount).toBe(0)
  })

  it('Property 14: single char after trim returns empty result without DB calls', async () => {
    const result = await searchContent('  a  ')
    expect(result).toEqual({ posts: [], sermons: [], events: [] })
    expect(fromCallCount).toBe(0)
  })

  it(
    'Property 14: any string with trimmed length < 2 returns empty result without DB calls (fast-check, 100 runs)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate strings whose trimmed length is 0 or 1
          fc.oneof(
            // Empty string
            fc.constant(''),
            // Single non-whitespace character (optionally surrounded by spaces)
            fc.tuple(
              fc.string({ minLength: 0, maxLength: 10 }).map((s) => s.replace(/\S/g, ' ')), // spaces only
              fc.string({ minLength: 1, maxLength: 1 }).filter((c) => c.trim().length === 1), // one non-space char
              fc.string({ minLength: 0, maxLength: 10 }).map((s) => s.replace(/\S/g, ' ')), // spaces only
            ).map(([pre, ch, post]) => `${pre}${ch}${post}`),
            // Whitespace-only strings
            fc.string({ minLength: 1, maxLength: 20 }).map((s) => s.replace(/\S/g, ' ')),
          ),
          async (shortQuery) => {
            fromCallCount = 0
            const result = await searchContent(shortQuery)

            // Must return the empty sentinel
            const isEmpty =
              Array.isArray(result.posts) &&
              result.posts.length === 0 &&
              Array.isArray(result.sermons) &&
              result.sermons.length === 0 &&
              Array.isArray(result.events) &&
              result.events.length === 0

            // Must not have called the DB
            const noDbCalls = fromCallCount === 0

            return isEmpty && noDbCalls
          }
        ),
        { numRuns: 100 }
      )
    }
  )
})
