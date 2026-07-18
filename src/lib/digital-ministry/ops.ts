'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/authz'
import { generateGeminiJson } from '@/lib/digital-ministry/gemini'

export async function listCampaigns() {
  const auth = await requireStaff()
  if ('error' in auth) return []

  const supabase = createClient()
  const { data } = await supabase
    .from('dm_campaigns')
    .select('id, name, description, status, start_date, end_date, goals, created_at, updated_at')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  return data ?? []
}

export async function upsertCampaign(input: {
  id?: string
  name: string
  description?: string
  status?: string
  startDate?: string | null
  endDate?: string | null
}) {
  const auth = await requireStaff()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const payload = {
    name: input.name.trim(),
    description: input.description?.trim() || null,
    status: input.status || 'draft',
    start_date: input.startDate || null,
    end_date: input.endDate || null,
    updated_at: new Date().toISOString(),
    deleted_at: null,
    created_by: auth.id,
  }

  if (input.id) {
    const { error } = await admin.from('dm_campaigns').update(payload).eq('id', input.id)
    if (error) return { error: error.message }
    revalidatePath('/admin/digital-ministry/campaigns')
    return { id: input.id }
  }

  const { data, error } = await admin.from('dm_campaigns').insert(payload).select('id').single()
  if (error || !data) return { error: error?.message ?? 'Failed' }
  revalidatePath('/admin/digital-ministry/campaigns')
  return { id: data.id as string }
}

export async function archiveCampaign(id: string) {
  const auth = await requireStaff()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from('dm_campaigns')
    .update({
      status: 'archived',
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/digital-ministry/campaigns')
  return { success: true }
}

export async function listSeoAudits(limit = 20) {
  const auth = await requireStaff()
  if ('error' in auth) return []

  const supabase = createClient()
  const { data } = await supabase
    .from('dm_seo_audits')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  return data ?? []
}

export async function runSeoAudit(targetUrl: string, targetType?: string) {
  const auth = await requireStaff()
  if ('error' in auth) return { error: auth.error }

  const url = targetUrl.trim()
  if (!url.startsWith('http')) return { error: 'Enter a full URL (https://...)' }

  let html = ''
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 12000)
    const res = await fetch(url, {
      headers: { 'User-Agent': 'KDC-SEO-Audit/1.0' },
      signal: controller.signal,
    })
    clearTimeout(timer)
    html = await res.text()
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Fetch failed' }
  }

  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, ' ').trim() || ''
  const metaDesc =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i)?.[1] || ''
  const h1Count = (html.match(/<h1\b/gi) || []).length
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i)?.[1] || ''
  const hasOg = /property=["']og:title["']/i.test(html)

  const findings: Array<{ id: string; severity: string; message: string }> = []
  let score = 100
  if (!title) {
    findings.push({ id: 'title', severity: 'high', message: 'Missing <title>' })
    score -= 20
  } else if (title.length < 30 || title.length > 65) {
    findings.push({
      id: 'title_len',
      severity: 'medium',
      message: `Title length ${title.length} (aim 50–60)`,
    })
    score -= 10
  }
  if (!metaDesc) {
    findings.push({ id: 'meta', severity: 'high', message: 'Missing meta description' })
    score -= 20
  } else if (metaDesc.length < 120 || metaDesc.length > 165) {
    findings.push({
      id: 'meta_len',
      severity: 'medium',
      message: `Meta description length ${metaDesc.length} (aim 150–160)`,
    })
    score -= 8
  }
  if (h1Count !== 1) {
    findings.push({ id: 'h1', severity: 'medium', message: `Found ${h1Count} H1 tags (want 1)` })
    score -= 10
  }
  if (!canonical) {
    findings.push({ id: 'canonical', severity: 'low', message: 'No canonical link' })
    score -= 5
  }
  if (!hasOg) {
    findings.push({ id: 'og', severity: 'low', message: 'Missing Open Graph title' })
    score -= 5
  }

  const recommendations = findings.map((f) => `Fix: ${f.message}`)

  // Optional AI polish
  let aiExtra: string[] = []
  const ai = await generateGeminiJson<{ recommendations: string[] }>({
    prompt: `SEO audit for KDC Uganda page ${url}. Title="${title}". Meta="${metaDesc}". Findings=${JSON.stringify(findings)}. Return JSON {"recommendations":["..."]}`,
    agent: 'seo_audit',
    userId: auth.id,
    inputType: 'url',
  })
  if (!('error' in ai) && Array.isArray(ai.data.recommendations)) {
    aiExtra = ai.data.recommendations.slice(0, 5)
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('dm_seo_audits')
    .insert({
      target_url: url,
      target_type: targetType || 'page',
      score: Math.max(0, score),
      findings,
      recommendations: [...recommendations, ...aiExtra],
      created_by: auth.id,
    })
    .select('id, score')
    .single()

  if (error || !data) return { error: error?.message ?? 'Save failed' }

  revalidatePath('/admin/digital-ministry/seo')
  return { id: data.id as string, score: data.score as number, findings }
}

export async function getDmSettings() {
  const auth = await requireStaff()
  if ('error' in auth) return {}

  const supabase = createClient()
  const { data } = await supabase.from('dm_settings').select('key, value')
  const map: Record<string, unknown> = {}
  for (const row of data ?? []) map[row.key] = row.value
  return map
}

export async function setDmSetting(key: string, value: unknown) {
  const auth = await requireStaff()
  if ('error' in auth) return { error: auth.error }
  // settings are admin-only in RLS — use admin client for staff media managers
  const admin = createAdminClient()
  const { error } = await admin.from('dm_settings').upsert(
    { key, value, updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  )
  if (error) return { error: error.message }
  revalidatePath('/admin/digital-ministry/settings')
  return { success: true }
}

export async function getConnectionHealth() {
  const auth = await requireStaff()
  if ('error' in auth) return null

  return {
    google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    meta: Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET),
    gemini: Boolean(process.env.GEMINI_API_KEY),
    tokenEncryption: Boolean(
      process.env.DM_TOKEN_ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
    ),
  }
}
