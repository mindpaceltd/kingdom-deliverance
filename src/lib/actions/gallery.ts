'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireRoles } from '@/lib/authz'
import { ROLES } from '@/lib/roles'

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

export interface UpdateGalleryItemPayload {
  title?: string | null
  description?: string | null
  album?: string
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

export async function createGalleryItemsBulk(
  urls: string[],
  album = 'General'
): Promise<{ success: true; count: number } | { error: string }> {
  const cleaned = urls.map((u) => u.trim()).filter(Boolean)
  if (cleaned.length === 0) return { error: 'No images to add' }

  const result = await requireRoles(ROLES.CONTENT)
  if ('error' in result) return result

  const supabase = createClient()
  const { data: last } = await supabase
    .from('gallery')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  let nextOrder = (last?.display_order ?? 0) + 1
  const rows = cleaned.map((image_url) => ({
    image_url,
    album,
    title: null,
    description: null,
    display_order: nextOrder++,
  }))

  const { error } = await supabase.from('gallery').insert(rows)
  if (error) {
    console.error('[createGalleryItemsBulk]', error.message)
    return { error: error.message }
  }

  revalidateGalleryPaths()
  return { success: true, count: cleaned.length }
}

export async function updateGalleryItem(
  id: string,
  payload: UpdateGalleryItemPayload
): Promise<{ success: true } | { error: string }> {
  const result = await requireRoles(ROLES.CONTENT)
  if ('error' in result) return result
  const supabase = createClient()
  const { error } = await supabase
    .from('gallery')
    .update({
      title: payload.title,
      description: payload.description,
      album: payload.album,
    })
    .eq('id', id)
  if (error) {
    console.error('[updateGalleryItem]', error.message)
    return { error: error.message }
  }
  revalidateGalleryPaths()
  return { success: true }
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
