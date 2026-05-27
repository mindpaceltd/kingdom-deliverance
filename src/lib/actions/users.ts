'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { UserRole } from '@/lib/types'
import { requireAdmin } from '@/lib/authz'

export interface AdminUserProfilePayload {
  name: string
  phone?: string
  bio?: string
}

export async function inviteUser(
  email: string,
  role: UserRole
): Promise<{ success: true } | { error: string }> {
  const result = await requireAdmin()
  if ('error' in result) return result

  const adminClient = createAdminClient()

  const { data: inviteData, error: inviteError } =
    await adminClient.auth.admin.inviteUserByEmail(email, { data: { role } })

  if (inviteError) {
    console.error('[inviteUser] invite error', inviteError.message)
    return { error: inviteError.message }
  }

  const userId = inviteData.user?.id
  if (!userId) return { error: 'Failed to retrieve user ID from invite response' }

  const { error: profileError } = await adminClient
    .from('profiles')
    .insert({ id: userId, role })

  if (profileError) {
    console.error('[inviteUser] profile insert error', profileError.message)
    return { error: profileError.message }
  }

  return { success: true }
}

export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<{ success: true } | { error: string }> {
  const result = await requireAdmin()
  if ('error' in result) return result

  if (userId === result.id) return { error: 'You cannot change your own role' }

  const supabase = createClient()
  const { error } = await supabase
    .from('profiles').update({ role }).eq('id', userId)

  if (error) {
    console.error('[updateUserRole]', error.message)
    return { error: error.message }
  }

  revalidatePath('/admin/users')
  return { success: true }
}

export async function updateUserProfileAsAdmin(
  userId: string,
  payload: AdminUserProfilePayload
): Promise<{ success: true } | { error: string }> {
  const result = await requireAdmin()
  if ('error' in result) return result

  const name = payload.name.trim()
  if (!name) return { error: 'Name is required' }

  const supabase = createClient()
  const { error } = await supabase
    .from('profiles')
    .update({
      name,
      phone: payload.phone?.trim() || null,
      bio: payload.bio?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    console.error('[updateUserProfileAsAdmin]', error.message)
    return { error: error.message }
  }

  revalidatePath('/admin/users')
  revalidatePath('/admin/profile')
  revalidatePath('/blog')
  revalidatePath('/blog/[slug]')
  return { success: true }
}

export async function deactivateUser(
  userId: string
): Promise<{ success: true } | { error: string }> {
  const result = await requireAdmin()
  if ('error' in result) return result

  if (userId === result.id) return { error: 'You cannot deactivate your own account' }

  const adminClient = createAdminClient()

  const { error: profileError } = await adminClient
    .from('profiles').delete().eq('id', userId)

  if (profileError) {
    console.error('[deactivateUser] profile delete error', profileError.message)
    return { error: profileError.message }
  }

  const { error: authError } = await adminClient.auth.admin.deleteUser(userId)

  if (authError) {
    console.error('[deactivateUser] auth delete error', authError.message)
    return { error: authError.message }
  }

  return { success: true }
}
