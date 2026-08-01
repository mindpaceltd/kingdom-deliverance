'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { revalidateSitemap } from '@/lib/seo/revalidate-sitemap'
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
  revalidateSitemap()
}

function suggestAlternativeSlug(slug: string): string {
  return `${slug}-${Date.now().toString(36)}`
}

function validateScheduledSermon(data: SermonData): string | null {
  if (data.status !== 'scheduled') return null
  if (!data.scheduled_at) {
    return 'Pick a publish date and time to schedule this sermon.'
  }
  const when = new Date(data.scheduled_at)
  if (Number.isNaN(when.getTime())) {
    return 'The scheduled date and time is not valid.'
  }
  if (when.getTime() <= Date.now()) {
    return 'Scheduled time must be in the future.'
  }
  return null
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

  const scheduleError = validateScheduledSermon(data)
  if (scheduleError) return { error: scheduleError }

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

  const scheduleError = validateScheduledSermon(data)
  if (scheduleError) return { error: scheduleError }

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

function duplicateSermonTitle(title: string): string {
  const trimmed = title.trim()
  if (trimmed.startsWith('Copy of ')) return trimmed
  return `Copy of ${trimmed}`
}

async function uniqueSermonSlug(
  admin: ReturnType<typeof createAdminClient>,
  baseSlug: string
): Promise<string> {
  let candidate = `${baseSlug}-copy`
  for (let attempt = 1; attempt <= 99; attempt++) {
    const { data: existing } = await admin
      .from('sermons')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle()
    if (!existing) return candidate
    candidate = `${baseSlug}-copy-${attempt}`
  }
  throw new Error('Could not generate a unique slug for the duplicate')
}

export async function duplicateSermon(
  id: string
): Promise<{ success: true; id: string } | { error: string }> {
  const result = await requireRoles(ROLES.CONTENT)
  if ('error' in result) return result

  const admin = createAdminClient()

  const { data: source, error: fetchError } = await admin
    .from('sermons')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !source) {
    return { error: fetchError?.message ?? 'Sermon not found' }
  }

  const newTitle = duplicateSermonTitle(String(source.title ?? 'Sermon'))
  let candidateSlug: string
  try {
    candidateSlug = await uniqueSermonSlug(admin, String(source.slug ?? 'sermon'))
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Slug generation failed' }
  }

  const { data: newSermon, error: insertError } = await admin
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
  revalidatePath('/admin/sermons')
  return { success: true, id: newSermon.id }
}

const SERMON_STATUSES = ['draft', 'published', 'scheduled', 'trash', 'archived'] as const
export type SermonStatus = (typeof SERMON_STATUSES)[number]

export async function bulkUpdateSermonStatus(
  ids: string[],
  status: SermonStatus
): Promise<{ success: true; updated: number } | { error: string }> {
  if (ids.length === 0) {
    return { error: 'No sermons selected.' }
  }

  if (!SERMON_STATUSES.includes(status)) {
    return { error: 'Invalid status.' }
  }

  const auth = await requireRoles(ROLES.CONTENT)
  if ('error' in auth) return auth

  const supabase = createClient()
  const now = new Date().toISOString()
  const patch: Record<string, unknown> = {
    status,
    updated_at: now,
  }

  if (status === 'published') {
    patch.published_at = now
    patch.scheduled_at = null
    patch.deleted_at = null
  }
  if (status === 'scheduled') {
    patch.deleted_at = null
  }
  if (status === 'draft') {
    patch.scheduled_at = null
    patch.deleted_at = null
  }
  if (status === 'trash') {
    patch.deleted_at = now
  }

  const { data, error } = await supabase
    .from('sermons')
    .update(patch)
    .in('id', ids)
    .select('id, slug, status')

  if (error) {
    console.error('[bulkUpdateSermonStatus]', error.message)
    return { error: error.message }
  }

  revalidateSermonPaths()
  revalidatePath('/admin/sermons')

  const rows = data ?? []
  if (status === 'published') {
    await Promise.all(
      rows.map((row) =>
        indexOnPublish('sermon', String(row.slug ?? ''), 'published')
      )
    )
  }

  return { success: true, updated: rows.length }
}

export async function duplicateSermons(
  ids: string[]
): Promise<
  | { success: true; count: number; ids: string[]; failed?: string[] }
  | { error: string; count?: number }
> {
  if (ids.length === 0) return { success: true, count: 0, ids: [] }

  const created: string[] = []
  const failed: string[] = []

  for (const id of ids) {
    const result = await duplicateSermon(id)
    if ('error' in result) {
      failed.push(result.error)
      continue
    }
    created.push(result.id)
  }

  revalidatePath('/admin/sermons')

  if (created.length === 0) {
    return { error: failed[0] ?? 'Duplication failed', count: 0 }
  }

  return {
    success: true,
    count: created.length,
    ids: created,
    ...(failed.length > 0 ? { failed } : {}),
  }
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
