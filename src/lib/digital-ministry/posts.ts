'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/authz'
import { tryDecryptSecret } from '@/lib/digital-ministry/tokens'
import { metaConfigured, META_GRAPH_BASE } from '@/lib/meta/oauth'
import type {
  DmAiTone,
  DmPlatform,
  DmPost,
  DmPostPublication,
  DmPostStatus,
  DmPublicationStatus,
} from '@/lib/digital-ministry/types'
import { DM_STUDIO_PLATFORMS } from '@/lib/digital-ministry/types'

function stripHtmlForPublish(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function revalidateStudio(id?: string) {
  revalidatePath('/admin/digital-ministry/studio')
  revalidatePath('/admin/digital-ministry/calendar')
  revalidatePath('/admin/digital-ministry')
  if (id) revalidatePath(`/admin/digital-ministry/studio/${id}`)
}

export type DmPostInput = {
  title?: string | null
  body?: string | null
  bodyMarkdown?: string | null
  platforms?: string[]
  aiTone?: string | null
  scheduledAt?: string | null
  status?: DmPostStatus
  sermonId?: string | null
  mediaIds?: string[]
  aiMetadata?: Record<string, unknown>
}

function publishSupportFor(platform: string) {
  return DM_STUDIO_PLATFORMS.find((p) => p.id === platform)?.publishSupport ?? 'manual'
}

export async function listDmPosts(opts?: {
  status?: DmPostStatus | 'all'
  limit?: number
}): Promise<DmPost[]> {
  const auth = await requireStaff()
  if ('error' in auth) return []

  const supabase = createClient()
  let query = supabase
    .from('dm_posts')
    .select(
      'id, title, body, body_markdown, status, platforms, media_ids, campaign_id, sermon_id, post_id, scheduled_at, published_at, ai_tone, ai_metadata, created_by, created_at, updated_at'
    )
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(opts?.limit ?? 50)

  if (opts?.status && opts.status !== 'all') {
    query = query.eq('status', opts.status)
  }

  const { data, error } = await query
  if (error) {
    console.error('listDmPosts', error)
    return []
  }
  return (data ?? []) as DmPost[]
}

export async function getDmPost(id: string): Promise<{
  post: DmPost | null
  publications: DmPostPublication[]
}> {
  const auth = await requireStaff()
  if ('error' in auth) return { post: null, publications: [] }

  const supabase = createClient()
  const { data: post } = await supabase
    .from('dm_posts')
    .select(
      'id, title, body, body_markdown, status, platforms, media_ids, campaign_id, sermon_id, post_id, scheduled_at, published_at, ai_tone, ai_metadata, created_by, created_at, updated_at'
    )
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!post) return { post: null, publications: [] }

  const { data: pubs } = await supabase
    .from('dm_post_publications')
    .select(
      'id, dm_post_id, social_account_id, platform, status, external_id, external_url, error_message, published_at, metrics'
    )
    .eq('dm_post_id', id)
    .order('platform')

  return {
    post: post as DmPost,
    publications: (pubs ?? []) as DmPostPublication[],
  }
}

async function syncPublicationRows(
  admin: ReturnType<typeof createAdminClient>,
  dmPostId: string,
  platforms: string[]
) {
  const { data: existing } = await admin
    .from('dm_post_publications')
    .select('id, platform, status')
    .eq('dm_post_id', dmPostId)

  const keep = new Set(platforms)
  const have = new Map((existing ?? []).map((r) => [r.platform as string, r]))

  for (const platform of platforms) {
    if (have.has(platform)) continue
    const support = publishSupportFor(platform)
    await admin.from('dm_post_publications').insert({
      dm_post_id: dmPostId,
      platform,
      status: support === 'manual' || support === 'limited' ? 'manual_required' : 'pending',
    })
  }

  for (const [platform, row] of have) {
    if (keep.has(platform)) continue
    if (row.status === 'published') continue
    await admin.from('dm_post_publications').delete().eq('id', row.id)
  }
}

