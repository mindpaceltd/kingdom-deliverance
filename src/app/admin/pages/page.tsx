import dynamic from 'next/dynamic'
import { PagesListSkeleton } from '@/components/admin/pages/pages-admin-skeleton'
import { ensureSystemPages } from '@/lib/actions/pages'
import { createClient } from '@/lib/supabase/server'
import type { CmsPage } from '@/lib/types'

const PagesManager = dynamic(
  () =>
    import('@/components/admin/pages/pages-manager').then((m) => ({
      default: m.PagesManager,
    })),
  { ssr: false, loading: () => <PagesListSkeleton /> }
)

export default async function AdminPagesPage() {
  await ensureSystemPages()

  const supabase = createClient()
  const { data } = await supabase
    .from('pages')
    .select('*')
    .order('updated_at', { ascending: false })

  return <PagesManager initialPages={(data ?? []) as CmsPage[]} />
}
