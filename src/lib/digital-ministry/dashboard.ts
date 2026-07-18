'use server'

import { createClient } from '@/lib/supabase/server'
import type { DmAiSummary, DmDashboardKpis, DmInsightCard } from '@/lib/digital-ministry/types'

async function safeCount(
  run: () => PromiseLike<{ count: number | null; error: { message: string } | null }>
): Promise<number> {
  try {
    const { count, error } = await run()
    if (error) return 0
    return count ?? 0
  } catch {
    return 0
  }
}

export async function getDigitalMinistryKpis(): Promise<DmDashboardKpis> {
  const supabase = createClient()

  const [
    prayerRequests,
    unreadPrayer,
    contactMessages,
    unreadContact,
    eventCount,
    publishedPosts,
    publishedSermons,
    mediaAssets,
    testimonies,
    connectedAccounts,
    openComments,
  ] = await Promise.all([
    safeCount(() => supabase.from('prayer_requests').select('id', { count: 'exact', head: true })),
    safeCount(() =>
      supabase.from('prayer_requests').select('id', { count: 'exact', head: true }).eq('is_reviewed', false)
    ),
    safeCount(() => supabase.from('contact_submissions').select('id', { count: 'exact', head: true })),
    safeCount(() =>
      supabase.from('contact_submissions').select('id', { count: 'exact', head: true }).eq('is_read', false)
    ),
    safeCount(() => supabase.from('events').select('id', { count: 'exact', head: true })),
    safeCount(() =>
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'published')
    ),
    safeCount(() =>
      supabase.from('sermons').select('id', { count: 'exact', head: true }).eq('status', 'published')
    ),
    safeCount(() => supabase.from('media').select('id', { count: 'exact', head: true })),
    safeCount(() =>
      supabase.from('testimonies').select('id', { count: 'exact', head: true }).eq('status', 'approved')
    ),
    safeCount(() =>
      supabase
        .from('dm_social_accounts')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null)
        .eq('status', 'connected')
    ),
    safeCount(() =>
      supabase
        .from('dm_comments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'new')
        .is('deleted_at', null)
    ),
  ])

  let growthScore: number | null = null
  try {
    const { data: growth } = await supabase
      .from('dm_growth_reports')
      .select('growth_score')
      .eq('period', 'daily')
      .order('report_date', { ascending: false })
      .limit(1)
      .maybeSingle()
    growthScore = growth?.growth_score ?? null
  } catch {
    growthScore = null
  }

  let sermonViews = 0
  try {
    const { data } = await supabase.from('sermons').select('views').eq('status', 'published')
    sermonViews = (data ?? []).reduce((sum, row) => sum + (row.views ?? 0), 0)
  } catch {
    sermonViews = 0
  }

  return {
    websiteVisitors: null,
    returningVisitors: null,
    prayerRequests,
    unreadPrayer,
    contactMessages,
    unreadContact,
    eventCount,
    sermonViews,
    publishedPosts,
    publishedSermons,
    mediaAssets,
    testimonies,
    newsletterSignups: null,
    donations: null,
    connectedAccounts,
    openComments,
    growthScore,
  }
}

