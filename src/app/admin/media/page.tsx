import { createClient } from '@/lib/supabase/server'
import { MediaLibrary } from '@/components/admin/media-library'
import type { MediaAsset } from '@/lib/types'

export default async function AdminMediaPage() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('media')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[AdminMediaPage] fetch error', error.message)
  }

  const initialMedia: MediaAsset[] = data ?? []

  return <MediaLibrary initialMedia={initialMedia} />
}
