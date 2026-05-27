'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import { requireRole } from '@/lib/actions/auth-helpers'
import { requireAdmin, requireRoles } from '@/lib/authz'
import { ROLES } from '@/lib/roles'
import { uploadFile, deleteFile, getKeyFromUrl } from '@/lib/services/r2-storage'
import {
  MEDIA_LIBRARY_PAGE_SIZE,
  MEDIA_LIBRARY_SELECT,
  type MediaLibraryFilter,
  type MediaLibraryPageResult,
} from '@/lib/media/library-query'
import type { MediaAsset } from '@/lib/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateMediaPayload {
  filename: string
  url: string
  type: 'image' | 'video' | 'audio' | 'document'
  mime_type: string
  size_bytes: number
  bucket?: string
}

export interface UpdateMediaPayload {
  filename?: string
  alt_text?: string
  caption?: string
}

// ---------------------------------------------------------------------------
// createMediaRecord
// ---------------------------------------------------------------------------

export async function createMediaRecord(
  payload: CreateMediaPayload
): Promise<{ success: true; id: string } | { error: string }> {
  try {
    let uploadedBy: string | null = null
    try {
      const auth = await requireRole('author')
      if (!('error' in auth)) {
        uploadedBy = auth.userId
      }
    } catch (e) {
      console.warn('[createMediaRecord] auth exception:', e)
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('media')
      .insert({
        filename: payload.filename,
        url: payload.url,
        type: payload.type,
        mime_type: payload.mime_type,
        size_bytes: payload.size_bytes,
        bucket: payload.bucket ?? 'media',
        uploaded_by: uploadedBy,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[createMediaRecord] db error:', error.message)
      return { error: error.message }
    }

    revalidateMediaLibraryCache()
    return { success: true, id: data.id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[createMediaRecord] unexpected error:', msg)
    return { error: `Server error: ${msg}` }
  }
}

// ---------------------------------------------------------------------------
// getMediaLibraryPage — paginated list for admin media library
// ---------------------------------------------------------------------------

function revalidateMediaLibraryCache() {
  revalidatePath('/admin/media')
  revalidateTag('media-library')
}

function escapeIlikePattern(term: string): string {
  return term.replace(/[%_\\]/g, '\\$&')
}

async function fetchMediaLibraryPageRows(
  page: number,
  pageSize: number,
  type: MediaLibraryFilter,
  search: string
): Promise<MediaLibraryPageResult | { error: string }> {
  const from = page * pageSize
  const to = from + pageSize - 1
  const q = search.trim()

  const supabase = createAdminClient()
  let query = supabase
    .from('media')
    .select(MEDIA_LIBRARY_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })

  if (type !== 'all') {
    query = query.eq('type', type)
  }

  if (q) {
    const term = escapeIlikePattern(q)
    query = query.or(
      `filename.ilike.%${term}%,alt_text.ilike.%${term}%,caption.ilike.%${term}%`
    )
  }

  const { data, error, count } = await query.range(from, to)

  if (error) {
    console.error('[fetchMediaLibraryPageRows]', error.message)
    return { error: error.message }
  }

  const total = count ?? 0
  const rows = (data ?? []) as MediaAsset[]

  return {
    data: rows,
    total,
    page,
    pageSize,
    hasMore: from + rows.length < total,
  }
}

const fetchMediaLibraryPageCached = unstable_cache(
  async (page: number, pageSize: number, type: MediaLibraryFilter) =>
    fetchMediaLibraryPageRows(page, pageSize, type, ''),
  ['media-library-page'],
  { revalidate: 60, tags: ['media-library'] }
)

export async function getMediaLibraryPage(options?: {
  page?: number
  pageSize?: number
  type?: MediaLibraryFilter
  search?: string
}): Promise<MediaLibraryPageResult | { error: string }> {
  const auth = await requireRoles(ROLES.CONTENT)
  if ('error' in auth) return auth

  const page = Math.max(0, options?.page ?? 0)
  const pageSize = options?.pageSize ?? MEDIA_LIBRARY_PAGE_SIZE
  const type = options?.type ?? 'all'
  const search = options?.search?.trim() ?? ''

  if (search) {
    return fetchMediaLibraryPageRows(page, pageSize, type, search)
  }

  return fetchMediaLibraryPageCached(page, pageSize, type)
}

// ---------------------------------------------------------------------------
// updateMedia
// Updates media metadata (alt, caption, filename).
// Requires `content` role.
// ---------------------------------------------------------------------------

export async function updateMedia(
  id: string,
  payload: UpdateMediaPayload
): Promise<{ success: true } | { error: string }> {
  const result = await requireRoles(ROLES.CONTENT)
  if ('error' in result) return result

  const supabase = createClient()
  const { error } = await supabase
    .from('media')
    .update({
      filename: payload.filename,
      alt_text: payload.alt_text,
      caption: payload.caption,
    })
    .eq('id', id)

  if (error) {
    console.error('[updateMedia] db error:', error.message)
    return { error: error.message }
  }

  revalidateMediaLibraryCache()
  return { success: true }
}

// ---------------------------------------------------------------------------
// deleteMedia
// ---------------------------------------------------------------------------

async function deleteMediaRecordById(
  supabase: ReturnType<typeof createClient>,
  id: string
): Promise<{ success: true } | { error: string }> {
  const { data: media, error: fetchError } = await supabase
    .from('media')
    .select('url, bucket')
    .eq('id', id)
    .single()

  if (fetchError || !media) {
    console.error('[deleteMedia] fetch error', fetchError?.message)
    return { error: fetchError?.message ?? 'Media record not found' }
  }

  const bucket = media.bucket ?? 'media'

  const r2Key = getKeyFromUrl(media.url)
  if (r2Key) {
    const { error: r2Error } = await deleteFile(r2Key, bucket)
    if (r2Error) {
      console.error('[deleteMedia] R2 delete error:', r2Error)
    }
  } else {
    const marker = `/storage/v1/object/public/${bucket}/`
    const markerIndex = media.url.indexOf(marker)

    if (markerIndex !== -1) {
      const storagePath = media.url.slice(markerIndex + marker.length)

      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([storagePath])

      if (storageError) {
        console.error('[deleteMedia] Supabase storage remove error:', storageError.message)
      }
    }
  }

  const { error: deleteError } = await supabase.from('media').delete().eq('id', id)

  if (deleteError) {
    console.error('[deleteMedia] db delete error', deleteError.message)
    return { error: deleteError.message }
  }

  return { success: true }
}

export async function deleteMedia(
  id: string
): Promise<{ success: true } | { error: string }> {
  const result = await requireAdmin()
  if ('error' in result) return result

  const supabase = createClient()
  const deleted = await deleteMediaRecordById(supabase, id)
  if ('error' in deleted) return deleted

  revalidateMediaLibraryCache()
  return { success: true }
}

export async function bulkDeleteMedia(
  ids: string[]
): Promise<{ success: true; deleted: number; failed: number } | { error: string }> {
  const unique = [...new Set(ids.filter(Boolean))]
  if (unique.length === 0) return { error: 'No items selected' }

  const result = await requireAdmin()
  if ('error' in result) return result

  const supabase = createClient()
  let deleted = 0
  let failed = 0

  for (const id of unique) {
    const outcome = await deleteMediaRecordById(supabase, id)
    if ('success' in outcome) deleted++
    else failed++
  }

  revalidateMediaLibraryCache()
  return { success: true, deleted, failed }
}

// ---------------------------------------------------------------------------
// uploadMediaAction
// Generic server action to upload media files to Cloudflare R2 and create a database media record.
// ---------------------------------------------------------------------------

export async function uploadMediaAction(
  formData: FormData
): Promise<{ success: true; url: string; id: string } | { error: string }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' }

  const file = formData.get('file') as File | null
  const customBucket = formData.get('bucket') as string | null
  if (!file) return { error: 'No file provided' }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const fileExt = file.name.split('.').pop()
    const uniqueName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
    
    // Determine the directory prefix based on content type or bucket
    const bucket = customBucket || 'media'
    const prefix = bucket === 'media' ? 'uploads' : 'branding'
    const path = `${prefix}/${uniqueName}`

    // Upload to Cloudflare R2
    const r2Result = await uploadFile(path, buffer, file.type)
    if ('error' in r2Result) {
      return { error: r2Result.error }
    }

    // Determine type
    let type: 'image' | 'video' | 'audio' | 'document' = 'document'
    if (file.type.startsWith('image/')) type = 'image'
    else if (file.type.startsWith('video/')) type = 'video'
    else if (file.type.startsWith('audio/')) type = 'audio'

    // Create DB media record
    const dbResult = await createMediaRecord({
      filename: file.name,
      url: r2Result.url,
      type,
      mime_type: file.type,
      size_bytes: file.size,
      bucket
    })

    if ('error' in dbResult) {
      return { error: dbResult.error }
    }

    return { success: true, url: r2Result.url, id: dbResult.id }
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) }
  }
}
