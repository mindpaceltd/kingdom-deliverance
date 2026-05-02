import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SermonEditorClient } from '@/components/admin/sermons/sermon-editor-client'
import type { Sermon, SermonSeries } from '@/lib/types'

export default async function EditSermonPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  
  const { data: sermon } = await supabase
    .from('sermons')
    .select('*, sermon_series(*)')
    .eq('id', params.id)
    .single()

  if (!sermon) {
    notFound()
  }

  const { data: allSeries } = await supabase
    .from('sermon_series')
    .select('*')
    .order('name')

  return (
    <SermonEditorClient 
      sermon={sermon as Sermon} 
      allSeries={(allSeries as SermonSeries[]) || []} 
    />
  )
}
