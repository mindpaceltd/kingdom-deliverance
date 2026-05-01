'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/actions/auth-helpers'
import { requireAdmin, requireRoles } from '@/lib/authz'
import { ROLES } from '@/lib/roles'

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

    revalidatePath('/admin/media')
    return { success: true, id: data.id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[createMediaRecord] unexpected error:', msg)
    return { error: `Server error: ${msg}` }
  }
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

  revalidatePath('/admin/media')
  return { success: true }
}

// ---------------------------------------------------------------------------
// deleteMedia
// ---------------------------------------------------------------------------

export async function deleteMedia(
  id: string
): Promise<{ success: true } | { error: string }> {
  const result = await requireAdmin()
  if ('error' in result) return result

  const supabase = createClient()

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

  const marker = `/storage/v1/object/public/${bucket}/`
  const markerIndex = media.url.indexOf(marker)

  if (markerIndex !== -1) {
    const storagePath = media.url.slice(markerIndex + marker.length)

    const { error: storageError } = await supabase.storage
      .from(bucket)
      .remove([storagePath])

    if (storageError) {
      console.error('[deleteMedia] storage remove error', storageError.message)
    }
  }

  const { error: deleteError } = await supabase
    .from('media')
    .delete()
    .eq('id', id)

  if (deleteError) {
    console.error('[deleteMedia] db delete error', deleteError.message)
    return { error: deleteError.message }
  }

  revalidatePath('/admin/media')
  return { success: true }
}
