import { createClient } from '@/lib/supabase/server'
import { MinistriesManager } from '@/components/admin/ministries/ministries-manager'
import type { Ministry } from '@/lib/types'

export default async function AdminMinistriesPage() {
  const supabase = createClient()

  const { data: ministries } = await supabase
    .from('ministries')
    .select('*')
    .order('display_order', { ascending: true })

  return <MinistriesManager initialMinistries={(ministries as Ministry[]) ?? []} />
}
