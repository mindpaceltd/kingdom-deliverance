import type { createAdminClient } from '@/lib/supabase/server'
import { normalizeSermonTitle } from '@/lib/dedupe/normalize'

type AdminClient = ReturnType<typeof createAdminClient>

export interface ExistingSermonMatch {
  id: string
  slug: string
  title: string
}

/** Return an existing sermon when the normalized title already exists. */
export async function findExistingSermonByTitle(
  supabase: AdminClient,
  title: string
): Promise<ExistingSermonMatch | null> {
  const normalized = normalizeSermonTitle(title)
  if (!normalized) return null

  const { data, error } = await supabase
    .from('sermons')
    .select('id, slug, title')
    .is('deleted_at', null)

  if (error) {
    console.warn('[findExistingSermonByTitle]', error.message)
    return null
  }

  for (const row of data ?? []) {
    if (normalizeSermonTitle(String(row.title ?? '')) === normalized) {
      return {
        id: String(row.id),
        slug: String(row.slug),
        title: String(row.title),
      }
    }
  }

  return null
}

/** Skip re-uploading the same file (name + size) to the media library. */
export async function findExistingMediaByFile(
  supabase: AdminClient,
  filename: string,
  sizeBytes: number
): Promise<{ id: string; url: string } | null> {
  const { data, error } = await supabase
    .from('media')
    .select('id, url')
    .eq('filename', filename)
    .eq('size_bytes', sizeBytes)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.warn('[findExistingMediaByFile]', error.message)
    return null
  }

  if (!data) return null
  return { id: String(data.id), url: String(data.url) }
}
