import dynamic from 'next/dynamic'
import { PagesListSkeleton } from '@/components/admin/pages/pages-admin-skeleton'
import { ensureSystemPages } from '@/lib/actions/pages'
import { createClient } from '@/lib/supabase/server'
import { fetchPageVisitorsByPath } from '@/lib/seo/page-visitor-stats'
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
  const [{ data }, { data: auth }] = await Promise.all([
    supabase.from('pages').select('*').order('updated_at', { ascending: false }),
    supabase.auth.getUser(),
  ])

  let analyticsConnected = false
  let visitorsByPath: Record<string, number> = {}

  if (auth.user) {
    const { data: gaConfig } = await supabase
      .from('analytics_config')
      .select('property_id')
      .eq('user_id', auth.user.id)
      .maybeSingle()

    analyticsConnected = Boolean(gaConfig?.property_id)
    if (analyticsConnected) {
      visitorsByPath = await fetchPageVisitorsByPath(auth.user.id)
    }
  }

  return (
    <PagesManager
      initialPages={(data ?? []) as CmsPage[]}
      visitorsByPath={visitorsByPath}
      analyticsConnected={analyticsConnected}
    />
  )
}
