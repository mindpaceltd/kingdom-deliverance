'use server'

import { createClient } from '@/lib/supabase/server'
import { requireRoles } from '@/lib/authz'
import { ROLES } from '@/lib/roles'

export async function markContactRead(
  id: string
): Promise<{ success: true } | { error: string }> {
  const result = await requireRoles(ROLES.CONTENT)
  if ('error' in result) return result

  const supabase = createClient()
  const { error } = await supabase
    .from('contact_submissions')
    .update({ is_read: true })
    .eq('id', id)

  if (error) {
    console.error('[markContactRead]', error.message)
    return { error: error.message }
  }

  return { success: true }
}

export async function markPrayerReviewed(
  id: string
): Promise<{ success: true } | { error: string }> {
  const result = await requireRoles(ROLES.CONTENT)
  if ('error' in result) return result

  const supabase = createClient()
  const { error } = await supabase
    .from('prayer_requests')
    .update({ is_reviewed: true })
    .eq('id', id)

  if (error) {
    console.error('[markPrayerReviewed]', error.message)
    return { error: error.message }
  }

  return { success: true }
}
