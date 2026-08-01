import { createAdminClient } from '@/lib/supabase/server'
import { generateGeminiJson } from '@/lib/digital-ministry/gemini'
import { getKdcBaselineMetrics } from '@/lib/digital-ministry/competitor-intelligence/kdc-baseline'
import { buildContentGapMatrix } from '@/lib/digital-ministry/competitor-intelligence/gap-matrix'
import { topicRowsFromDistribution } from '@/lib/digital-ministry/competitor-intelligence/topics'
import type {
  ContentGapItem,
  StrategyReportPayload,
} from '@/lib/digital-ministry/competitor-intelligence/types'

export async function buildCompetitorStrategyReport(userId?: string | null): Promise<
  { data: StrategyReportPayload } | { error: string }
> {
  const admin = createAdminClient()
  const kdc = await getKdcBaselineMetrics()

  const { data: competitors } = await admin
    .from('dm_competitors')
    .select('id, name, last_captured_at, latest_capture_run_id')
    .is('deleted_at', null)
    .order('name')

  if (!competitors?.length) return { error: 'Add at least one competitor first' }

  const peerSummaries: Array<{
    name: string
    contentCount: number
    videoCount: number
    websitePosts: number
    topics: Array<{ topic: string; count: number; share: number }>
    postingFrequency: number | null
    limitations: string[]
    lastCaptured: string | null
  }> = []

  const allLimitations = [...kdc.limitations]

  for (const c of competitors.slice(0, 8)) {
    const { data: run } = c.latest_capture_run_id
      ? await admin
          .from('dm_competitor_capture_runs')
          .select('*')
          .eq('id', c.latest_capture_run_id)
          .maybeSingle()
      : { data: null }

    if (!run) {
      peerSummaries.push({
        name: c.name,
        contentCount: 0,
        videoCount: 0,
        websitePosts: 0,
        topics: [],
        postingFrequency: null,
        limitations: ['No capture run yet — run Capture first'],
        lastCaptured: null,
      })
      continue
    }

    const topics = topicRowsFromDistribution((run.topic_distribution ?? {}) as Record<string, number>)
    const lim = Array.isArray(run.data_limitations) ? (run.data_limitations as string[]) : []
    allLimitations.push(...lim)

    peerSummaries.push({
      name: c.name,
      contentCount: run.content_count ?? 0,
      videoCount: run.video_count ?? 0,
      websitePosts: run.website_posts ?? 0,
      topics: topics.slice(0, 8),
      postingFrequency: run.activity_score != null ? Number(run.activity_score) : null,
      limitations: lim,
      lastCaptured: run.completed_at,
    })
  }

  const prompt = `You are generating a Competitor Intelligence strategy report for Kingdom Deliverance Centre (KDC) Uganda digital ministry.

CRITICAL RULES:
- NEVER invent growth percentages, follower counts, or engagement rates not in the data below.
- If data is missing, say "unavailable" and explain why.
- Base all comparisons on actual captured content counts and topics only.
- KDC baseline is from KDC's own CMS (sermons, blog, dm_posts) — not social APIs unless stated.

KDC baseline (last 30 days, verified):
${JSON.stringify(kdc, null, 2)}

Peer summaries (from latest capture runs only):
${JSON.stringify(peerSummaries, null, 2)}

Return ONLY JSON:
{
  "executiveSummary": "2-3 sentences, no fake stats",
  "biggestCompetitorMovement": {"name": "...", "detail": "based on capture data only"} or null,
  "biggestKdcOpportunity": "...",
  "recommendedActions": ["5 specific actions"],
  "comparisonMatrix": [
    {"metric": "Content pieces captured", "kdc": "${kdc.sermonCount30d + kdc.blogCount30d + kdc.dmPostCount30d} (30d CMS)", "competitors": {"PeerName": "N captured"}}
  ],
  "contentGaps": [
    {"priority": "high|medium|emerging", "title": "...", "description": "...", "recommendation": "...", "evidence": "cite topic counts or content types from data"}
  ],
  "kdcStrengths": ["..."],
  "kdcWeaknesses": ["..."]
}`

  const result = await generateGeminiJson<Omit<StrategyReportPayload, 'dataLimitations' | 'generatedAt'>>({
    prompt,
    agent: 'competitor_strategy_report',
    userId,
    inputType: 'competitors',
  })

  if ('error' in result) return { error: result.error }

  const gapMatrix = await buildContentGapMatrix()

  const payload: StrategyReportPayload = {
    ...result.data,
    contentGapMatrix: gapMatrix,
    dataLimitations: [...new Set(allLimitations)],
    generatedAt: new Date().toISOString(),
  }

  const { data: saved, error: saveError } = await admin
    .from('dm_competitor_strategy_reports')
    .insert({
      summary: payload.executiveSummary,
      payload,
      created_by: userId ?? null,
    })
    .select('id')
    .single()

  if (saveError) return { error: saveError.message }

  payload.reportId = saved?.id as string

  await admin
    .from('dm_competitor_strategy_reports')
    .update({ payload })
    .eq('id', saved!.id)

  for (const gap of payload.contentGaps.slice(0, 12)) {
    await admin.from('dm_competitor_insights').insert({
      competitor_id: null,
      insight_type: 'content_gap',
      title: gap.title,
      description: gap.description,
      priority: gap.priority,
      evidence: { recommendation: gap.recommendation, evidence: gap.evidence },
    })
  }

  return { data: payload }
}

export async function getIntelligenceDashboardData() {
  const admin = createAdminClient()

  const [{ data: competitors }, { data: content }, { data: insights }, { data: runs }] = await Promise.all([
    admin.from('dm_competitors').select('id, name, last_captured_at, monitoring_frequency, latest_capture_run_id').is('deleted_at', null),
    admin.from('dm_competitor_content').select('id, competitor_id, topic, platform, content_type'),
    admin.from('dm_competitor_insights').select('id, title, priority, insight_type, generated_at').order('generated_at', { ascending: false }).limit(20),
    admin.from('dm_competitor_capture_runs').select('competitor_id, content_count, activity_score, topic_distribution').order('started_at', { ascending: false }).limit(50),
  ])

  const compList = competitors ?? []
  const contentList = content ?? []

  const topicTotals: Record<string, number> = {}
  for (const row of contentList) {
    const t = row.topic || 'General'
    topicTotals[t] = (topicTotals[t] || 0) + 1
  }

  const activityByCompetitor: Record<string, number> = {}
  for (const r of runs ?? []) {
    if (!activityByCompetitor[r.competitor_id]) {
      activityByCompetitor[r.competitor_id] = r.content_count ?? 0
    }
  }

  const { data: sources } = await admin.from('dm_competitor_sources').select('id, discovery_status')

  let gapMatrix: Awaited<ReturnType<typeof buildContentGapMatrix>> | null = null
  try {
    gapMatrix = await buildContentGapMatrix()
  } catch (err) {
    console.error('[competitor-intelligence] gap matrix failed:', err)
  }

  return {
    trackedPeers: compList.length,
    activeSources: (sources ?? []).filter((s) => s.discovery_status === 'connected').length,
    contentFound: contentList.length,
    opportunities: (insights ?? []).filter((i) => i.insight_type === 'content_gap').length,
    topTopics: topicRowsFromDistribution(topicTotals).slice(0, 8),
    gapMatrix,
    activityByCompetitor: compList.map((c) => ({
      id: c.id,
      name: c.name,
      contentCount: activityByCompetitor[c.id] ?? 0,
      lastCaptured: c.last_captured_at,
      monitoringFrequency: c.monitoring_frequency,
    })),
    recentInsights: insights ?? [],
  }
}
