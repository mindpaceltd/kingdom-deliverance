'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { revalidateSitemap } from '@/lib/seo/revalidate-sitemap'
import { indexOnPublish } from '@/lib/seo/google-indexing'
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
  // CMS fields
  status: 'draft' | 'published' | 'scheduled' | 'trash' | 'archived'
  meta_title?: string
  meta_description?: string
  focus_keyword?: string
  seo_score?: number
  scheduled_at?: string
}

function revalidateMinistryPaths() {
  revalidatePath('/ministries')
  revalidatePath('/ministries/[slug]')
  revalidatePath('/admin/ministries')
  revalidatePath('/')
  revalidateSitemap()
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
      status: data.status,
      published_at: data.status === 'published' ? new Date().toISOString() : null,
      scheduled_at: data.status === 'scheduled' ? (data.scheduled_at ?? null) : null,
      meta_title: data.meta_title ?? null,
      meta_description: data.meta_description ?? null,
      focus_keyword: data.focus_keyword ?? null,
      seo_score: data.seo_score ?? 0,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[createMinistry]', error.message)
    if (error.code === '23505') return { error: 'Slug already exists' }
    return { error: error.message }
  }

  revalidateMinistryPaths()
  if (data.status === 'published' && data.is_active) {
    await indexOnPublish('ministry', data.slug, data.status, {
      is_active: data.is_active,
    })
  }
  return { success: true, id: ministry.id }
}

export async function updateMinistry(
  id: string,
  data: MinistryData
): Promise<{ success: true } | { error: string }> {
  const result = await requireRoles(ROLES.MANAGE_STRUCTURE)
  if ('error' in result) return result

  const supabase = createClient()
  
  const { data: existing } = await supabase
    .from('ministries')
    .select('published_at')
    .eq('id', id)
    .single()

  const published_at =
    data.status === 'published' && (!existing || !existing.published_at)
      ? new Date().toISOString()
      : existing?.published_at

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
      status: data.status,
      published_at,
      scheduled_at: data.status === 'scheduled' ? (data.scheduled_at ?? null) : null,
      meta_title: data.meta_title ?? null,
      meta_description: data.meta_description ?? null,
      focus_keyword: data.focus_keyword ?? null,
      seo_score: data.seo_score ?? 0,
    })
    .eq('id', id)

  if (error) {
    console.error('[updateMinistry]', error.message)
    if (error.code === '23505') return { error: 'Slug already exists' }
    return { error: error.message }
  }

  revalidateMinistryPaths()
  if (data.status === 'published') {
    await indexOnPublish('ministry', data.slug, data.status, {
      is_active: data.is_active,
    })
  }
  return { success: true }
}

export async function trashMinistry(id: string): Promise<{ success: true } | { error: string }> {
  const result = await requireRoles(ROLES.MANAGE_STRUCTURE)
  if ('error' in result) return result
  const supabase = createClient()
  const { error } = await supabase
    .from('ministries')
    .update({ status: 'trash', deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidateMinistryPaths()
  return { success: true }
}

export async function restoreMinistry(id: string): Promise<{ success: true } | { error: string }> {
  const result = await requireRoles(ROLES.MANAGE_STRUCTURE)
  if ('error' in result) return result
  const supabase = createClient()
  const { error } = await supabase
    .from('ministries')
    .update({ status: 'draft', deleted_at: null })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidateMinistryPaths()
  return { success: true }
}

export async function duplicateMinistry(id: string): Promise<{ success: true; id: string } | { error: string }> {
  const result = await requireRoles(ROLES.MANAGE_STRUCTURE)
  if ('error' in result) return result
  const supabase = createClient()
  const { data: source } = await supabase.from('ministries').select('*').eq('id', id).single()
  if (!source) return { error: 'Source ministry not found' }

  const { data: newMinistry, error: insertError } = await supabase
    .from('ministries')
    .insert({
      name: `Copy of ${source.name}`,
      slug: `${source.slug}-copy-${Date.now().toString(36)}`,
      description: source.description,
      content: source.content,
      leader: source.leader,
      meeting_time: source.meeting_time,
      image_url: source.image_url,
      icon: source.icon,
      display_order: source.display_order + 1,
      is_active: false,
      status: 'draft',
      meta_title: source.meta_title,
      meta_description: source.meta_description,
      focus_keyword: source.focus_keyword,
      seo_score: source.seo_score,
      published_at: null,
      scheduled_at: null,
      deleted_at: null,
      views: 0,
    })
    .select('id')
    .single()

  if (insertError) return { error: insertError.message }
  revalidateMinistryPaths()
  return { success: true, id: newMinistry.id }
}

export async function deleteMinistry(
  id: string
): Promise<{ success: true } | { error: string }> {
  const result = await requireRoles(ROLES.ADMIN)
  if ('error' in result) return result
  const supabase = createClient()
  const { error } = await supabase.from('ministries').delete().eq('id', id)
  if (error) {
    console.error('[deleteMinistry]', error.message)
    return { error: error.message }
  }
  revalidateMinistryPaths()
  return { success: true }
}

export async function checkSlugAvailability(
  slug: string,
  excludeId?: string
): Promise<{ available: boolean }> {
  const supabase = createClient()
  let query = supabase.from('ministries').select('id').eq('slug', slug)
  if (excludeId) query = query.neq('id', excludeId)
  const { data } = await query.maybeSingle()
  return { available: !data }
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
