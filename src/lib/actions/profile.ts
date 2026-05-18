'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { uploadFile } from '@/lib/services/r2-storage'

export interface UpdateProfilePayload {
  name: string
  phone?: string
  bio?: string
  avatar_url?: string
}

// ---------------------------------------------------------------------------
// updateProfile — update the current user's own profile
// ---------------------------------------------------------------------------

export async function updateProfile(
  payload: UpdateProfilePayload
): Promise<{ success: true } | { error: string }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' }

  const { error } = await supabase
    .from('profiles')
    .update({
      name: payload.name.trim(),
      phone: payload.phone?.trim() || null,
      bio: payload.bio?.trim() || null,
      avatar_url: payload.avatar_url || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    console.error('[updateProfile]', error.message)
    return { error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/profile')
  return { success: true }
}

// ---------------------------------------------------------------------------
// updatePassword — change the current user's password
// ---------------------------------------------------------------------------

export async function updatePassword(
  newPassword: string
): Promise<{ success: true } | { error: string }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) {
    console.error('[updatePassword]', error.message)
    return { error: error.message }
  }

  return { success: true }
}

// ---------------------------------------------------------------------------
// uploadAvatar — upload avatar to storage and return public URL
// (called from client, uses admin client to insert record)
// ---------------------------------------------------------------------------

export async function saveAvatarUrl(
  userId: string,
  url: string
): Promise<{ success: true } | { error: string }> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: url, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) {
    console.error('[saveAvatarUrl]', error.message)
    return { error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/profile')
  return { success: true }
}

/**
 * Handles uploading the profile picture to Cloudflare R2 securely.
 */
export async function uploadAvatarAction(
  formData: FormData
): Promise<{ success: true; url: string } | { error: string }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' }

  const file = formData.get('file') as File | null
  if (!file) return { error: 'No file provided' }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `avatars/${user.id}/avatar-${Date.now()}.${ext}`

    const r2Result = await uploadFile(path, buffer, file.type, 'avatars')
    if ('error' in r2Result) {
      return { error: r2Result.error }
    }

    // Save avatar URL to DB
    const dbResult = await saveAvatarUrl(user.id, r2Result.url)
    if ('error' in dbResult) {
      return { error: dbResult.error }
    }

    return { success: true, url: r2Result.url }
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) }
  }
}

// ---------------------------------------------------------------------------
// signOut — server-side sign out
// ---------------------------------------------------------------------------

export async function signOut(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
}