async function upsertCalendarForPost(
  admin: ReturnType<typeof createAdminClient>,
  params: {
    dmPostId: string
    title: string
    scheduledAt: string
    createdBy: string
  }
) {
  const d = new Date(params.scheduledAt)
  if (Number.isNaN(d.getTime())) return

  const entryDate = d.toISOString().slice(0, 10)
  const entryTime = d.toISOString().slice(11, 19)

  const { data: existing } = await admin
    .from('dm_calendar_entries')
    .select('id')
    .eq('dm_post_id', params.dmPostId)
    .is('deleted_at', null)
    .maybeSingle()

  const payload = {
    dm_post_id: params.dmPostId,
    title: params.title || 'Untitled post',
    entry_date: entryDate,
    entry_time: entryTime,
    color: '#0f766e',
    approval_status: 'approved' as const,
    created_by: params.createdBy,
    updated_at: new Date().toISOString(),
    deleted_at: null,
  }

  if (existing?.id) {
    await admin.from('dm_calendar_entries').update(payload).eq('id', existing.id)
  } else {
    await admin.from('dm_calendar_entries').insert(payload)
  }
}

export async function createDmPost(input: DmPostInput = {}) {
  const auth = await requireStaff()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const platforms = input.platforms ?? []
  const now = new Date().toISOString()

  const { data, error } = await admin
    .from('dm_posts')
    .insert({
      title: input.title?.trim() || 'Untitled draft',
      body: input.body ?? '',
      body_markdown: input.bodyMarkdown ?? input.body ?? '',
      status: input.status ?? 'draft',
      platforms,
      media_ids: input.mediaIds ?? [],
      ai_tone: input.aiTone ?? null,
      scheduled_at: input.scheduledAt ?? null,
      sermon_id: input.sermonId ?? null,
      created_by: auth.id,
      updated_at: now,
    })
    .select('id')
    .single()

  if (error || !data) {
    console.error('createDmPost', error)
    return { error: error?.message ?? 'Failed to create post' }
  }

  await syncPublicationRows(admin, data.id, platforms)

  if (input.scheduledAt && (input.status === 'scheduled' || input.scheduledAt)) {
    await upsertCalendarForPost(admin, {
      dmPostId: data.id,
      title: input.title?.trim() || 'Untitled draft',
      scheduledAt: input.scheduledAt,
      createdBy: auth.id,
    })
  }

  await admin.from('dm_audit_logs').insert({
    actor_id: auth.id,
    action: 'dm.post.create',
    entity_type: 'dm_posts',
    entity_id: data.id,
  })

  revalidateStudio(data.id)
  return { id: data.id as string }
}

export async function updateDmPost(id: string, input: DmPostInput) {
  const auth = await requireStaff()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const now = new Date().toISOString()
  const payload: Record<string, unknown> = { updated_at: now }

  if (input.title !== undefined) payload.title = input.title?.trim() || 'Untitled draft'
  if (input.body !== undefined) payload.body = input.body
  if (input.bodyMarkdown !== undefined) payload.body_markdown = input.bodyMarkdown
  else if (input.body !== undefined) payload.body_markdown = input.body
  if (input.platforms !== undefined) payload.platforms = input.platforms
  if (input.aiTone !== undefined) payload.ai_tone = input.aiTone
  if (input.scheduledAt !== undefined) payload.scheduled_at = input.scheduledAt
  if (input.status !== undefined) payload.status = input.status
  if (input.sermonId !== undefined) payload.sermon_id = input.sermonId
  if (input.mediaIds !== undefined) payload.media_ids = input.mediaIds
  if (input.aiMetadata !== undefined) {
    const { data: existing } = await admin
      .from('dm_posts')
      .select('ai_metadata')
      .eq('id', id)
      .maybeSingle()
    payload.ai_metadata = {
      ...((existing?.ai_metadata as Record<string, unknown>) ?? {}),
      ...input.aiMetadata,
    }
  }

  const { error } = await admin.from('dm_posts').update(payload).eq('id', id).is('deleted_at', null)
  if (error) return { error: error.message }

  if (input.platforms) {
    await syncPublicationRows(admin, id, input.platforms)
  }

  const scheduledAt = input.scheduledAt
  if (scheduledAt) {
    const { data: post } = await admin.from('dm_posts').select('title').eq('id', id).maybeSingle()
    await upsertCalendarForPost(admin, {
      dmPostId: id,
      title: (input.title ?? post?.title ?? 'Scheduled post') as string,
      scheduledAt,
      createdBy: auth.id,
    })
  }

  revalidateStudio(id)
  return { success: true }
}

