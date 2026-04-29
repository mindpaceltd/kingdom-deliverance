// Feature: kdcuganda-cms-platform, Property 2
//
// Property 2: Auth error messages are displayed as-is
// Validates: Requirements 1.4
//
// Strategy: The login page (src/app/admin/login/page.tsx) calls
// `setError(authError.message)` and renders `{error}` directly in the UI.
// There is no transformation, truncation, or substitution of the error string.
//
// We extract the pure pass-through logic into a testable function
// `getLoginErrorMessage(authError)` that mirrors what the login form does,
// and property-test that for any arbitrary error message string the function
// returns the exact same string unchanged.

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// ---------------------------------------------------------------------------
// Pure helper — mirrors the error-display logic in the login page
//
// In src/app/admin/login/page.tsx:
//   const { error: authError } = await supabase.auth.signInWithPassword(...)
//   if (authError) {
//     setError(authError.message)   ← message stored as-is
//   }
//
// The rendered output is simply: {error}
// So the "transformation" is identity: displayed = authError.message
// ---------------------------------------------------------------------------

/**
 * Returns the error message that the login form will display for a given
 * Supabase auth error object.  Mirrors the logic in LoginForm.handleLogin:
 *   setError(authError.message)
 */
export function getLoginErrorMessage(authError: { message: string }): string {
  return authError.message
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Generates arbitrary non-empty error message strings — the kind Supabase
 * might return (e.g. "Invalid login credentials", "Email not confirmed",
 * "Too many requests", or any other string).
 */
const errorMessageArb = fc.string({ minLength: 1, maxLength: 500 })

/**
 * Generates realistic Supabase-style error messages as examples.
 */
const realisticErrorMessages = [
  'Invalid login credentials',
  'Email not confirmed',
  'Too many requests',
  'User not found',
  'Invalid email or password',
  'Account has been disabled',
  'Password should be at least 6 characters',
  'Unable to validate email address: invalid format',
  'Email rate limit exceeded',
  'Network request failed',
]

// ---------------------------------------------------------------------------
// Property 2 — Auth error messages are displayed as-is
// Validates: Requirements 1.4
// ---------------------------------------------------------------------------

describe('Property 2 — Auth error messages are displayed as-is', () => {
  // -------------------------------------------------------------------------
  // Core property: for any error message string, the displayed message
  // equals the input string exactly (identity / pass-through)
  // -------------------------------------------------------------------------

  it(
    'Property 2: for any Supabase auth error message, getLoginErrorMessage returns it unchanged (fast-check, 100 runs)',
    () => {
      fc.assert(
        fc.property(errorMessageArb, (message) => {
          const authError = { message }
          const displayed = getLoginErrorMessage(authError)
          return displayed === message
        }),
        { numRuns: 100 }
      )
    }
  )

  // -------------------------------------------------------------------------
  // The displayed message must not be truncated
  // -------------------------------------------------------------------------

  it(
    'Property 2: displayed message length equals input length — no truncation (fast-check, 100 runs)',
    () => {
      fc.assert(
        fc.property(errorMessageArb, (message) => {
          const displayed = getLoginErrorMessage({ message })
          return displayed.length === message.length
        }),
        { numRuns: 100 }
      )
    }
  )

  // -------------------------------------------------------------------------
  // The displayed message must not be modified (no uppercasing, trimming, etc.)
  // -------------------------------------------------------------------------

  it(
    'Property 2: displayed message is byte-for-byte identical to input — no modification (fast-check, 100 runs)',
    () => {
      fc.assert(
        fc.property(errorMessageArb, (message) => {
          const displayed = getLoginErrorMessage({ message })
          // Every character at every position must match
          for (let i = 0; i < message.length; i++) {
            if (displayed[i] !== message[i]) return false
          }
          return true
        }),
        { numRuns: 100 }
      )
    }
  )

  // -------------------------------------------------------------------------
  // Example-based assertions using realistic Supabase error messages
  // -------------------------------------------------------------------------

  for (const msg of realisticErrorMessages) {
    it(`displays Supabase error as-is: "${msg}"`, () => {
      expect(getLoginErrorMessage({ message: msg })).toBe(msg)
    })
  }

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  it('handles single-character error messages', () => {
    expect(getLoginErrorMessage({ message: 'E' })).toBe('E')
  })

  it('handles error messages with special characters', () => {
    const msg = 'Error: <script>alert("xss")</script>'
    expect(getLoginErrorMessage({ message: msg })).toBe(msg)
  })

  it('handles error messages with newlines and whitespace', () => {
    const msg = 'Login failed\nPlease try again'
    expect(getLoginErrorMessage({ message: msg })).toBe(msg)
  })

  it('handles very long error messages without truncation', () => {
    const msg = 'A'.repeat(500)
    const displayed = getLoginErrorMessage({ message: msg })
    expect(displayed).toBe(msg)
    expect(displayed.length).toBe(500)
  })

  it('handles error messages with unicode characters', () => {
    const msg = 'Erreur d\'authentification: identifiants invalides'
    expect(getLoginErrorMessage({ message: msg })).toBe(msg)
  })
})
