'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/authz'
import { generateGeminiJson, stripHtml } from '@/lib/digital-ministry/gemini'

function revalidate() {
  revalidatePath('/admin/digital-ministry/competitors')
}

export async function listCompetitors() {
  const auth = await requireStaff()
  if ('error' in auth) return []

  const supabase = createClient()
  const { data } = await supabase
    .from('dm_competitors')
    .select('id, name, website_url, notes, platforms, is_active, created_at, updated_at')
    .is('deleted_at', null)
    .order('name')

  return data ?? []
}

export async function listCompetitorSnapshots(competitorId: string, limit = 10) {
  const auth = await requireStaff()
  if ('error' in auth) return []

  const supabase = createClient()
  const { data } = await supabase
    .from('dm_competitor_snapshots')
    .select('*')
    .eq('competitor_id', competitorId)
    .order('captured_at', { ascending: false })
    .limit(limit)

  return data ?? []
}

export async function upsertCompetitor(input: {
  id?: string
  name: string
  websiteUrl?: string | null
  notes?: string | null
  platforms?: Record<string, string>
}) {
  const auth = await requireStaff()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const now = new Date().toISOString()
  const payload = {
    name: input.name.trim(),
    website_url: input.websiteUrl?.trim() || null,
    notes: input.notes?.trim() || null,
    platforms: input.platforms ?? {},
    updated_at: now,
    deleted_at: null,
    is_active: true,
    created_by: auth.id,
  }

  if (input.id) {
    const { error } = await admin.from('dm_competitors').update(payload).eq('id', input.id)
    if (error) return { error: error.message }
    revalidate()
    return { id: input.id }
  }

  const { data, error } = await admin.from('dm_competitors').insert(payload).select('id').single()
  if (error || !data) return { error: error?.message ?? 'Create failed' }
  revalidate()
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
  revalidate()
  return { success: true }
}

async function fetchPublicRssOrPage(url: string): Promise<{
  titles: string[]
  excerpt: string
  raw: Record<string, unknown>
}> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12000)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'KDC-DigitalMinistry/1.0 (+https://kdcuganda.org)' },
      next: { revalidate: 0 },
    })
    const text = await res.text()
    const titles: string[] = []

    // RSS / Atom item titles
    const itemTitleRe = /<item[\s\S]*?<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/gi
    const atomTitleRe = /<entry[\s\S]*?<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/gi
    let m: RegExpExecArray | null
    while ((m = itemTitleRe.exec(text)) && titles.length < 12) {
      titles.push(stripHtml(m[1]).slice(0, 200))
    }
    while ((m = atomTitleRe.exec(text)) && titles.length < 12) {
      titles.push(stripHtml(m[1]).slice(0, 200))
    }

    if (!titles.length) {
      const og = text.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i)
      const h1 = text.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
      const titleTag = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
      const pageTitle = stripHtml(og?.[1] || h1?.[1] || titleTag?.[1] || url)
      if (pageTitle) titles.push(pageTitle)
    }

    const desc =
      text.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i)?.[1] ||
      text.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)/i)?.[1] ||
      ''

    return {
      titles,
      excerpt: stripHtml(desc).slice(0, 400),
      raw: { status: res.status, contentType: res.headers.get('content-type'), titleCount: titles.length },
    }
  } finally {
    clearTimeout(timer)
  }
}

/** Public RSS / homepage snapshot only — no private scraping. */
export async function captureCompetitorSnapshot(competitorId: string) {
  const auth = await requireStaff()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const { data: comp } = await admin
    .from('dm_competitors')
    .select('id, name, website_url, platforms')
    .eq('id', competitorId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!comp) return { error: 'Competitor not found' }

  const platforms = (comp.platforms ?? {}) as Record<string, string>
  const feedUrl = platforms.rss || platforms.feed || null
  const targetUrl = feedUrl || comp.website_url

  if (!targetUrl) {
    return { error: 'Add a website URL or platforms.rss feed URL first' }
  }

  let fetched
  try {
    fetched = await fetchPublicRssOrPage(targetUrl)
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Fetch failed' }
  }

  const { data: snap, error } = await admin
    .from('dm_competitor_snapshots')
    .insert({
      competitor_id: competitorId,
      platform: feedUrl ? 'rss' : 'website',
      posting_frequency: fetched.titles.length || null,
      top_content: fetched.titles.map((t) => ({ title: t })),
      raw: { ...fetched.raw, excerpt: fetched.excerpt, url: targetUrl },
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidate()
  return { id: snap.id as string, titles: fetched.titles.length }
}

export async function compareCompetitorsWithAi() {
  const auth = await requireStaff()
  if ('error' in auth) return { error: auth.error }

  const competitors = await listCompetitors()
  if (!competitors.length) return { error: 'Add at least one competitor first' }

  const admin = createAdminClient()
  const snapshots: Array<{ name: string; titles: string[] }> = []

  for (const c of competitors.slice(0, 8)) {
    const { data } = await admin
      .from('dm_competitor_snapshots')
      .select('top_content')
      .eq('competitor_id', c.id)
      .order('captured_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const titles = Array.isArray(data?.top_content)
      ? (data!.top_content as Array<{ title?: string }>).map((t) => t.title || '').filter(Boolean)
      : []
    snapshots.push({ name: c.name, titles })
  }

  const prompt = `Compare peer ministries to Kingdom Deliverance Centre (KDC) Uganda for digital content strategy.
Public titles/themes only (no scraping claims):
${JSON.stringify(snapshots, null, 2)}

Return ONLY JSON:
{
  "theyDoBetter": ["..."],
  "kdcDoesBetter": ["..."],
  "opportunities": ["actionable ideas for KDC media team"]
}`

  return generateGeminiJson<{
    theyDoBetter: string[]
    kdcDoesBetter: string[]
    opportunities: string[]
  }>({
    prompt,
    agent: 'competitor_compare',
    userId: auth.id,
    inputType: 'competitors',
  })
}