export async function scheduleDmPost(id: string, scheduledAt: string) {
  const auth = await requireStaff()
  if ('error' in auth) return { error: auth.error }

  const when = new Date(scheduledAt)
  if (Number.isNaN(when.getTime())) return { error: 'Invalid schedule time' }
  if (when.getTime() < Date.now() - 60_000) {
    return { error: 'Schedule time must be in the future' }
  }

  const admin = createAdminClient()
  const { data: post, error } = await admin
    .from('dm_posts')
    .update({
      status: 'scheduled',
      scheduled_at: when.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .is('deleted_at', null)
    .select('id, title, platforms')
    .maybeSingle()

  if (error || !post) return { error: error?.message ?? 'Post not found' }

  await syncPublicationRows(admin, id, (post.platforms as string[]) ?? [])
  await admin
    .from('dm_post_publications')
    .update({ status: 'queued', updated_at: new Date().toISOString() })
    .eq('dm_post_id', id)
    .in('status', ['pending', 'failed'])

  await upsertCalendarForPost(admin, {
    dmPostId: id,
    title: (post.title as string) || 'Scheduled post',
    scheduledAt: when.toISOString(),
    createdBy: auth.id,
  })

  await admin.from('dm_audit_logs').insert({
    actor_id: auth.id,
    action: 'dm.post.schedule',
    entity_type: 'dm_posts',
    entity_id: id,
    metadata: { scheduled_at: when.toISOString() },
  })

  revalidateStudio(id)
  return { success: true }
}

export async function archiveDmPost(id: string) {
  const auth = await requireStaff()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const now = new Date().toISOString()
  const { error } = await admin
    .from('dm_posts')
    .update({ status: 'archived', deleted_at: now, updated_at: now })
    .eq('id', id)

  if (error) return { error: error.message }

  await admin
    .from('dm_calendar_entries')
    .update({ deleted_at: now, updated_at: now })
    .eq('dm_post_id', id)
    .is('deleted_at', null)

  revalidateStudio()
  return { success: true }
}

async function tryPublishMetaPage(params: {
  accountId: string
  accessToken: string
  message: string
  platform: 'facebook' | 'instagram'
}): Promise<{ ok: true; externalId?: string; externalUrl?: string } | { ok: false; error: string }> {
  if (params.platform === 'instagram') {
    // Feed photo publish needs media; text-only → manual for now
    return {
      ok: false,
      error: 'Instagram Graph publish needs an image URL. Attach media or mark as manual publish.',
    }
  }

  const url = new URL(`${META_GRAPH_BASE}/${params.accountId}/feed`)
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: params.message,
      access_token: params.accessToken,
    }),
  })
  const json = (await res.json()) as { id?: string; error?: { message?: string } }
  if (!res.ok || json.error || !json.id) {
    return { ok: false, error: json.error?.message || `Meta publish failed (${res.status})` }
  }
  return {
    ok: true,
    externalId: json.id,
    externalUrl: `https://facebook.com/${json.id}`,
  }
}

