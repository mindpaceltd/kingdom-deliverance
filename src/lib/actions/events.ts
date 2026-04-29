'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireRoles, ROLES } from '@/lib/authz'

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
  status: 'upcoming' | 'ongoing' | 'past' | 'cancelled'
}

function revalidateEventPaths() {
  revalidatePath('/events')
  revalidatePath('/events/[slug]')
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

export async function deleteEvent(
  id: string
): Promise<{ success: true } | { error: string }> {
  const result = await requireRoles(ROLES.CONTENT)
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
