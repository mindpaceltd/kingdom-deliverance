import { createAdminClient } from '@/lib/supabase/server'
import type { KdcBaselineMetrics } from '@/lib/digital-ministry/competitor-intelligence/types'

export async function getKdcBaselineMetrics(): Promise<KdcBaselineMetrics> {
  const admin = createAdminClient()
  const since = new Date(Date.now() - 30 * 86400000).toISOString()
  const limitations: string[] = []

  const [sermons, posts, dmPosts] = await Promise.all([
    admin
      .from('sermons')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .gte('created_at', since),
    admin.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'published').gte('created_at', since),
    admin
      .from('dm_posts')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', since)
      .is('deleted_at', null),
  ])

  const sermonCount30d = sermons.count ?? 0
  const blogCount30d = posts.count ?? 0
  const dmPostCount30d = dmPosts.count ?? 0
  const total = sermonCount30d + blogCount30d + dmPostCount30d

  if (total === 0) {
    limitations.push('No published KDC content found in the last 30 days — frequency comparisons will be limited.')
  }

  const contentPerWeek = total > 0 ? Math.round((total / 30) * 7 * 10) / 10 : null
  const videoPerWeek =
    sermonCount30d > 0 ? Math.round((sermonCount30d / 30) * 7 * 10) / 10 : null

  limitations.push(
    'KDC social engagement metrics require connected social accounts — not included in baseline unless OAuth is connected.'
  )

  return {
    label: 'KDC Uganda',
    contentPerWeek,
    videoPerWeek,
    sermonCount30d,
    blogCount30d,
    dmPostCount30d,
    limitations,
  }
}
