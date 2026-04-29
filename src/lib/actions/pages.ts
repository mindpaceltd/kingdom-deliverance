'use server'

import { revalidatePath } from 'next/cache'
import { requireRoles, ROLES } from '@/lib/authz'
import { createClient } from '@/lib/supabase/server'

export interface CmsPagePayload {
  title: string
  slug: string
  content_json: Record<string, unknown>
  status: 'draft' | 'published'
}

function revalidatePagePaths(slug?: string) {
  revalidatePath('/admin/pages')
  if (slug) {
    revalidatePath(`/${slug}`)
  }
  revalidatePath('/')
}

export async function createPage(
  payload: CmsPagePayload
): Promise<{ success: true; id: string } | { error: string }> {
  const auth = await requireRoles(ROLES.MANAGE_STRUCTURE)
  if ('error' in auth) return auth

  const supabase = createClient()
  const { data, error } = await supabase
    .from('pages')
    .insert(payload)
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return { error: 'Slug already exists' }
    return { error: error.message }
  }

  revalidatePagePaths(payload.slug)
  return { success: true, id: data.id }
}

export async function updatePage(
  id: string,
  payload: CmsPagePayload
): Promise<{ success: true } | { error: string }> {
  const auth = await requireRoles(ROLES.MANAGE_STRUCTURE)
  if ('error' in auth) return auth

  const supabase = createClient()
  const { error } = await supabase.from('pages').update(payload).eq('id', id)

  if (error) {
    if (error.code === '23505') return { error: 'Slug already exists' }
    return { error: error.message }
  }

  revalidatePagePaths(payload.slug)
  return { success: true }
}

export async function deletePage(id: string): Promise<{ success: true } | { error: string }> {
  const auth = await requireRoles(ROLES.MANAGE_STRUCTURE)
  if ('error' in auth) return auth

  const supabase = createClient()
  const { data: existing } = await supabase.from('pages').select('slug').eq('id', id).single()
  const { error } = await supabase.from('pages').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePagePaths(existing?.slug)
  return { success: true }
}
