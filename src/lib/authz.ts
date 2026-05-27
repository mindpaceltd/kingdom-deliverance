'use server'

import { createClient } from '@/lib/supabase/server'
import { ROLES } from '@/lib/roles'
import type { Profile, UserRole } from '@/lib/types'

export type AuthzResult = Profile | { error: string }

export async function requireRoles(allowedRoles: readonly UserRole[]): Promise<AuthzResult> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthenticated' }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  if (!profile || !allowedRoles.includes(profile.role as UserRole)) {
    return { error: 'Forbidden' }
  }

  return profile as Profile
}

export async function requireAdmin(): Promise<AuthzResult> {
  return requireRoles(ROLES.ADMIN)
}

/** Any user who can access the admin panel (admin, editor, author). */
export async function requireStaff(): Promise<AuthzResult> {
  return requireRoles(ROLES.CONTENT)
}
