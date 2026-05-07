// Feature: kdcuganda-cms-platform, Property 5
// Property 5: Server Actions enforce role authorization
// Validates: Requirements 2.5, 2.6

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import type { UserRole } from '../types'

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
// Mock @/lib/supabase/server — we control what getSupabaseClient() returns
// ---------------------------------------------------------------------------

/**
 * Mutable state controlling what the mock Supabase client returns.
 * Tests set these before calling requireRoles.
 */
let mockUser: { id: string } | null = { id: 'user-123' }
let mockProfile: { id: string; role: string; name: string | null; avatar_url: string | null; phone: string | null; bio: string | null; created_at: string; updated_at: string } | null = null
let mockProfileError: { message: string } | null = null

/**
 * A chainable query builder that resolves to mockProfile / mockProfileError.
 */
function makeMockProfileBuilder() {
  const builder: Record<string, unknown> = {}
  const chainable = ['select', 'eq', 'neq', 'single', 'maybeSingle', 'order', 'limit']
  for (const method of chainable) {
    builder[method] = () => builder
  }
  builder.then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve({ data: mockProfile, error: mockProfileError }).then(resolve)
  builder.catch = (reject: (v: unknown) => unknown) =>
    Promise.resolve({ data: mockProfile, error: mockProfileError }).catch(reject)
  return builder
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({
        data: { user: mockUser },
        error: null,
      }),
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    from: (_table: string) => makeMockProfileBuilder(),
  }),
}))

// ---------------------------------------------------------------------------
// Import requireRoles and ROLES AFTER mocks are set up
// ---------------------------------------------------------------------------
import { requireRoles, ROLES } from '../authz'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ALL_VALID_ROLES: UserRole[] = ['admin', 'editor', 'author', 'member']

/** Build a full mock profile for a given role */
function makeProfile(role: string) {
  return {
    id: 'user-123',
    role,
    name: 'Test User',
    avatar_url: null,
    phone: null,
    bio: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }
}

// ---------------------------------------------------------------------------
// Property 5 — Server Actions enforce role authorization
// Validates: Requirements 2.5, 2.6
// ---------------------------------------------------------------------------

