'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/authz'
import {
  buildCompetitorPlatforms,
  type CompetitorPlatformsPayload,
} from '@/lib/digital-ministry/competitor-platforms'
import type {
  MonitoringFrequency,
  OrganizationType,
} from '@/lib/digital-ministry/competitor-intelligence/types'
import { runCompetitorCapture } from '@/lib/digital-ministry/competitor-intelligence/capture-engine'
import {
  buildCompetitorStrategyReport,
  getIntelligenceDashboardData,
} from '@/lib/digital-ministry/competitor-intelligence/analysis'
import { topicRowsFromDistribution } from '@/lib/digital-ministry/competitor-intelligence/topics'
import { buildPeerGapMatrix } from '@/lib/digital-ministry/competitor-intelligence/gap-matrix'

function revalidateAll() {
  revalidatePath('/admin/digital-ministry/competitors')
}

export async function listCompetitors() {
  const auth = await requireStaff()
  if ('error' in auth) return []

  const supabase = createClient()
  const { data } = await supabase
    .from('dm_competitors')
    .select(
      'id, name, website_url, notes, platforms, country, organization_type, monitoring_frequency, last_captured_at, latest_capture_run_id, is_active, created_at, updated_at'
    )
    .is('deleted_at', null)
    .order('name')

  return data ?? []
}

export async function getCompetitorById(id: string) {
  const auth = await requireStaff()
  if ('error' in auth) return null

  const supabase = createClient()
  const { data } = await supabase
    .from('dm_competitors')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  return data
}

export async function getCompetitorDetailBundle(id: string) {
  const auth = await requireStaff()
  if ('error' in auth) return { error: auth.error as string }

  const supabase = createClient()
  const [comp, content, sources, runs, insights] = await Promise.all([
    supabase.from('dm_competitors').select('*').eq('id', id).is('deleted_at', null).maybeSingle(),
    supabase
      .from('dm_competitor_content')
      .select('*')
      .eq('competitor_id', id)
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(100),
    supabase.from('dm_competitor_sources').select('*').eq('competitor_id', id),
    supabase
      .from('dm_competitor_capture_runs')
      .select('*')
      .eq('competitor_id', id)
      .order('started_at', { ascending: false })
      .limit(10),
    supabase
      .from('dm_competitor_insights')
      .select('*')
      .eq('competitor_id', id)
      .order('generated_at', { ascending: false })
      .limit(20),
  ])

  if (!comp.data) return { error: 'Competitor not found' }

  const latestRun = runs.data?.[0] ?? null
  const topics = topicRowsFromDistribution(
    (latestRun?.topic_distribution ?? {}) as Record<string, number>
  )

  const gapMatrix = await buildPeerGapMatrix(
    id,
    comp.data.name,
    (latestRun?.topic_distribution ?? {}) as Record<string, number>
  )

  return {
    competitor: comp.data,
    content: content.data ?? [],
    sources: sources.data ?? [],
    runs: runs.data ?? [],
    insights: insights.data ?? [],
    latestRun,
    topics,
    gapMatrix,
  }
}

export async function fetchIntelligenceDashboard() {
  const auth = await requireStaff()
  if ('error' in auth) return null
  return getIntelligenceDashboardData()
}

export async function upsertCompetitor(input: {
  id?: string
  name: string
  websiteUrl?: string | null
  notes?: string | null
  country?: string | null
  organizationType?: OrganizationType | null
  monitoringFrequency?: MonitoringFrequency
  platforms?: CompetitorPlatformsPayload
}) {
  const auth = await requireStaff()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const now = new Date().toISOString()
  const platformPayload = buildCompetitorPlatforms(input.platforms ?? { urls: {}, metrics: {} })

  const payload = {
    name: input.name.trim(),
    website_url: input.websiteUrl?.trim() || input.platforms?.urls.website?.trim() || null,
    notes: input.notes?.trim() || null,
    country: input.country?.trim() || null,
    organization_type: input.organizationType ?? 'church',
    monitoring_frequency: input.monitoringFrequency ?? 'manual',
    platforms: platformPayload,
    updated_at: now,
    deleted_at: null,
    is_active: true,
    created_by: auth.id,
  }

  if (input.id) {
    const { error } = await admin.from('dm_competitors').update(payload).eq('id', input.id)
    if (error) return { error: error.message }
    revalidateAll()
    return { id: input.id }
  }

  const { data, error } = await admin.from('dm_competitors').insert(payload).select('id').single()
  if (error || !data) return { error: error?.message ?? 'Create failed' }
  revalidateAll()
  return { id: data.id as string }
}

export async function deleteCompetitor(id: string) {
  const auth = await requireStaff()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from('dm_competitors')
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidateAll()
  return { success: true }
}

/** Full intelligence capture — multi-source ingestion + AI analysis */
export async function captureCompetitorIntelligence(competitorId: string) {
  const auth = await requireStaff()
  if ('error' in auth) return { error: auth.error }

  try {
    const admin = createAdminClient()
    const result = await runCompetitorCapture(admin, competitorId, { discover: true })
    revalidateAll()
    revalidatePath(`/admin/digital-ministry/competitors/${competitorId}`)
    return result
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Capture failed' }
  }
}

export async function captureAllCompetitorsIntelligence() {
  const auth = await requireStaff()
  if ('error' in auth) return { error: auth.error }

  const list = await listCompetitors()
  const results: Array<{ name: string; ok: boolean; error?: string }> = []

  for (const c of list.slice(0, 8)) {
    const r = await captureCompetitorIntelligence(c.id)
    if ('error' in r && r.error) results.push({ name: c.name, ok: false, error: r.error })
    else results.push({ name: c.name, ok: true })
  }

  return { results, captured: results.filter((r) => r.ok).length, total: results.length }
}

export async function generateCompetitorStrategyReport() {
  const auth = await requireStaff()
  if ('error' in auth) return { error: auth.error }

  const result = await buildCompetitorStrategyReport(auth.id)
  if ('error' in result) return result
  revalidateAll()
  return result
}

/** @deprecated use captureCompetitorIntelligence */
export async function captureCompetitorSnapshot(competitorId: string) {
  return captureCompetitorIntelligence(competitorId)
}

/** @deprecated use captureCompetitorIntelligence */
export async function captureAllCompetitorSnapshots(competitorId: string) {
  return captureCompetitorIntelligence(competitorId)
}

/** @deprecated use generateCompetitorStrategyReport */
export async function compareCompetitorsWithAi() {
  const r = await generateCompetitorStrategyReport()
  if ('error' in r) return r
  return {
    data: {
      theyDoBetter: r.data.kdcWeaknesses,
      kdcDoesBetter: r.data.kdcStrengths,
      opportunities: r.data.recommendedActions,
    },
  }
}

export async function listCompetitorSnapshots(competitorId: string, limit = 10) {
  const auth = await requireStaff()
  if ('error' in auth) return []

  const supabase = createClient()
  const { data } = await supabase
    .from('dm_competitor_capture_runs')
    .select('*')
    .eq('competitor_id', competitorId)
    .order('started_at', { ascending: false })
    .limit(limit)

  return data ?? []
}
