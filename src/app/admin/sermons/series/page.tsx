import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { SeriesManager } from '@/components/admin/sermons/series-manager'
import type { SermonSeries } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Sermon Series | Admin',
}

export default async function SermonSeriesPage() {
  const supabase = createClient()
  
  const { data: series } = await supabase
    .from('sermon_series')
    .select('*')
    .order('name')

  return (
    <div className="container mx-auto py-8">
      <SeriesManager initialSeries={(series as SermonSeries[]) || []} />
    </div>
  )
}
