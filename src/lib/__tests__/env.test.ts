// Feature: kdcuganda-cms-platform, Property 15
// Property 15: Env validation identifies each missing variable
// Validates: Requirements 19.2

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fc from 'fast-check'

/**
 * The required env vars that env.ts validates.
 */
const REQUIRED_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const

type RequiredVar = (typeof REQUIRED_VARS)[number]

/**
 * Helper: set all required env vars to a non-empty value, then delete the
 * specified one. Returns a cleanup function that restores the original state.
 */
function withMissingVar(missing: RequiredVar): () => void {
  const originals: Partial<Record<RequiredVar, string | undefined>> = {}

  for (const key of REQUIRED_VARS) {
    originals[key] = process.env[key]
    process.env[key] = 'test-value'
  }

  // Remove the one we want to be missing
  delete process.env[missing]

  return () => {
    for (const key of REQUIRED_VARS) {
      const original = originals[key]
      if (original === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = original
      }
    }
  }
}

/**
 * Dynamically import env.ts in a fresh module context so the top-level
 * validation code re-runs with the current process.env state.
 */
async function importEnv(): Promise<void> {
  vi.resetModules()
  await import('../env')
}

describe('Property 15 — Env validation identifies each missing variable', () => {
  // Save and restore the real env vars around the whole suite
  const savedEnv: Record<string, string | undefined> = {}

  beforeEach(() => {
    for (const key of REQUIRED_VARS) {
      savedEnv[key] = process.env[key]
    }
  })

  afterEach(() => {
    for (const key of REQUIRED_VARS) {
      const saved = savedEnv[key]
      if (saved === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = saved
      }
    }
    vi.resetModules()
  })

  it('throws when NEXT_PUBLIC_SUPABASE_URL is missing and names it in the error', async () => {
    const restore = withMissingVar('NEXT_PUBLIC_SUPABASE_URL')
    try {
      await expect(importEnv()).rejects.toThrow('NEXT_PUBLIC_SUPABASE_URL')
    } finally {
      restore()
    }
  })

  it('throws when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing and names it in the error', async () => {
    const restore = withMissingVar('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    try {
      await expect(importEnv()).rejects.toThrow('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    } finally {
      restore()
    }
  })

  it('throws when SUPABASE_SERVICE_ROLE_KEY is missing and names it in the error', async () => {
    const restore = withMissingVar('SUPABASE_SERVICE_ROLE_KEY')
    try {
      await expect(importEnv()).rejects.toThrow('SUPABASE_SERVICE_ROLE_KEY')
    } finally {
      restore()
    }
  })

  it('does not throw when all required vars are present', async () => {
    for (const key of REQUIRED_VARS) {
      process.env[key] = 'test-value'
    }
    await expect(importEnv()).resolves.not.toThrow()
  })

  /**
   * Property 15 (fast-check):
   * For every non-empty subset of the 3 required vars that is missing,
   * the validation error message names at least one of the missing variables.
   *
   * We iterate over all 3 vars individually (the spec requires each missing
   * var to be identified), and use fast-check to generate arbitrary
   * non-empty string values for the vars that ARE present, confirming the
   * error message always names the specific missing variable regardless of
   * what values the other vars hold.
   */
  it(
    'Property 15: for each required var, removing it causes an error naming that var (fast-check, 100 runs)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Pick which var to remove (index 0, 1, or 2)
          fc.integer({ min: 0, max: 2 }),
          // Generate non-empty string values for the other two vars
          fc.string({ minLength: 1, maxLength: 64 }),
          fc.string({ minLength: 1, maxLength: 64 }),
          async (missingIndex, val1, val2) => {
            const missingVar = REQUIRED_VARS[missingIndex]
            const presentVars = REQUIRED_VARS.filter((_, i) => i !== missingIndex)

            // Set the two present vars to arbitrary non-empty values
            process.env[presentVars[0]] = val1
            process.env[presentVars[1]] = val2
            // Remove the missing var
            delete process.env[missingVar]

            let threw = false
            let errorMessage = ''
            try {
              vi.resetModules()
              await import('../env')
            } catch (err) {
              threw = true
              errorMessage = err instanceof Error ? err.message : String(err)
            } finally {
              // Restore to a clean state for the next iteration
              for (const key of REQUIRED_VARS) {
                delete process.env[key]
              }
              vi.resetModules()
            }

            // The validation must throw …
            if (!threw) return false
            // … and the error must name the missing variable
            return errorMessage.includes(missingVar)
          }
        ),
        { numRuns: 100 }
      )
    }
  )
})
