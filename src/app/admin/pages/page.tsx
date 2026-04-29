import { PagesManager } from '@/components/admin/pages/pages-manager'
import { createClient } from '@/lib/supabase/server'
import type { CmsPage } from '@/lib/types'

export default async function AdminPagesPage() {
  const supabase = createClient()
  const { data } = await supabase.from('pages').select('*').order('updated_at', { ascending: false })
  return <PagesManager initialPages={(data ?? []) as CmsPage[]} />
}
