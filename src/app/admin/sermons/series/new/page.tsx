import { createClient } from '@/lib/supabase/server'
import { SeriesEditorClient } from '@/components/admin/sermons/series-editor-client'

export default async function NewSeriesPage() {
  return <SeriesEditorClient />
}
