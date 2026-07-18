'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/authz'
import { generateGeminiJson } from '@/lib/digital-ministry/gemini'
import { getDigitalMinistryKpis } from '@/lib/digital-ministry/dashboard'

export type GrowthReportRow = {
  id: string
  report_date: string
  period: string
  growth_score: number | null
  summary: string | null
  reasons: unknown
  recommendations: unknown
  expected_growth_pct: number | null
  metrics_context: Record<string, unknown>
  created_at: string
}

export async function listOpenAiTasks(limit = 20) {
  const auth = await requireStaff()
  if ('error' in auth) return []

  const supabase = createClient()
  const { data } = await supabase
    .from('dm_ai_tasks')
    .select('id, title, description, priority, difficulty, expected_impact, status, created_at')
    .is('deleted_at', null)
    .in('status', ['open', 'in_progress'])
    .order('priority', { ascending: false })
    .limit(limit)

  return data ?? []
}

export async function updateAiTaskStatus(
  id: string,
  status: 'open' | 'in_progress' | 'done' | 'dismissed'
) {
  const auth = await requireStaff()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from('dm_ai_tasks')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/digital-ministry/growth-coach')
  return { success: true }
}

export async function listGrowthReports(limit = 14): Promise<GrowthReportRow[]> {
  const auth = await requireStaff()
  if ('error' in auth) return []

  const supabase = createClient()
  const { data } = await supabase
    .from('dm_growth_reports')
    .select('*')
    .order('report_date', { ascending: false })
    .limit(limit)

  return (data ?? []) as GrowthReportRow[]
}

export async function generateGrowthReport(period: 'daily' | 'weekly' | 'monthly' = 'daily') {
  const auth = await requireStaff()
  if ('error' in auth) return { error: auth.error }

  const kpis = await getDigitalMinistryKpis()
  const today = new Date().toISOString().slice(0, 10)

  const prompt = `You are the Growth Coach for Kingdom Deliverance Centre (KDC) Uganda digital ministry.

Given these live KPIs, write today's ${period} growth report. Be specific to KDC — no generic SaaS advice.

KPIs JSON:
${JSON.stringify(kpis, null, 2)}

Return ONLY raw JSON:
{
  "growth_score": 0-100 integer,
  "summary": "2-4 sentences",
  "reasons": ["why the score is this"],
  "recommendations": [{"text": "...", "impact": "high|medium|low", "effort": "easy|medium|hard"}],
  "expected_growth_pct": number,
  "tasks": [{"title": "...", "description": "...", "priority": 0-100, "difficulty": "easy|medium|hard", "expected_impact": "..."}]
}`

  const result = await generateGeminiJson<{
    growth_score: number
    summary: string
    reasons: string[]
    recommendations: Array<{ text: string; impact?: string; effort?: string } | string>
    expected_growth_pct: number
    tasks?: Array<{
      title: string
      description?: string
      priority?: number
      difficulty?: string
      expected_impact?: string
    }>
  }>({
    prompt,
    agent: 'growth_coach',
    userId: auth.id,
    inputType: 'kpis',
  })

  if ('error' in result) return result

  const data = result.data
  const score = Math.max(0, Math.min(100, Math.round(Number(data.growth_score) || 70)))
  const admin = createAdminClient()

  const { error } = await admin.from('dm_growth_reports').upsert(
    {
      report_date: today,
      period,
      growth_score: score,
      summary: data.summary || '',
      reasons: data.reasons ?? [],
      recommendations: data.recommendations ?? [],
      expected_growth_pct: data.expected_growth_pct ?? null,
      metrics_context: kpis as unknown as Record<string, unknown>,
    },
    { onConflict: 'report_date,period' }
  )

  if (error) return { error: error.message }

  // Seed AI tasks from coach
  for (const t of (data.tasks ?? []).slice(0, 6)) {
    if (!t.title) continue
    await admin.from('dm_ai_tasks').insert({
      title: t.title,
      description: t.description ?? null,
      category: 'growth_coach',
      priority: Math.max(0, Math.min(100, t.priority ?? 50)),
      expected_impact: t.expected_impact ?? null,
      difficulty: ['easy', 'medium', 'hard'].includes(t.difficulty || '')
        ? t.difficulty
        : 'medium',
      status: 'open',
    })
  }

  revalidatePath('/admin/digital-ministry/growth-coach')
  revalidatePath('/admin/digital-ministry')
  return { success: true, growth_score: score, summary: data.summary }
}

/** Cron-friendly entry (service role path). Call from /api/digital-ministry/cron/growth */
export async function runGrowthCoachCron() {
  const admin = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)

  const { count: prayerRequests } = await admin
    .from('prayer_requests')
    .select('id', { count: 'exact', head: true })
  const { count: publishedPosts } = await admin
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')
  const { count: publishedSermons } = await admin
    .from('sermons')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')
  const { count: connectedAccounts } = await admin
    .from('dm_social_accounts')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'connected')
    .is('deleted_at', null)
  const { count: openComments } = await admin
    .from('dm_comments')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'new')
    .is('deleted_at', null)

  let sermonViews = 0
  const { data: sermons } = await admin.from('sermons').select('views').eq('status', 'published')
  sermonViews = (sermons ?? []).reduce((s, r) => s + (r.views ?? 0), 0)

  const kpis = {
    prayerRequests: prayerRequests ?? 0,
    publishedPosts: publishedPosts ?? 0,
    publishedSermons: publishedSermons ?? 0,
    connectedAccounts: connectedAccounts ?? 0,
    openComments: openComments ?? 0,
    sermonViews,
  }

  const prompt = `You are the Growth Coach for Kingdom Deliverance Centre (KDC) Uganda.
KPIs: ${JSON.stringify(kpis)}
Return ONLY JSON: {"growth_score":0-100,"summary":"...","reasons":[],"recommendations":[],"expected_growth_pct":0,"tasks":[]}`

  const result = await generateGeminiJson<{
    growth_score: number
    summary: string
    reasons: unknown
    recommendations: unknown
    expected_growth_pct: number
  }>({
    prompt,
    agent: 'growth_coach_cron',
    inputType: 'cron',
  })

  if ('error' in result) return result

  const score = Math.max(0, Math.min(100, Math.round(Number(result.data.growth_score) || 70)))
  await admin.from('dm_growth_reports').upsert(
    {
      report_date: today,
      period: 'daily',
      growth_score: score,
      summary: result.data.summary,
      reasons: result.data.reasons ?? [],
      recommendations: result.data.recommendations ?? [],
      expected_growth_pct: result.data.expected_growth_pct ?? null,
      metrics_context: kpis,
    },
    { onConflict: 'report_date,period' }
  )

  return { success: true, growth_score: score }
}
