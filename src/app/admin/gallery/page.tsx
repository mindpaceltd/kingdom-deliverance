import { createClient } from '@/lib/supabase/server'
import { GalleryManager } from '@/components/admin/gallery/gallery-manager'
import type { GalleryItem } from '@/lib/types'

export default async function AdminGalleryPage() {
  const supabase = createClient()

  const { data: items } = await supabase
    .from('gallery')
    .select('*')
    .order('display_order', { ascending: true })

  return <GalleryManager initialItems={(items as GalleryItem[]) ?? []} />
}
