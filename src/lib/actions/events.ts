'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireRoles } from '@/lib/authz'
import { ROLES } from '@/lib/roles'

export interface EventData {
  title: string
  slug: string
  description?: string
  content?: string
  date: string
  end_date?: string
  location?: string
  image_url?: string
  is_featured: boolean
  registration_url?: string
  status: 'draft' | 'published' | 'scheduled' | 'trash' | 'archived' | 'upcoming' | 'ongoing' | 'past' | 'cancelled'
  meta_title?: string
  meta_description?: string
  focus_keyword?: string
  seo_score?: number
  scheduled_at?: string
}

function revalidateEventPaths() {
  revalidatePath('/events')
  revalidatePath('/events/[slug]')
  revalidatePath('/admin/events')
  revalidatePath('/')
}

export async function createEvent(
  data: EventData
): Promise<{ success: true; id: string } | { error: string }> {
  const result = await requireRoles(ROLES.CONTENT)
  if ('error' in result) return result
  const supabase = createClient()

  const { data: event, error } = await supabase
    .from('events')
    .insert({
      title: data.title,
      slug: data.slug,
      description: data.description ?? null,
      content: data.content ?? null,
      date: data.date,
      end_date: data.end_date ?? null,
      location: data.location ?? null,
      image_url: data.image_url ?? null,
      is_featured: data.is_featured,
      registration_url: data.registration_url ?? null,
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
    console.error('[createEvent]', error.message)
    if (error.code === '23505') return { error: 'Slug already exists' }
    return { error: error.message }
  }
  revalidateEventPaths()
  return { success: true, id: event.id }
}

export async function updateEvent(
  id: string,
  data: EventData
): Promise<{ success: true } | { error: string }> {
  const result = await requireRoles(ROLES.CONTENT)
  if ('error' in result) return result
  const supabase = createClient()

  const { data: existing } = await supabase
    .from('events')
    .select('published_at')
    .eq('id', id)
    .single()

  const published_at =
    data.status === 'published' && (!existing || !existing.published_at)
      ? new Date().toISOString()
      : existing?.published_at

  const { error } = await supabase
    .from('events')
    .update({
      title: data.title,
      slug: data.slug,
      description: data.description ?? null,
      content: data.content ?? null,
      date: data.date,
      end_date: data.end_date ?? null,
      location: data.location ?? null,
      image_url: data.image_url ?? null,
      is_featured: data.is_featured,
      registration_url: data.registration_url ?? null,
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
    console.error('[updateEvent]', error.message)
    if (error.code === '23505') return { error: 'Slug already exists' }
    return { error: error.message }
  }
  revalidateEventPaths()
  return { success: true }
}

export async function trashEvent(id: string): Promise<{ success: true } | { error: string }> {
  const result = await requireRoles(ROLES.CONTENT)
  if ('error' in result) return result
  const supabase = createClient()
  const { error } = await supabase
    .from('events')
    .update({ status: 'trash', deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidateEventPaths()
  return { success: true }
}

export async function restoreEvent(id: string): Promise<{ success: true } | { error: string }> {
  const result = await requireRoles(ROLES.CONTENT)
  if ('error' in result) return result
  const supabase = createClient()
  const { error } = await supabase
    .from('events')
    .update({ status: 'draft', deleted_at: null })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidateEventPaths()
  return { success: true }
}

export async function duplicateEvent(id: string): Promise<{ success: true; id: string } | { error: string }> {
  const result = await requireRoles(ROLES.CONTENT)
  if ('error' in result) return result
  const supabase = createClient()
  const { data: source } = await supabase.from('events').select('*').eq('id', id).single()
  if (!source) return { error: 'Source event not found' }

  const { data: newEvent, error: insertError } = await supabase
    .from('events')
    .insert({
      title: `Copy of ${source.title}`,
      slug: `${source.slug}-copy-${Date.now().toString(36)}`,
      description: source.description,
      content: source.content,
      date: source.date,
      end_date: source.end_date,
      location: source.location,
      image_url: source.image_url,
      is_featured: false,
      registration_url: source.registration_url,
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
  revalidateEventPaths()
  return { success: true, id: newEvent.id }
}

export async function deleteEvent(
  id: string
): Promise<{ success: true } | { error: string }> {
  const result = await requireRoles(ROLES.ADMIN)
  if ('error' in result) return result
  const supabase = createClient()
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) {
    console.error('[deleteEvent]', error.message)
    return { error: error.message }
  }
  revalidateEventPaths()
  return { success: true }
}

export async function incrementEventViews(id: string): Promise<void> {
  const supabase = createClient()
  await supabase.rpc('increment_event_views', { p_event_id: id })
}

export async function checkSlugAvailability(
  slug: string,
  excludeId?: string
): Promise<{ available: boolean }> {
  const supabase = createClient()
  let query = supabase.from('events').select('id').eq('slug', slug)
  if (excludeId) query = query.neq('id', excludeId)
  const { data } = await query.maybeSingle()
  return { available: !data }
}
