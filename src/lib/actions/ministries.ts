'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireRoles } from '@/lib/authz'
import { ROLES } from '@/lib/roles'

export interface MinistryData {
  name: string
  slug: string
  description?: string
  content?: string
  leader?: string
  meeting_time?: string
  image_url?: string
  icon?: string
  display_order: number
  is_active: boolean
}

function revalidateMinistryPaths() {
  revalidatePath('/ministries')
  revalidatePath('/ministries/[slug]')
}

export async function createMinistry(
  data: MinistryData
): Promise<{ success: true; id: string } | { error: string }> {
  const result = await requireRoles(ROLES.MANAGE_STRUCTURE)
  if ('error' in result) return result

  const supabase = createClient()
  const { data: ministry, error } = await supabase
    .from('ministries')
    .insert({
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      content: data.content ?? null,
      leader: data.leader ?? null,
      meeting_time: data.meeting_time ?? null,
      image_url: data.image_url ?? null,
      icon: data.icon ?? null,
      display_order: data.display_order,
      is_active: data.is_active,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[createMinistry]', error.message)
    if (error.code === '23505') return { error: 'Slug already exists' }
    return { error: error.message }
  }

  revalidateMinistryPaths()
  return { success: true, id: ministry.id }
}

export async function updateMinistry(
  id: string,
  data: MinistryData
): Promise<{ success: true } | { error: string }> {
  const result = await requireRoles(ROLES.MANAGE_STRUCTURE)
  if ('error' in result) return result

  const supabase = createClient()
  const { error } = await supabase
    .from('ministries')
    .update({
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      content: data.content ?? null,
      leader: data.leader ?? null,
      meeting_time: data.meeting_time ?? null,
      image_url: data.image_url ?? null,
      icon: data.icon ?? null,
      display_order: data.display_order,
      is_active: data.is_active,
    })
    .eq('id', id)

  if (error) {
    console.error('[updateMinistry]', error.message)
    if (error.code === '23505') return { error: 'Slug already exists' }
    return { error: error.message }
  }

  revalidateMinistryPaths()
  return { success: true }
}

export async function reorderMinistries(
  items: { id: string; display_order: number }[]
): Promise<{ success: true } | { error: string }> {
  const result = await requireRoles(ROLES.MANAGE_STRUCTURE)
  if ('error' in result) return result

  const supabase = createClient()

  for (const item of items) {
    const { error } = await supabase
      .from('ministries')
      .update({ display_order: item.display_order })
      .eq('id', item.id)

    if (error) {
      console.error('[reorderMinistries]', error.message)
      return { error: error.message }
    }
  }

  revalidateMinistryPaths()
  return { success: true }
}
