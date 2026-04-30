'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/actions/auth-helpers'
import { requireAdmin } from '@/lib/authz'

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

// ---------------------------------------------------------------------------
// createMediaRecord
// Inserts a new row into the `media` table.
// Requires at minimum the `author` role.
// ---------------------------------------------------------------------------

export async function createMediaRecord(
  payload: CreateMediaPayload
): Promise<{ success: true; id: string } | { error: string }> {
  // Use the same auth pattern as posts actions
  const auth = await requireRole('author')
  if ('error' in auth) {
    console.error('[createMediaRecord] auth failed:', auth.error)
    return auth
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('media')
    .insert({
      filename: payload.filename,
      url: payload.url,
      type: payload.type,
      mime_type: payload.mime_type,
      size_bytes: payload.size_bytes,
      bucket: payload.bucket ?? 'media',
      uploaded_by: auth.userId,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[createMediaRecord] db error:', error.message, error.code)
    return { error: error.message }
  }

  revalidatePath('/admin/media')
  return { success: true, id: data.id }
}

// ---------------------------------------------------------------------------
// deleteMedia
// Removes the file from Supabase Storage and deletes the `media` row.
// Requires `admin` role.
// ---------------------------------------------------------------------------

export async function deleteMedia(
  id: string
): Promise<{ success: true } | { error: string }> {
  const result = await requireAdmin()
  if ('error' in result) return result

  const supabase = createClient()

  // 1. Fetch the media record to get url and bucket
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

  // 2. Extract the storage path from the public URL
  //    URL format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
  const marker = `/storage/v1/object/public/${bucket}/`
  const markerIndex = media.url.indexOf(marker)

  if (markerIndex !== -1) {
    const storagePath = media.url.slice(markerIndex + marker.length)

    // 3. Remove the file from Storage
    const { error: storageError } = await supabase.storage
      .from(bucket)
      .remove([storagePath])

    if (storageError) {
      console.error('[deleteMedia] storage remove error', storageError.message)
      // Continue to delete the DB row even if storage removal fails
      // (the file may have already been deleted or the URL may be external)
    }
  }

  // 4. Delete the media row from the database
  const { error: deleteError } = await supabase
    .from('media')
    .delete()
    .eq('id', id)

  if (deleteError) {
    console.error('[deleteMedia] db delete error', deleteError.message)
    return { error: deleteError.message }
  }

  // 5. Revalidate the media admin page
  revalidatePath('/admin/media')
  return { success: true }
}
