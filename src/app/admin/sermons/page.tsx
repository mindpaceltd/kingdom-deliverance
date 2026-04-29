import { createClient } from '@/lib/supabase/server'
import { SermonsManager } from '@/components/admin/sermons/sermons-manager'
import type { Sermon } from '@/lib/types'

export default async function AdminSermonsPage() {
  const supabase = createClient()

  const { data: sermons } = await supabase
    .from('sermons')
    .select('*')
    .order('date', { ascending: false })

  return <SermonsManager initialSermons={(sermons as Sermon[]) ?? []} />
}
