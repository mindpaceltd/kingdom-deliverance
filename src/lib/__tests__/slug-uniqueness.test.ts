// Feature: kdcuganda-cms-platform, Property 7
// Property 7: Slug uniqueness is enforced across content tables
// Validates: Requirements 3.6, 4.5, 5.5

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
// Mock next/cache to avoid revalidatePath errors in test environment
// ---------------------------------------------------------------------------
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Mutable state controlling what the mock Supabase client returns.
// Tests set these before calling the action under test.
// ---------------------------------------------------------------------------

/** The error the mock DB insert will return (null = success) */
let mockInsertError: { code: string; message: string } | null = null

/**
 * Build a chainable Supabase query builder that resolves to the configured
 * mockInsertError / success state.
 *
 * The insert chain used by all three actions is:
 *   supabase.from('table').insert({...}).select('id').single()
 *
 * We need every method in the chain to return the same builder so that
 * `.select('id').single()` ultimately resolves to our mock result.
 */
function makeMockQueryBuilder() {
  const builder: Record<string, unknown> = {}
  const chainable = ['insert', 'update', 'select', 'eq', 'single', 'maybeSingle', 'order', 'limit']
  for (const method of chainable) {
    builder[method] = () => builder
  }
  // Make the builder thenable so `await builder` resolves correctly
  builder.then = (resolve: (v: unknown) => unknown) => {
    const result = mockInsertError
      ? { data: null, error: mockInsertError }
      : { data: { id: 'new-id-123' }, error: null }
    return Promise.resolve(result).then(resolve)
  }
  builder.catch = (reject: (v: unknown) => unknown) => {
    const result = mockInsertError
      ? { data: null, error: mockInsertError }
      : { data: { id: 'new-id-123' }, error: null }
    return Promise.resolve(result).catch(reject)
  }
  return builder
}

// ---------------------------------------------------------------------------
// Mock @/lib/supabase/server — controls what createClient() returns
// ---------------------------------------------------------------------------
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: 'user-123' } }, error: null }),
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    from: (_table: string) => makeMockQueryBuilder(),
  }),
}))

// ---------------------------------------------------------------------------
// Mock @/lib/authz — bypass role checks, return a valid profile so the
// action proceeds past the auth gate to the DB call
// ---------------------------------------------------------------------------
vi.mock('@/lib/authz', () => ({
  requireRoles: async () => ({
    id: 'user-123',
    role: 'editor',
    name: 'Test Editor',
    avatar_url: null,
    phone: null,
    bio: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }),
  ROLES: {
    ADMIN: ['admin'],
    CONTENT: ['admin', 'editor', 'author'],
    MANAGE_STRUCTURE: ['admin', 'editor'],
  },
}))

// ---------------------------------------------------------------------------
// Import actions AFTER mocks are set up
// ---------------------------------------------------------------------------
import { createPost } from '../actions/posts'
import { createSermon } from '../actions/sermons'
import { createEvent } from '../actions/events'

// ---------------------------------------------------------------------------
// Minimal valid payloads for each content type
// ---------------------------------------------------------------------------

function makePostData(slug: string) {
  return {
    title: 'Test Post',
    slug,
    type: 'blog' as const,
    status: 'draft' as const,
  }
}

function makeSermonData(slug: string) {
  return {
    title: 'Test Sermon',
    slug,
    preacher: 'Pastor Test',
    date: '2024-01-01',
    status: 'draft' as const,
  }
}

