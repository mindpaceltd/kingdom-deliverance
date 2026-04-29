'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireRoles, ROLES } from '@/lib/authz'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SermonData {
  title: string
  slug: string
  description?: string
  content?: string
  video_url?: string
  audio_url?: string
  thumbnail_url?: string
  preacher: string
  series?: string
  date: string
  duration_minutes?: number
  status: 'draft' | 'published'
}

// ---------------------------------------------------------------------------
// Revalidate all sermon-related paths after any mutation
// ---------------------------------------------------------------------------

function revalidateSermonPaths() {
  revalidatePath('/sermons')
  revalidatePath('/sermons/[slug]')
  revalidatePath('/')
}

// ---------------------------------------------------------------------------
// createSermon
// Inserts a new sermon. Sets `published_at` if status is `published`.
// Requires `editor` or `admin` role.
// ---------------------------------------------------------------------------

export async function createSermon(
  data: SermonData
): Promise<{ success: true; id: string } | { error: string }> {
  const result = await requireRoles(ROLES.CONTENT)
  if ('error' in result) return result

  const supabase = createClient()

  const { data: sermon, error } = await supabase
    .from('sermons')
    .insert({
      title: data.title,
      slug: data.slug,
      description: data.description ?? null,
      content: data.content ?? null,
      video_url: data.video_url ?? null,
      audio_url: data.audio_url ?? null,
      thumbnail_url: data.thumbnail_url ?? null,
      preacher: data.preacher,
      series: data.series ?? null,
      date: data.date,
      duration_minutes: data.duration_minutes ?? null,
      status: data.status,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[createSermon]', error.message)
    if (error.code === '23505') return { error: 'Slug already exists' }
    return { error: error.message }
  }

  revalidateSermonPaths()
  return { success: true, id: sermon.id }
}

// ---------------------------------------------------------------------------
// updateSermon
// Updates an existing sermon.
// Requires `editor` or `admin` role.
// ---------------------------------------------------------------------------

export async function updateSermon(
  id: string,
  data: SermonData
): Promise<{ success: true } | { error: string }> {
  const result = await requireRoles(ROLES.CONTENT)
  if ('error' in result) return result

  const supabase = createClient()

  const { error } = await supabase
    .from('sermons')
    .update({
      title: data.title,
      slug: data.slug,
      description: data.description ?? null,
      content: data.content ?? null,
      video_url: data.video_url ?? null,
      audio_url: data.audio_url ?? null,
      thumbnail_url: data.thumbnail_url ?? null,
      preacher: data.preacher,
      series: data.series ?? null,
      date: data.date,
      duration_minutes: data.duration_minutes ?? null,
      status: data.status,
    })
    .eq('id', id)

  if (error) {
    console.error('[updateSermon]', error.message)
    if (error.code === '23505') return { error: 'Slug already exists' }
    return { error: error.message }
  }

  revalidateSermonPaths()
  return { success: true }
}

// ---------------------------------------------------------------------------
// deleteSermon
// Hard-deletes a sermon (sermons have no 'archived' status).
// Requires `editor` or `admin` role.
// ---------------------------------------------------------------------------

export async function deleteSermon(
  id: string
): Promise<{ success: true } | { error: string }> {
  const result = await requireRoles(ROLES.CONTENT)
  if ('error' in result) return result

  const supabase = createClient()

  const { error } = await supabase
    .from('sermons')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[deleteSermon]', error.message)
    return { error: error.message }
  }

  revalidateSermonPaths()
  return { success: true }
}
