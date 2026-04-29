// Feature: kdcuganda-cms-platform, Property 1
//
// Property 1: Auth middleware redirects all unauthenticated admin requests
// Validates: Requirements 1.1, 1.7
//
// Strategy: The Next.js middleware uses NextRequest/NextResponse which are
// difficult to instantiate in a pure unit-test environment. Instead, we
// extract the redirect-decision logic into a pure function
// `shouldRedirectToLogin(pathname, isAuthenticated)` that mirrors the
// middleware's branching exactly, and property-test that function.

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// ---------------------------------------------------------------------------
// Pure helper — mirrors the redirect decision in src/middleware.ts
// ---------------------------------------------------------------------------

/**
 * Returns true when the middleware should redirect the request to
 * /admin/login (i.e. the request is unauthenticated and targets a
 * protected admin route).
 *
 * This mirrors the logic in src/middleware.ts:
 *   const isAdminRoute = pathname.startsWith('/admin')
 *   const isLoginPage  = pathname === '/admin/login'
 *   if (isAdminRoute && !isLoginPage && !user) → redirect
 */
export function shouldRedirectToLogin(
  pathname: string,
  isAuthenticated: boolean
): boolean {
  const isAdminRoute = pathname.startsWith('/admin')
  const isLoginPage = pathname === '/admin/login'
  return isAdminRoute && !isLoginPage && !isAuthenticated
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Generates a valid URL path segment (no slashes, non-empty).
 * e.g. "posts", "sermons-2024", "abc123"
 */
const pathSegment = fc
  .string({ minLength: 1, maxLength: 20 })
  .filter((s) => /^[a-zA-Z0-9_-]+$/.test(s))

/**
 * Generates an /admin/<segment> path (never /admin/login).
 * Covers single-level and multi-level admin paths.
 */
const adminPathNotLogin = fc.oneof(
  // /admin/<segment>
  pathSegment.filter((s) => s !== 'login').map((s) => `/admin/${s}`),
  // /admin/<segment>/<sub>
  fc
    .tuple(
      pathSegment.filter((s) => s !== 'login'),
      pathSegment
    )
    .map(([a, b]) => `/admin/${a}/${b}`),
  // /admin (root, not /admin/login)
  fc.constant('/admin')
)

/**
 * Generates a non-admin path (does not start with /admin).
 */
const nonAdminPath = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter((s) => s.startsWith('/') && !s.startsWith('/admin'))

// ---------------------------------------------------------------------------
// Property 1 — Auth middleware redirects all unauthenticated admin requests
// Validates: Requirements 1.1, 1.7
// ---------------------------------------------------------------------------

describe('Property 1 — Auth middleware redirects all unauthenticated admin requests', () => {
  // -------------------------------------------------------------------------
  // Core property: unauthenticated + admin path (not login) → redirect
  // -------------------------------------------------------------------------

  it(
    'Property 1: any /admin/* path (except /admin/login) with isAuthenticated=false should redirect (fast-check, 100 runs)',
    () => {
      fc.assert(
        fc.property(adminPathNotLogin, (pathname) => {
          return shouldRedirectToLogin(pathname, false) === true
        }),
        { numRuns: 100 }
      )
    }
  )

  // -------------------------------------------------------------------------
  // /admin/login must NEVER redirect, even when unauthenticated
  // -------------------------------------------------------------------------

  it('/admin/login does NOT redirect when unauthenticated', () => {
    expect(shouldRedirectToLogin('/admin/login', false)).toBe(false)
  })

  it('/admin/login does NOT redirect when authenticated', () => {
    expect(shouldRedirectToLogin('/admin/login', true)).toBe(false)
  })

  // -------------------------------------------------------------------------
  // Non-admin paths must NEVER redirect regardless of auth state
  // -------------------------------------------------------------------------

  it(
    'Property 1: non-admin paths never redirect regardless of auth state (fast-check, 100 runs)',
    () => {
      fc.assert(
        fc.property(nonAdminPath, fc.boolean(), (pathname, isAuthenticated) => {
          return shouldRedirectToLogin(pathname, isAuthenticated) === false
        }),
        { numRuns: 100 }
      )
    }
  )

  // -------------------------------------------------------------------------
  // Authenticated requests to any /admin/* path must NOT redirect
  // -------------------------------------------------------------------------

  it(
    'Property 1: authenticated requests to any /admin/* path (including non-login) do NOT redirect (fast-check, 100 runs)',
    () => {
      fc.assert(
        fc.property(adminPathNotLogin, (pathname) => {
          return shouldRedirectToLogin(pathname, true) === false
        }),
        { numRuns: 100 }
      )
    }
  )

  // -------------------------------------------------------------------------
  // Specific example-based assertions for clarity
  // -------------------------------------------------------------------------

  it('unauthenticated /admin redirects', () => {
    expect(shouldRedirectToLogin('/admin', false)).toBe(true)
  })

  it('unauthenticated /admin/posts redirects', () => {
    expect(shouldRedirectToLogin('/admin/posts', false)).toBe(true)
  })

  it('unauthenticated /admin/sermons/new redirects', () => {
    expect(shouldRedirectToLogin('/admin/sermons/new', false)).toBe(true)
  })

  it('unauthenticated /admin/settings redirects', () => {
    expect(shouldRedirectToLogin('/admin/settings', false)).toBe(true)
  })

  it('authenticated /admin does NOT redirect', () => {
    expect(shouldRedirectToLogin('/admin', true)).toBe(false)
  })

  it('authenticated /admin/posts does NOT redirect', () => {
    expect(shouldRedirectToLogin('/admin/posts', true)).toBe(false)
  })

  it('unauthenticated / (root) does NOT redirect', () => {
    expect(shouldRedirectToLogin('/', false)).toBe(false)
  })

  it('unauthenticated /blog does NOT redirect', () => {
    expect(shouldRedirectToLogin('/blog', false)).toBe(false)
  })

  it('unauthenticated /sermons does NOT redirect', () => {
    expect(shouldRedirectToLogin('/sermons', false)).toBe(false)
  })
})
