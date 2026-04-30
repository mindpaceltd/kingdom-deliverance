import { notFound } from 'next'
import { createClient } from '@/lib/supabase/server'
import { SeriesEditorClient } from '@/components/admin/sermons/series-editor-client'
import type { SermonSeries } from '@/lib/types'

export default async function EditSeriesPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  
  const { data: series } = await supabase
    .from('sermon_series')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!series) {
    notFound()
  }

  return <SeriesEditorClient series={series as SermonSeries} />
}
