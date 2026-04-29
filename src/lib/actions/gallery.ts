'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireRoles, ROLES } from '@/lib/authz'

function revalidateGalleryPaths() {
  revalidatePath('/gallery')
  revalidatePath('/admin/gallery')
}

export interface CreateGalleryItemPayload {
  image_url: string
  title?: string
  description?: string
  album: string
  display_order: number
}

export async function createGalleryItem(
  payload: CreateGalleryItemPayload
): Promise<{ success: true; id: string } | { error: string }> {
  const result = await requireRoles(ROLES.CONTENT)
  if ('error' in result) return result
  const supabase = createClient()
  const { data, error } = await supabase
    .from('gallery')
    .insert({
      image_url: payload.image_url,
      title: payload.title ?? null,
      description: payload.description ?? null,
      album: payload.album,
      display_order: payload.display_order,
    })
    .select('id')
    .single()
  if (error) {
    console.error('[createGalleryItem]', error.message)
    return { error: error.message }
  }
  revalidateGalleryPaths()
  return { success: true, id: data.id }
}

export async function deleteGalleryItem(
  id: string
): Promise<{ success: true } | { error: string }> {
  const result = await requireRoles(ROLES.CONTENT)
  if ('error' in result) return result
  const supabase = createClient()
  const { error } = await supabase.from('gallery').delete().eq('id', id)
  if (error) {
    console.error('[deleteGalleryItem]', error.message)
    return { error: error.message }
  }
  revalidateGalleryPaths()
  return { success: true }
}

export async function reorderGallery(
  items: { id: string; display_order: number }[]
): Promise<{ success: true } | { error: string }> {
  const result = await requireRoles(ROLES.CONTENT)
  if ('error' in result) return result
  const supabase = createClient()
  for (const item of items) {
    const { error } = await supabase
      .from('gallery')
      .update({ display_order: item.display_order })
      .eq('id', item.id)
    if (error) {
      console.error('[reorderGallery]', error.message)
      return { error: error.message }
    }
  }
  revalidateGalleryPaths()
  return { success: true }
}