export async function getDigitalMinistryInsights(kpis: DmDashboardKpis): Promise<DmInsightCard[]> {
  return [
    {
      label: 'Best content channel (site)',
      value: kpis.sermonViews > kpis.publishedPosts * 50 ? 'Sermons' : 'Blog / Posts',
      hint: 'Based on published sermon views vs post volume',
      tone: 'positive',
    },
    {
      label: 'Connected social accounts',
      value: String(kpis.connectedAccounts),
      hint: kpis.connectedAccounts === 0 ? 'Connect platforms in Social Accounts' : 'Healthy connections',
      tone: kpis.connectedAccounts === 0 ? 'warning' : 'positive',
    },
    {
      label: 'Community inbox',
      value: `${kpis.openComments} open`,
      hint: 'Comments awaiting review',
      tone: kpis.openComments > 0 ? 'warning' : 'neutral',
    },
    {
      label: 'Prayer queue',
      value: `${kpis.unreadPrayer} unread`,
      hint: `${kpis.prayerRequests} total prayer requests`,
      tone: kpis.unreadPrayer > 0 ? 'warning' : 'positive',
    },
    {
      label: 'Top sermon reach',
      value: kpis.sermonViews.toLocaleString(),
      hint: 'Cumulative views across published sermons',
      tone: 'positive',
    },
    {
      label: 'Published testimonies',
      value: String(kpis.testimonies),
      hint: 'Live on the public testimonies page',
      tone: 'neutral',
    },
    {
      label: 'Media library',
      value: String(kpis.mediaAssets),
      hint: 'Assets ready for reuse in Content Studio',
      tone: 'neutral',
    },
    {
      label: 'Growth score',
      value: kpis.growthScore != null ? `${kpis.growthScore}%` : '—',
      hint: kpis.growthScore == null ? 'Generate a report in Growth Coach' : 'Latest daily coach score',
      tone: kpis.growthScore != null && kpis.growthScore >= 70 ? 'positive' : 'neutral',
    },
  ]
}

export async function getOrBuildAiSummary(kpis: DmDashboardKpis): Promise<DmAiSummary> {
  const supabase = createClient()
  const today = new Date().toISOString().slice(0, 10)

  try {
    const { data: existing } = await supabase
      .from('dm_growth_reports')
      .select('summary, recommendations, expected_growth_pct, growth_score')
      .eq('report_date', today)
      .eq('period', 'daily')
      .maybeSingle()

    if (existing?.summary) {
      const recs = Array.isArray(existing.recommendations) ? existing.recommendations : []
      const firstRec =
        typeof recs[0] === 'string'
          ? recs[0]
          : typeof recs[0] === 'object' && recs[0] && 'text' in (recs[0] as object)
            ? String((recs[0] as { text: string }).text)
            : 'Review Content Studio and schedule two short-form clips today.'

      return {
        greeting: 'Media Team Briefing',
        body: existing.summary,
        recommendation: firstRec,
        expectedImpact:
          existing.expected_growth_pct != null
            ? `+${existing.expected_growth_pct}% expected reach`
            : 'Measurable lift when recommendations are completed',
        confidence: existing.growth_score ?? 70,
      }
    }
  } catch {
    // Table may not exist until migration is applied
  }

  const gaps: string[] = []
  if (kpis.connectedAccounts === 0) gaps.push('no social accounts are connected yet')
  if (kpis.unreadPrayer > 0) gaps.push(`${kpis.unreadPrayer} prayer requests still unread`)
  if (kpis.openComments > 0) gaps.push(`${kpis.openComments} community comments need replies`)

  const strengths: string[] = []
  if (kpis.publishedSermons > 0) {
    strengths.push(
      `${kpis.publishedSermons} published sermons (${kpis.sermonViews.toLocaleString()} views)`
    )
  }
  if (kpis.publishedPosts > 0) strengths.push(`${kpis.publishedPosts} published blog posts`)
  if (kpis.testimonies > 0) strengths.push(`${kpis.testimonies} approved testimonies`)

  const body = [
    strengths.length
      ? `Your ministry library is active with ${strengths.join(', ')}.`
      : 'Your content library is still light — publish or import sermons and posts to unlock stronger coaching.',
    gaps.length
      ? `Attention needed: ${gaps.join('; ')}.`
      : 'Operational queues look clear today.',
  ].join(' ')

  const recommendation =
    kpis.connectedAccounts === 0
      ? 'Connect YouTube and Facebook under Social Accounts, then open Sermon Studio to turn your latest sermon into Shorts and Reels.'
      : kpis.publishedSermons > 0
        ? 'Open Sermon Studio, pick the latest sermon, and generate 5 Shorts + 10 Facebook posts for this week’s calendar.'
        : 'Publish one sermon or testimony, then schedule three short posts in Content Calendar.'

  return {
    greeting: 'Good day, Media Team',
    body,
    recommendation,
    expectedImpact:
      kpis.connectedAccounts === 0
        ? '+12–18% once channels are connected'
        : '+15–21% with consistent short-form posting',
    confidence: 72,
  }
}
