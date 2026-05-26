'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { indexOnPublish } from '@/lib/seo/google-indexing'
import { requireRoles } from '@/lib/authz'
import { ROLES } from '@/lib/roles'
import type { SermonData } from '@/lib/types'

// ---------------------------------------------------------------------------
// Revalidate all sermon-related paths after any mutation
// ---------------------------------------------------------------------------

function revalidateSermonPaths() {
  revalidatePath('/sermons')
  revalidatePath('/sermons/[slug]')
  revalidatePath('/')
}

function suggestAlternativeSlug(slug: string): string {
  return `${slug}-${Date.now().toString(36)}`
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
      featured_image_alt: data.featured_image_alt ?? null,
      preacher: data.preacher,
      series: data.series ?? null,
      series_id: data.series_id ?? null,
      date: data.date,
      duration_minutes: data.duration_minutes ?? null,
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
    console.error('[createSermon]', error.message)
    if (error.code === '23505') {
       return { error: `Slug already exists. Suggested: ${suggestAlternativeSlug(data.slug)}` }
    }
    return { error: error.message }
  }

  revalidateSermonPaths()
  if (data.status === 'published') {
    await indexOnPublish('sermon', data.slug, data.status)
  }
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

  // Fetch the existing sermon to check published_at
  const { data: existing, error: fetchError } = await supabase
    .from('sermons')
    .select('published_at')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    return { error: fetchError?.message ?? 'Sermon not found' }
  }

  // Only set published_at on the first publish transition
  const published_at =
    data.status === 'published' && !existing.published_at
      ? new Date().toISOString()
      : existing.published_at

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
      featured_image_alt: data.featured_image_alt ?? null,
      preacher: data.preacher,
      series: data.series ?? null,
      series_id: data.series_id ?? null,
      date: data.date,
      duration_minutes: data.duration_minutes ?? null,
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
    console.error('[updateSermon]', error.message)
    if (error.code === '23505') {
       return { error: `Slug already exists. Suggested: ${suggestAlternativeSlug(data.slug)}` }
    }
    return { error: error.message }
  }

  revalidateSermonPaths()
  if (data.status === 'published') {
    await indexOnPublish('sermon', data.slug, data.status)
  }
  return { success: true }
}

// ---------------------------------------------------------------------------
// trashSermon
// Soft-deletes a sermon by setting status = 'trash' and deleted_at = NOW().
// ---------------------------------------------------------------------------

export async function trashSermon(
  id: string
): Promise<{ success: true } | { error: string }> {
  const result = await requireRoles(ROLES.CONTENT)
  if ('error' in result) return result

  const supabase = createClient()

  const { error } = await supabase
    .from('sermons')
    .update({ status: 'trash', deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('[trashSermon]', error.message)
    return { error: error.message }
  }

  revalidateSermonPaths()
  return { success: true }
}

// ---------------------------------------------------------------------------
// restoreSermon
// Restores a trashed sermon by setting status = 'draft' and deleted_at = NULL.
// ---------------------------------------------------------------------------

export async function restoreSermon(
  id: string
): Promise<{ success: true } | { error: string }> {
  const result = await requireRoles(ROLES.CONTENT)
  if ('error' in result) return result

  const supabase = createClient()

  const { error } = await supabase
    .from('sermons')
    .update({ status: 'draft', deleted_at: null })
    .eq('id', id)

  if (error) {
    console.error('[restoreSermon]', error.message)
    return { error: error.message }
  }

  revalidateSermonPaths()
  return { success: true }
}

// ---------------------------------------------------------------------------
// duplicateSermon
// ---------------------------------------------------------------------------

export async function duplicateSermon(
  id: string
): Promise<{ success: true; id: string } | { error: string }> {
  const result = await requireRoles(ROLES.CONTENT)
  if ('error' in result) return result

  const supabase = createClient()

  const { data: source, error: fetchError } = await supabase
    .from('sermons')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !source) {
    return { error: fetchError?.message ?? 'Sermon not found' }
  }

  const newTitle = source.title.startsWith('Copy of ')
    ? source.title
    : `Copy of ${source.title}`

  const baseSlug = source.slug
  let candidateSlug = `${baseSlug}-copy`
  let attempt = 1

  while (attempt <= 99) {
    const { data: existing } = await supabase
      .from('sermons')
      .select('id')
      .eq('slug', candidateSlug)
      .maybeSingle()

    if (!existing) break

    attempt++
    candidateSlug = `${baseSlug}-copy-${attempt}`
  }

  const { data: newSermon, error: insertError } = await supabase
    .from('sermons')
    .insert({
      title: newTitle,
      slug: candidateSlug,
      description: source.description,
      content: source.content,
      video_url: source.video_url,
      audio_url: source.audio_url,
      thumbnail_url: source.thumbnail_url,
      featured_image_alt: source.featured_image_alt,
      preacher: source.preacher,
      series: source.series,
      series_id: source.series_id,
      date: source.date,
      duration_minutes: source.duration_minutes,
      status: 'draft',
      meta_title: source.meta_title,
      meta_description: source.meta_description,
      focus_keyword: source.focus_keyword,
      seo_score: source.seo_score ?? 0,
      published_at: null,
      scheduled_at: null,
      deleted_at: null,
      views: 0,
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('[duplicateSermon]', insertError.message)
    return { error: insertError.message }
  }

  revalidateSermonPaths()
  return { success: true, id: newSermon.id }
}

// ---------------------------------------------------------------------------
// deleteSermon
// Hard-deletes a sermon.
// Requires `admin` role.
// ---------------------------------------------------------------------------

export async function deleteSermon(
  id: string
): Promise<{ success: true } | { error: string }> {
  const result = await requireRoles(ROLES.ADMIN)
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

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// checkSlugAvailability
// ---------------------------------------------------------------------------

export async function checkSlugAvailability(
  slug: string,
  excludeId?: string
): Promise<{ available: boolean }> {
  const supabase = createClient()
  let query = supabase.from('sermons').select('id').eq('slug', slug)
  if (excludeId) {
    query = query.neq('id', excludeId)
  }
  const { data } = await query.maybeSingle()
  return { available: !data }
}
