// Feature: kdcuganda-cms-platform, Property 4
//
// Property 4: Delete controls hidden for non-owned records
// Validates: Requirements 2.3
//
// Strategy: The delete-control visibility decision is a pure function of
// (role, currentUserId, recordAuthorId). We extract that logic into
// `isDeleteVisible` (src/components/admin/delete-visibility.ts) — which
// mirrors the `canDelete` helper used in every CRUD manager — and
// property-test it with fast-check.
//
// The core property under test:
//   For any role in { 'editor', 'author' } and for any pair of UUIDs where
//   recordAuthorId !== currentUserId, isDeleteVisible MUST return false.

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { isDeleteVisible } from '../delete-visibility'

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Generates a UUID v4 string using fast-check's built-in uuid arbitrary.
 */
const uuidArb = fc.uuid()

/**
 * Generates a pair of UUIDs that are guaranteed to be different.
 * Used to represent (currentUserId, recordAuthorId) where the user does NOT
 * own the record.
 */
const differentUuidPairArb = fc
  .tuple(uuidArb, uuidArb)
  .filter(([a, b]) => a !== b)

/**
 * Generates a role that is 'editor' or 'author' — the roles subject to
 * the ownership restriction in Requirement 2.3.
 */
const restrictedRoleArb = fc.constantFrom('editor', 'author')

// ---------------------------------------------------------------------------
// Property 4 — Delete controls hidden for non-owned records
// Validates: Requirements 2.3
// ---------------------------------------------------------------------------

describe('Property 4 — Delete controls hidden for non-owned records', () => {
  // -------------------------------------------------------------------------
  // Core property: editor/author + non-owned record → delete NOT visible
  // -------------------------------------------------------------------------

  it(
    'Property 4: for any editor/author role and any record not owned by the current user, delete control is hidden (fast-check, 100 runs)',
    () => {
      fc.assert(
        fc.property(
          restrictedRoleArb,
          differentUuidPairArb,
          (role, [currentUserId, recordAuthorId]) => {
            // recordAuthorId !== currentUserId (guaranteed by differentUuidPairArb)
            return isDeleteVisible(role, currentUserId, recordAuthorId) === false
          }
        ),
        { numRuns: 100 }
      )
    }
  )

  // -------------------------------------------------------------------------
  // Corollary: editor/author + owned record → delete IS visible
  // -------------------------------------------------------------------------

  it(
    'Property 4: for any editor/author role and a record owned by the current user, delete control is visible (fast-check, 100 runs)',
    () => {
      fc.assert(
        fc.property(
          restrictedRoleArb,
          uuidArb,
          (role, userId) => {
            // Same userId for both currentUserId and recordAuthorId → owned record
            return isDeleteVisible(role, userId, userId) === true
          }
        ),
        { numRuns: 100 }
      )
    }
  )

  // -------------------------------------------------------------------------
  // Admin always sees delete regardless of ownership
  // -------------------------------------------------------------------------

  it(
    'Property 4: admin role always sees delete control regardless of record ownership (fast-check, 100 runs)',
    () => {
      fc.assert(
        fc.property(
          differentUuidPairArb,
          ([currentUserId, recordAuthorId]) => {
            // Admin can delete even non-owned records
            return isDeleteVisible('admin', currentUserId, recordAuthorId) === true
          }
        ),
        { numRuns: 100 }
      )
    }
  )

  // -------------------------------------------------------------------------
  // null author_id: editor/author cannot delete records with no author
  // -------------------------------------------------------------------------

  it(
    'Property 4: editor/author cannot delete records with null author_id (fast-check, 100 runs)',
    () => {
      fc.assert(
        fc.property(
          restrictedRoleArb,
          uuidArb,
          (role, currentUserId) => {
            // null author_id means no owner — restricted roles cannot delete
            return isDeleteVisible(role, currentUserId, null) === false
          }
        ),
        { numRuns: 100 }
      )
    }
  )

  // -------------------------------------------------------------------------
  // member role never sees delete
  // -------------------------------------------------------------------------

  it(
    'Property 4: member role never sees delete control regardless of ownership (fast-check, 100 runs)',
    () => {
      fc.assert(
        fc.property(
          uuidArb,
          fc.option(uuidArb, { nil: null }),
          (currentUserId, recordAuthorId) => {
            return isDeleteVisible('member', currentUserId, recordAuthorId) === false
          }
        ),
        { numRuns: 100 }
      )
    }
  )

  // -------------------------------------------------------------------------
  // Example-based assertions for clarity
  // -------------------------------------------------------------------------

  it('editor cannot delete a post owned by a different user', () => {
    expect(
      isDeleteVisible('editor', 'user-aaa', 'user-bbb')
    ).toBe(false)
  })

  it('author cannot delete a post owned by a different user', () => {
    expect(
      isDeleteVisible('author', 'user-aaa', 'user-bbb')
    ).toBe(false)
  })

  it('editor can delete their own post', () => {
    expect(
      isDeleteVisible('editor', 'user-aaa', 'user-aaa')
    ).toBe(true)
  })

  it('author can delete their own post', () => {
    expect(
      isDeleteVisible('author', 'user-aaa', 'user-aaa')
    ).toBe(true)
  })

  it('admin can delete any post regardless of author', () => {
    expect(isDeleteVisible('admin', 'user-aaa', 'user-bbb')).toBe(true)
    expect(isDeleteVisible('admin', 'user-aaa', 'user-aaa')).toBe(true)
    expect(isDeleteVisible('admin', 'user-aaa', null)).toBe(true)
  })

  it('member cannot delete any post', () => {
    expect(isDeleteVisible('member', 'user-aaa', 'user-aaa')).toBe(false)
    expect(isDeleteVisible('member', 'user-aaa', 'user-bbb')).toBe(false)
    expect(isDeleteVisible('member', 'user-aaa', null)).toBe(false)
  })

  it('editor cannot delete a post with null author_id', () => {
    expect(isDeleteVisible('editor', 'user-aaa', null)).toBe(false)
  })

  it('author cannot delete a post with null author_id', () => {
    expect(isDeleteVisible('author', 'user-aaa', null)).toBe(false)
  })
})
