'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/authz'
import { getDigitalMinistryKpis } from '@/lib/digital-ministry/dashboard'
import { listDmPosts } from '@/lib/digital-ministry/posts'

export type AnalyticsBundle = {
  kpis: Awaited<ReturnType<typeof getDigitalMinistryKpis>>
  series: Array<{ date: string; sermonViews: number; posts: number; comments: number }>
  platformMix: Array<{ platform: string; count: number }>
  snapshotId?: string
}

export async function getAnalyticsBundle(): Promise<AnalyticsBundle> {
  const auth = await requireStaff()
  if ('error' in auth) {
    return { kpis: await getDigitalMinistryKpis(), series: [], platformMix: [] }
  }

  const kpis = await getDigitalMinistryKpis()
  const supabase = createClient()

  // Last 14 days of site activity proxies
  const days: AnalyticsBundle['series'] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const date = d.toISOString().slice(0, 10)
    days.push({ date, sermonViews: 0, posts: 0, comments: 0 })
  }

  const from = days[0].date
  const { data: posts } = await supabase
    .from('dm_posts')
    .select('created_at, platforms, status')
    .is('deleted_at', null)
    .gte('created_at', `${from}T00:00:00Z`)

  const platformCounts = new Map<string, number>()
  for (const p of posts ?? []) {
    const day = String(p.created_at).slice(0, 10)
    const row = days.find((x) => x.date === day)
    if (row) row.posts += 1
    for (const plat of (p.platforms as string[]) ?? []) {
      platformCounts.set(plat, (platformCounts.get(plat) || 0) + 1)
    }
  }

  const { data: comments } = await supabase
    .from('dm_comments')
    .select('created_at')
    .is('deleted_at', null)
    .gte('created_at', `${from}T00:00:00Z`)

  for (const c of comments ?? []) {
    const day = String(c.created_at).slice(0, 10)
    const row = days.find((x) => x.date === day)
    if (row) row.comments += 1
  }

  // Distribute cumulative sermon views as flat daily estimate for chart (proxy)
  const dailyViews = Math.round(kpis.sermonViews / Math.max(days.length, 1))
  for (const row of days) row.sermonViews = dailyViews

  return {
    kpis,
    series: days,
    platformMix: [...platformCounts.entries()].map(([platform, count]) => ({ platform, count })),
  }
}

export async function persistAnalyticsSnapshot() {
  const auth = await requireStaff()
  if ('error' in auth) return { error: auth.error }

  const bundle = await getAnalyticsBundle()
  const admin = createAdminClient()
  const periodStart = new Date().toISOString().slice(0, 10)

  const { data, error } = await admin
    .from('dm_analytics_snapshots')
    .upsert(
      {
        period: 'daily',
        period_start: periodStart,
        source: 'aggregated',
        metrics: {
          kpis: bundle.kpis,
          series: bundle.series,
          platformMix: bundle.platformMix,
        },
      },
      { onConflict: 'period,period_start,source' }
    )
    .select('id')
    .maybeSingle()

  if (error) return { error: error.message }

  revalidatePath('/admin/digital-ministry/analytics')
  return { id: data?.id as string | undefined }
}

export async function generateDmReport(period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly') {
  const auth = await requireStaff()
  if ('error' in auth) return { error: auth.error }

  const kpis = await getDigitalMinistryKpis()
  const posts = await listDmPosts({ limit: 20 })
  const end = new Date()
  const start = new Date()
  if (period === 'daily') start.setDate(end.getDate() - 1)
  else if (period === 'weekly') start.setDate(end.getDate() - 7)
  else if (period === 'monthly') start.setMonth(end.getMonth() - 1)
  else if (period === 'quarterly') start.setMonth(end.getMonth() - 3)
  else start.setFullYear(end.getFullYear() - 1)

  const periodStart = start.toISOString().slice(0, 10)
  const periodEnd = end.toISOString().slice(0, 10)
  const title = `KDC Digital Ministry ${period} report (${periodStart} → ${periodEnd})`

  const summary = [
    `Published sermons: ${kpis.publishedSermons} (${kpis.sermonViews.toLocaleString()} views).`,
    `Blog posts: ${kpis.publishedPosts}. Connected accounts: ${kpis.connectedAccounts}.`,
    `Prayer unread: ${kpis.unreadPrayer}. Open comments: ${kpis.openComments}.`,
    `Studio drafts sampled: ${posts.filter((p) => p.status === 'draft').length}.`,
  ].join(' ')

  const csvRows = [
    ['metric', 'value'],
    ['published_sermons', String(kpis.publishedSermons)],
    ['sermon_views', String(kpis.sermonViews)],
    ['published_posts', String(kpis.publishedPosts)],
    ['connected_accounts', String(kpis.connectedAccounts)],
    ['unread_prayer', String(kpis.unreadPrayer)],
    ['open_comments', String(kpis.openComments)],
    ['testimonies', String(kpis.testimonies)],
    ['media_assets', String(kpis.mediaAssets)],
    ['growth_score', String(kpis.growthScore ?? '')],
  ]
  const csv = csvRows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('dm_reports')
    .insert({
      period,
      period_start: periodStart,
      period_end: periodEnd,
      title,
      summary,
      payload: { kpis, samplePosts: posts.slice(0, 10) },
      export_urls: { csv_inline: true },
      created_by: auth.id,
    })
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'Failed to save report' }

  revalidatePath('/admin/digital-ministry/reports')
  return { id: data.id as string, csv, title, summary }
}

export async function listDmReports(limit = 20) {
  const auth = await requireStaff()
  if ('error' in auth) return []

  const supabase = createClient()
  const { data } = await supabase
    .from('dm_reports')
    .select('id, period, period_start, period_end, title, summary, created_at, payload')
    .order('created_at', { ascending: false })
    .limit(limit)

  return data ?? []
}