describe('Property 5 — requireRoles: role authorization enforcement', () => {
  beforeEach(() => {
    // Default: authenticated user with no profile set (tests override as needed)
    mockUser = { id: 'user-123' }
    mockProfile = null
    mockProfileError = null
  })

  // -------------------------------------------------------------------------
  // Unauthenticated: no user → always returns { error: 'Unauthenticated' }
  // -------------------------------------------------------------------------

  it('returns { error: "Unauthenticated" } when there is no authenticated user', async () => {
    mockUser = null
    const result = await requireRoles(ROLES.CONTENT)
    expect(result).toEqual({ error: 'Unauthenticated' })
  })

  it('Property 5: unauthenticated requests are always rejected for any role set (fast-check, 100 runs)', async () => {
    mockUser = null
    await fc.assert(
      fc.asyncProperty(
        // Generate a non-empty subset of valid roles as the allowed list
        fc.subarray(ALL_VALID_ROLES, { minLength: 1 }),
        async (allowedRoles) => {
          const result = await requireRoles(allowedRoles as UserRole[])
          return 'error' in result && result.error === 'Unauthenticated'
        }
      ),
      { numRuns: 100 }
    )
  })

  // -------------------------------------------------------------------------
  // ROLES.ADMIN — only 'admin' is allowed
  // -------------------------------------------------------------------------

  it('allows "admin" role for ROLES.ADMIN', async () => {
    mockProfile = makeProfile('admin')
    const result = await requireRoles(ROLES.ADMIN)
    expect('error' in result).toBe(false)
    expect((result as { role: string }).role).toBe('admin')
  })

  it('rejects "editor" role for ROLES.ADMIN', async () => {
    mockProfile = makeProfile('editor')
    const result = await requireRoles(ROLES.ADMIN)
    expect(result).toEqual({ error: 'Forbidden' })
  })

  it('rejects "author" role for ROLES.ADMIN', async () => {
    mockProfile = makeProfile('author')
    const result = await requireRoles(ROLES.ADMIN)
    expect(result).toEqual({ error: 'Forbidden' })
  })

  it('rejects "member" role for ROLES.ADMIN', async () => {
    mockProfile = makeProfile('member')
    const result = await requireRoles(ROLES.ADMIN)
    expect(result).toEqual({ error: 'Forbidden' })
  })

  it('Property 5: only "admin" passes ROLES.ADMIN — all other roles are rejected (fast-check, 100 runs)', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate role strings that are NOT 'admin'
        fc.string({ minLength: 1, maxLength: 30 }).filter((r) => r !== 'admin'),
        async (nonAdminRole) => {
          mockProfile = makeProfile(nonAdminRole)
          const result = await requireRoles(ROLES.ADMIN)
          return 'error' in result && result.error === 'Forbidden'
        }
      ),
      { numRuns: 100 }
    )
  })

  // -------------------------------------------------------------------------
  // ROLES.CONTENT — ['admin', 'editor', 'author'] are allowed
  // Used by createPost, updatePost, deletePost
  // -------------------------------------------------------------------------

  it('allows "admin" role for ROLES.CONTENT', async () => {
    mockProfile = makeProfile('admin')
    const result = await requireRoles(ROLES.CONTENT)
    expect('error' in result).toBe(false)
  })

  it('allows "editor" role for ROLES.CONTENT', async () => {
    mockProfile = makeProfile('editor')
    const result = await requireRoles(ROLES.CONTENT)
    expect('error' in result).toBe(false)
  })

  it('allows "author" role for ROLES.CONTENT', async () => {
    mockProfile = makeProfile('author')
    const result = await requireRoles(ROLES.CONTENT)
    expect('error' in result).toBe(false)
  })

  it('rejects "member" role for ROLES.CONTENT', async () => {
    mockProfile = makeProfile('member')
    const result = await requireRoles(ROLES.CONTENT)
    expect(result).toEqual({ error: 'Forbidden' })
  })

  it('Property 5: any role in ROLES.CONTENT is always allowed (fast-check, 100 runs)', async () => {
    const contentRoles = [...ROLES.CONTENT] as UserRole[]
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...contentRoles),
        async (role) => {
          mockProfile = makeProfile(role)
          const result = await requireRoles(ROLES.CONTENT)
          return !('error' in result)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 5: any role NOT in ROLES.CONTENT is always rejected (fast-check, 100 runs)', async () => {
    const contentRoleSet = new Set(ROLES.CONTENT)
    await fc.assert(
      fc.asyncProperty(
        // Generate role strings not in the CONTENT set
        fc.string({ minLength: 1, maxLength: 30 }).filter((r) => !contentRoleSet.has(r as UserRole)),
        async (forbiddenRole) => {
          mockProfile = makeProfile(forbiddenRole)
          const result = await requireRoles(ROLES.CONTENT)
          return 'error' in result && result.error === 'Forbidden'
        }
      ),
      { numRuns: 100 }
    )
  })

  // -------------------------------------------------------------------------
  // ROLES.MANAGE_STRUCTURE — ['admin', 'editor'] are allowed
  // -------------------------------------------------------------------------

  it('allows "admin" role for ROLES.MANAGE_STRUCTURE', async () => {
    mockProfile = makeProfile('admin')
    const result = await requireRoles(ROLES.MANAGE_STRUCTURE)
    expect('error' in result).toBe(false)
  })

  it('allows "editor" role for ROLES.MANAGE_STRUCTURE', async () => {
    mockProfile = makeProfile('editor')
    const result = await requireRoles(ROLES.MANAGE_STRUCTURE)
    expect('error' in result).toBe(false)
  })

  it('rejects "author" role for ROLES.MANAGE_STRUCTURE', async () => {
    mockProfile = makeProfile('author')
    const result = await requireRoles(ROLES.MANAGE_STRUCTURE)
    expect(result).toEqual({ error: 'Forbidden' })
  })

  it('rejects "member" role for ROLES.MANAGE_STRUCTURE', async () => {
    mockProfile = makeProfile('member')
    const result = await requireRoles(ROLES.MANAGE_STRUCTURE)
    expect(result).toEqual({ error: 'Forbidden' })
  })

  it('Property 5: any role in ROLES.MANAGE_STRUCTURE is always allowed (fast-check, 100 runs)', async () => {
    const manageRoles = [...ROLES.MANAGE_STRUCTURE] as UserRole[]
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...manageRoles),
        async (role) => {
          mockProfile = makeProfile(role)
          const result = await requireRoles(ROLES.MANAGE_STRUCTURE)
          return !('error' in result)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 5: any role NOT in ROLES.MANAGE_STRUCTURE is always rejected (fast-check, 100 runs)', async () => {
    const manageRoleSet = new Set(ROLES.MANAGE_STRUCTURE)
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 30 }).filter((r) => !manageRoleSet.has(r as UserRole)),
        async (forbiddenRole) => {
          mockProfile = makeProfile(forbiddenRole)
          const result = await requireRoles(ROLES.MANAGE_STRUCTURE)
          return 'error' in result && result.error === 'Forbidden'
        }
      ),
      { numRuns: 100 }
    )
  })

  // -------------------------------------------------------------------------
  // Determinism: same role always produces same result
  // -------------------------------------------------------------------------

  it('Property 5: role enforcement is deterministic — same role always produces same outcome (fast-check, 100 runs)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...ALL_VALID_ROLES),
        async (role) => {
          mockProfile = makeProfile(role)

          const result1 = await requireRoles(ROLES.CONTENT)
          // Reset mock to same state
          mockProfile = makeProfile(role)
          const result2 = await requireRoles(ROLES.CONTENT)

          const isError1 = 'error' in result1
          const isError2 = 'error' in result2

          // Both calls must agree on allow/deny
          return isError1 === isError2
        }
      ),
      { numRuns: 100 }
    )
  })

  // -------------------------------------------------------------------------
  // Missing profile: profile not found → returns { error: 'Forbidden' }
  // -------------------------------------------------------------------------

  it('returns { error: "Forbidden" } when profile is not found in the database', async () => {
    mockUser = { id: 'user-123' }
    mockProfile = null
    mockProfileError = null
    const result = await requireRoles(ROLES.CONTENT)
    expect(result).toEqual({ error: 'Forbidden' })
  })

  it('Property 5: missing profile always returns Forbidden for any allowed role set (fast-check, 100 runs)', async () => {
    mockUser = { id: 'user-123' }
    mockProfile = null
    mockProfileError = null
    await fc.assert(
      fc.asyncProperty(
        fc.subarray(ALL_VALID_ROLES, { minLength: 1 }),
        async (allowedRoles) => {
          const result = await requireRoles(allowedRoles as UserRole[])
          return 'error' in result && result.error === 'Forbidden'
        }
      ),
      { numRuns: 100 }
    )
  })

  // -------------------------------------------------------------------------
  // Arbitrary allowed-role sets: the function correctly partitions any role
  // -------------------------------------------------------------------------

  it('Property 5: for any allowed-role set, roles inside are accepted and roles outside are rejected (fast-check, 100 runs)', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Pick a non-empty subset of valid roles as the "allowed" set
        fc.subarray(ALL_VALID_ROLES, { minLength: 1 }),
        // Pick one role from ALL valid roles to test
        fc.constantFrom(...ALL_VALID_ROLES),
        async (allowedRoles, testRole) => {
          mockProfile = makeProfile(testRole)
          const result = await requireRoles(allowedRoles as UserRole[])
          const shouldBeAllowed = allowedRoles.includes(testRole)
          const wasAllowed = !('error' in result)
          return shouldBeAllowed === wasAllowed
        }
      ),
      { numRuns: 100 }
    )
  })
})
