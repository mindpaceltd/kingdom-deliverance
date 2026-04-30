import { createClient } from '@/lib/supabase/server'
import { SermonEditorClient } from '@/components/admin/sermons/sermon-editor-client'
import type { SermonSeries } from '@/lib/types'

export default async function NewSermonPage() {
  const supabase = createClient()
  
  const { data: allSeries } = await supabase
    .from('sermon_series')
    .select('*')
    .order('name')

  return (
    <SermonEditorClient allSeries={(allSeries as SermonSeries[]) || []} />
  )
}
