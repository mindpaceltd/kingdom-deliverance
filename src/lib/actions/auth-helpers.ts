'use server'

import { createClient } from '@/lib/supabase/server'

export type CmsRole = 'author' | 'editor' | 'admin'

const roleHierarchy: CmsRole[] = ['author', 'editor', 'admin']

/**
 * Verifies the caller is authenticated and has at least `minRole` in the CMS
 * role hierarchy (author < editor < admin).
 *
 * Role is read from the `profiles` table — the single source of truth.
 * Defaults to `'author'` if no profile row is found.
 *
 * Returns `{ userId, role }` on success, or `{ error }` on failure.
 *
 * Requirements: 8.12, 12.1, 12.7
 */
export async function requireRole(
  minRole: CmsRole
): Promise<{ userId: string; role: CmsRole } | { error: 'Unauthenticated' | 'Forbidden' }> {
  const supabase = createClient()

  // Use getUser() — the project's standard pattern for server-side auth checks
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthenticated' }
  }

  // Read role from profiles table (source of truth)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role: CmsRole = (profile?.role as CmsRole) ?? 'author'

  // Check if the caller's role meets the minimum required role
  if (roleHierarchy.indexOf(role) < roleHierarchy.indexOf(minRole)) {
    return { error: 'Forbidden' }
  }

  return { userId: user.id, role }
}