function makeEventData(slug: string) {
  return {
    title: 'Test Event',
    slug,
    date: '2024-01-01',
    is_featured: false,
    status: 'upcoming' as const,
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Simulate a Postgres unique constraint violation */
function setUniqueConstraintError() {
  mockInsertError = { code: '23505', message: 'duplicate key value violates unique constraint' }
}

/** Simulate a different DB error (not a unique constraint violation) */
function setOtherDbError(message: string) {
  mockInsertError = { code: '42P01', message }
}

/** Simulate a successful insert */
function setInsertSuccess() {
  mockInsertError = null
}

// ---------------------------------------------------------------------------
// Property 7 — Slug uniqueness is enforced across content tables
// Validates: Requirements 3.6, 4.5, 5.5
// ---------------------------------------------------------------------------

describe('Property 7 — Slug uniqueness enforcement across content tables', () => {
  beforeEach(() => {
    setInsertSuccess()
  })

  // -------------------------------------------------------------------------
  // Property 7a: createPost returns { error: 'Slug already exists...' } on 23505
  // Per requirement 8.13, the error includes a suggested alternative slug.
  // -------------------------------------------------------------------------

  describe('Property 7a — createPost: 23505 → { error: "Slug already exists. Suggested: ..." }', () => {
    it('returns an error starting with "Slug already exists" for a known duplicate slug', async () => {
      setUniqueConstraintError()
      const result = await createPost(makePostData('my-duplicate-slug'))
      expect('error' in result).toBe(true)
      expect((result as { error: string }).error).toMatch(/^Slug already exists/)
    })

    it('Property 7a: for any slug string, a 23505 error always returns an error starting with "Slug already exists" (fast-check, 100 runs)', async () => {
      setUniqueConstraintError()
      await fc.assert(
        fc.asyncProperty(
          // Generate arbitrary slug-like strings (any non-empty string)
          fc.string({ minLength: 1, maxLength: 200 }),
          async (slug) => {
            const result = await createPost(makePostData(slug))
            return 'error' in result && result.error.startsWith('Slug already exists')
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // -------------------------------------------------------------------------
  // Property 7b: createSermon returns { error: 'Slug already exists' } on 23505
  // -------------------------------------------------------------------------

  describe('Property 7b — createSermon: 23505 → { error: "Slug already exists" }', () => {
    it('returns { error: "Slug already exists" } for a known duplicate slug', async () => {
      setUniqueConstraintError()
      const result = await createSermon(makeSermonData('my-duplicate-slug'))
      expect(result).toEqual({ error: 'Slug already exists' })
    })

    it('Property 7b: for any slug string, a 23505 error always returns { error: "Slug already exists" } (fast-check, 100 runs)', async () => {
      setUniqueConstraintError()
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 200 }),
          async (slug) => {
            const result = await createSermon(makeSermonData(slug))
            return 'error' in result && result.error === 'Slug already exists'
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // -------------------------------------------------------------------------
  // Property 7c: createEvent returns { error: 'Slug already exists' } on 23505
  // -------------------------------------------------------------------------

  describe('Property 7c — createEvent: 23505 → { error: "Slug already exists" }', () => {
    it('returns { error: "Slug already exists" } for a known duplicate slug', async () => {
      setUniqueConstraintError()
      const result = await createEvent(makeEventData('my-duplicate-slug'))
      expect(result).toEqual({ error: 'Slug already exists' })
    })

    it('Property 7c: for any slug string, a 23505 error always returns { error: "Slug already exists" } (fast-check, 100 runs)', async () => {
      setUniqueConstraintError()
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 200 }),
          async (slug) => {
            const result = await createEvent(makeEventData(slug))
            return 'error' in result && result.error === 'Slug already exists'
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // -------------------------------------------------------------------------
  // Property 7d: Non-23505 errors return the actual error message, not
  //              'Slug already exists'
  // -------------------------------------------------------------------------

  describe('Property 7d — Non-23505 errors pass through the actual message', () => {
    it('createPost: non-23505 error returns { error: <actual message> }, not starting with "Slug already exists"', async () => {
      setOtherDbError('relation "posts" does not exist')
      const result = await createPost(makePostData('some-slug'))
      expect(result).toEqual({ error: 'relation "posts" does not exist' })
      expect((result as { error: string }).error).not.toMatch(/^Slug already exists/)
    })

    it('createSermon: non-23505 error returns { error: <actual message> }, not starting with "Slug already exists"', async () => {
      setOtherDbError('permission denied for table sermons')
      const result = await createSermon(makeSermonData('some-slug'))
      expect(result).toEqual({ error: 'permission denied for table sermons' })
      expect((result as { error: string }).error).not.toMatch(/^Slug already exists/)
    })

    it('createEvent: non-23505 error returns { error: <actual message> }, not starting with "Slug already exists"', async () => {
      setOtherDbError('permission denied for table events')
      const result = await createEvent(makeEventData('some-slug'))
      expect(result).toEqual({ error: 'permission denied for table events' })
      expect((result as { error: string }).error).not.toMatch(/^Slug already exists/)
    })

    it('Property 7d: for any non-23505 error code and any slug, the action never returns "Slug already exists" (fast-check, 100 runs)', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate arbitrary slug strings
          fc.string({ minLength: 1, maxLength: 200 }),
          // Generate arbitrary error messages
          fc.string({ minLength: 1, maxLength: 200 }),
          // Generate arbitrary error codes that are NOT '23505'
          fc.string({ minLength: 1, maxLength: 10 }).filter((code) => code !== '23505'),
          async (slug, errorMessage, errorCode) => {
            mockInsertError = { code: errorCode, message: errorMessage }

            const postResult = await createPost(makePostData(slug))
            const sermonResult = await createSermon(makeSermonData(slug))
            const eventResult = await createEvent(makeEventData(slug))

            const postError = 'error' in postResult ? postResult.error : null
            const sermonError = 'error' in sermonResult ? sermonResult.error : null
            const eventError = 'error' in eventResult ? eventResult.error : null

            // All three must return an error (not success)
            if (!postError || !sermonError || !eventError) return false

            // None of them should start with 'Slug already exists' for a non-23505 code
            return (
              !postError.startsWith('Slug already exists') &&
              !sermonError.startsWith('Slug already exists') &&
              !eventError.startsWith('Slug already exists')
            )
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // -------------------------------------------------------------------------
  // Sanity: successful insert returns { success: true, id: ... }
  // -------------------------------------------------------------------------

  describe('Sanity — successful insert returns success', () => {
    it('createPost returns { success: true, id } when there is no DB error', async () => {
      setInsertSuccess()
      const result = await createPost(makePostData('unique-slug'))
      expect(result).toMatchObject({ success: true, id: 'new-id-123' })
    })

    it('createSermon returns { success: true, id } when there is no DB error', async () => {
      setInsertSuccess()
      const result = await createSermon(makeSermonData('unique-slug'))
      expect(result).toMatchObject({ success: true, id: 'new-id-123' })
    })

    it('createEvent returns { success: true, id } when there is no DB error', async () => {
      setInsertSuccess()
      const result = await createEvent(makeEventData('unique-slug'))
      expect(result).toMatchObject({ success: true, id: 'new-id-123' })
    })
  })
})