/** Attempt auto-publish where APIs allow; otherwise mark manual_required. */
export async function publishDmPostNow(id: string) {
  const auth = await requireStaff()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const { data: post } = await admin
    .from('dm_posts')
    .select('id, title, body, platforms, status, ai_metadata')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!post) return { error: 'Post not found' }

  const meta = (post.ai_metadata ?? {}) as {
    platformCaptions?: Record<string, string>
    trimToLimit?: boolean
  }
  const trim = meta.trimToLimit !== false
  const { platformCaption } = await import('@/lib/digital-ministry/platform-guides')

  const platforms = (post.platforms as string[]) ?? []
  if (platforms.length === 0) return { error: 'Select at least one platform' }

  const defaultMessage = platformCaption(
    post.title || '',
    post.body || '',
    platforms[0],
    meta.platformCaptions,
    trim
  )
  if (!defaultMessage && !Object.values(meta.platformCaptions ?? {}).some((v) => v?.trim())) {
    return { error: 'Add a title or body before publishing' }
  }

  await syncPublicationRows(admin, id, platforms)
  await admin
    .from('dm_posts')
    .update({ status: 'publishing', updated_at: new Date().toISOString() })
    .eq('id', id)

  const { data: pubs } = await admin
    .from('dm_post_publications')
    .select('id, platform, status')
    .eq('dm_post_id', id)

  const { data: accounts } = await admin
    .from('dm_social_accounts')
    .select('id, platform, account_id, token_encrypted, status')
    .in('platform', platforms)
    .eq('status', 'connected')
    .is('deleted_at', null)

  const accountByPlatform = new Map<
    string,
    { id: string; platform: string; account_id: string | null; token_encrypted: string | null; status: string }
  >()
  for (const a of accounts ?? []) {
    if (!accountByPlatform.has(a.platform)) accountByPlatform.set(a.platform, a)
  }

  let anyPublished = false
  let anyFailed = false

  for (const pub of pubs ?? []) {
    const platform = pub.platform as DmPlatform
    const support = publishSupportFor(platform)
    const account = accountByPlatform.get(platform)
    const now = new Date().toISOString()

    if (platform === 'facebook' && metaConfigured() && account?.account_id && account.token_encrypted) {
      const token = tryDecryptSecret(account.token_encrypted)
      if (token && !String(account.account_id).startsWith('no-pages:')) {
        const message = platformCaption(
          post.title || '',
          post.body || '',
          'facebook',
          meta.platformCaptions,
          trim
        )
        const result = await tryPublishMetaPage({
          accountId: account.account_id,
          accessToken: token,
          message,
          platform: 'facebook',
        })
        if (result.ok) {
          anyPublished = true
          await admin
            .from('dm_post_publications')
            .update({
              status: 'published' as DmPublicationStatus,
              social_account_id: account.id,
              external_id: result.externalId ?? null,
              external_url: result.externalUrl ?? null,
              error_message: null,
              published_at: now,
              updated_at: now,
            })
            .eq('id', pub.id)
          continue
        }
        anyFailed = true
        await admin
          .from('dm_post_publications')
          .update({
            status: 'failed',
            social_account_id: account.id,
            error_message: result.error,
            updated_at: now,
          })
          .eq('id', pub.id)
        continue
      }
    }

    if (support === 'full' && (platform === 'facebook' || platform === 'instagram') && !metaConfigured()) {
      await admin
        .from('dm_post_publications')
        .update({
          status: 'manual_required',
          error_message: 'Meta credentials not configured — copy and publish manually.',
          updated_at: now,
        })
        .eq('id', pub.id)
      continue
    }

    await admin
      .from('dm_post_publications')
      .update({
        status: 'manual_required',
        social_account_id: account?.id ?? null,
        error_message:
          support === 'manual'
            ? 'Manual publish required for this platform.'
            : 'Copy and post manually, then Mark published.',
        updated_at: now,
      })
      .eq('id', pub.id)
  }

  const finalStatus: DmPostStatus = anyFailed && !anyPublished ? 'failed' : 'published'
  await admin
    .from('dm_posts')
    .update({
      status: finalStatus,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  await admin.from('dm_audit_logs').insert({
    actor_id: auth.id,
    action: 'dm.post.publish',
    entity_type: 'dm_posts',
    entity_id: id,
    metadata: { anyPublished, anyFailed },
  })

  revalidateStudio(id)
  return { success: true, status: finalStatus }
}

export async function markPublicationManualDone(publicationId: string, externalUrl?: string) {
  const auth = await requireStaff()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const now = new Date().toISOString()
  const { data, error } = await admin
    .from('dm_post_publications')
    .update({
      status: 'published',
      external_url: externalUrl?.trim() || null,
      error_message: null,
      published_at: now,
      updated_at: now,
    })
    .eq('id', publicationId)
    .select('dm_post_id')
    .maybeSingle()

  if (error || !data) return { error: error?.message ?? 'Publication not found' }

  revalidateStudio(data.dm_post_id as string)
  return { success: true }
}

export async function listCalendarMonth(year: number, month: number) {
  const auth = await requireStaff()
  if ('error' in auth) return []

  const start = new Date(Date.UTC(year, month - 1, 1))
  const end = new Date(Date.UTC(year, month, 0))
  const startStr = start.toISOString().slice(0, 10)
  const endStr = end.toISOString().slice(0, 10)

  const supabase = createClient()
  const { data, error } = await supabase
    .from('dm_calendar_entries')
    .select('id, dm_post_id, title, entry_date, entry_time, color, approval_status')
    .is('deleted_at', null)
    .gte('entry_date', startStr)
    .lte('entry_date', endStr)
    .order('entry_date')
    .order('entry_time')

  if (error) {
    console.error('listCalendarMonth', error)
    return []
  }
  return data ?? []
}

export async function rewriteDmPostWithAi(params: {
  title: string
  body: string
  tone: DmAiTone
  platforms: string[]
}): Promise<{ title: string; body: string; hashtags: string[] } | { error: string }> {
  const auth = await requireStaff()
  if ('error' in auth) return { error: auth.error }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return { error: 'GEMINI_API_KEY is not configured' }

  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  const genAI = new GoogleGenerativeAI(apiKey)
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite']

  const platformList = params.platforms.length
    ? params.platforms.join(', ')
    : 'Facebook, Instagram'
  const prompt = `You are the digital ministry copywriter for Kingdom Deliverance Centre (KDC) Uganda.

Rewrite the following social media draft in a "${params.tone}" tone for platforms: ${platformList}.
Keep Scripture faithful (prefer NIV/ESV/NLT). Be clear, warm, and Uganda/Africa rooted with global outreach.

Title: ${params.title || '(none)'}
Body:
${params.body || '(empty — invent a short faith-filled post about Sunday worship invitation)'}

Return ONLY raw JSON:
{
  "title": "short hook title",
  "body": "platform-ready post text with line breaks",
  "hashtags": ["tag1", "tag2", "tag3"]
}`

  let lastError = 'AI rewrite failed'
  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName })
      const result = await model.generateContent(prompt)
      let text = result.response.text().trim()
      if (text.startsWith('```')) {
        text = text.replace(/^```json?\s*/i, '').replace(/\s*```$/, '').trim()
      }
      const parsed = JSON.parse(text) as {
        title?: string
        body?: string
        hashtags?: string[]
      }
      const title = (parsed.title || params.title || '').trim()
      let body = (parsed.body || '').trim()
      const hashtags = Array.isArray(parsed.hashtags) ? parsed.hashtags.slice(0, 8) : []
      if (hashtags.length && !body.includes('#')) {
        body = `${body}\n\n${hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ')}`
      }

      const admin = createAdminClient()
      await admin.from('dm_ai_generations').insert({
        agent: 'studio_rewrite',
        input_type: 'dm_post_draft',
        prompt: prompt.slice(0, 4000),
        output: { title, body, hashtags, tone: params.tone },
        model: modelName,
        created_by: auth.id,
      })

      return { title, body, hashtags }
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'AI rewrite failed'
      console.warn(`rewriteDmPostWithAi ${modelName}:`, lastError)
    }
  }

  return { error: lastError }
}

export async function generateDmDraftFromBrief(params: {
  brief: string
  agent: string
  tone?: DmAiTone
  platforms?: string[]
}): Promise<{ id: string } | { error: string }> {
  const auth = await requireStaff()
  if ('error' in auth) return { error: auth.error }

  const rewritten = await rewriteDmPostWithAi({
    title: '',
    body: params.brief,
    tone: params.tone ?? 'evangelism',
    platforms: params.platforms ?? ['facebook', 'instagram'],
  })

  if ('error' in rewritten) return rewritten

  return createDmPost({
    title: rewritten.title,
    body: rewritten.body,
    platforms: params.platforms ?? ['facebook', 'instagram'],
    aiTone: params.tone ?? 'evangelism',
    status: 'draft',
  })
}
