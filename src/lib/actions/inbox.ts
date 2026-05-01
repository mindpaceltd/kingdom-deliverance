'use server'

import { createClient } from '@/lib/supabase/server'
import { requireRoles } from '@/lib/authz'
import { ROLES } from '@/lib/roles'
import { revalidatePath } from 'next/cache'

function revalidateInbox() {
  revalidatePath('/admin/inbox')
}

export async function markContactRead(
  id: string,
  isRead: boolean = true
): Promise<{ success: true } | { error: string }> {
  const result = await requireRoles(ROLES.CONTENT)
  if ('error' in result) return result

  const supabase = createClient()
  const { error } = await supabase
    .from('contact_submissions')
    .update({ is_read: isRead })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidateInbox()
  return { success: true }
}

export async function markPrayerReviewed(
  id: string,
  isReviewed: boolean = true
): Promise<{ success: true } | { error: string }> {
  const result = await requireRoles(ROLES.CONTENT)
  if ('error' in result) return result

  const supabase = createClient()
  const { error } = await supabase
    .from('prayer_requests')
    .update({ is_reviewed: isReviewed })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidateInbox()
  return { success: true }
}

export async function deleteContactSubmission(
  id: string
): Promise<{ success: true } | { error: string }> {
  const result = await requireRoles(ROLES.ADMIN)
  if ('error' in result) return result

  const supabase = createClient()
  const { error } = await supabase.from('contact_submissions').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidateInbox()
  return { success: true }
}

export async function deletePrayerRequest(
  id: string
): Promise<{ success: true } | { error: string }> {
  const result = await requireRoles(ROLES.ADMIN)
  if ('error' in result) return result

  const supabase = createClient()
  const { error } = await supabase.from('prayer_requests').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidateInbox()
  return { success: true }
}
