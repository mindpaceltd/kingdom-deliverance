'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/authz'
import { generateGeminiJson } from '@/lib/digital-ministry/gemini'
import { tryDecryptSecret } from '@/lib/digital-ministry/tokens'
import { metaConfigured, META_GRAPH_BASE } from '@/lib/meta/oauth'

function revalidate() {
  revalidatePath('/admin/digital-ministry/community')
  revalidatePath('/admin/digital-ministry')
}

export async function listDmComments(status?: string) {
  const auth = await requireStaff()
  if ('error' in auth) return []

  const supabase = createClient()
  let q = supabase
    .from('dm_comments')
    .select(
      'id, platform, external_id, author_name, author_avatar, body, category, sentiment, status, ai_draft_reply, replied_at, created_at, metadata'
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(100)

  if (status && status !== 'all') q = q.eq('status', status)

  const { data } = await q
  return data ?? []
}

/** Pull website contact + prayer queues into the unified inbox (idempotent by external_id). */
export async function syncWebsiteCommunityInbox() {
  const auth = await requireStaff()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  let imported = 0

  const { data: contacts } = await admin
    .from('contact_submissions')
    .select('id, name, email, subject, message, created_at, is_read')
    .order('created_at', { ascending: false })
    .limit(40)

  for (const c of contacts ?? []) {
    const externalId = `contact:${c.id}`
    const { data: existing } = await admin
      .from('dm_comments')
      .select('id')
      .eq('external_id', externalId)
      .maybeSingle()
    if (existing) continue

    await admin.from('dm_comments').insert({
      platform: 'website',
      external_id: externalId,
      author_name: c.name || c.email || 'Website visitor',
      body: [c.subject, c.message].filter(Boolean).join('\n\n'),
      category: 'question',
      sentiment: 'neutral',
      status: c.is_read ? 'ignored' : 'new',
      metadata: { source: 'contact_submissions', email: c.email },
    })
    imported += 1
  }

  const { data: prayers } = await admin
    .from('prayer_requests')
    .select('id, name, request, created_at, is_reviewed')
    .order('created_at', { ascending: false })
    .limit(40)

  for (const p of prayers ?? []) {
    const externalId = `prayer:${p.id}`
    const { data: existing } = await admin
      .from('dm_comments')
      .select('id')
      .eq('external_id', externalId)
      .maybeSingle()
    if (existing) continue

    await admin.from('dm_comments').insert({
      platform: 'website',
      external_id: externalId,
      author_name: p.name || 'Prayer request',
      body: p.request || '',
      category: 'prayer',
      sentiment: 'urgent',
      status: p.is_reviewed ? 'replied' : 'new',
      metadata: { source: 'prayer_requests' },
    })
    imported += 1
  }

  revalidate()
  return { imported }
}

/** Pull recent Facebook Page comments into the community inbox (requires Meta page token). */
export async function syncFacebookCommunityInbox() {
  const auth = await requireStaff()
  if ('error' in auth) return { error: auth.error }

  if (!metaConfigured()) {
    return { error: 'Meta OAuth is not configured' }
  }

  const admin = createAdminClient()
  const { data: accounts } = await admin
    .from('dm_social_accounts')
    .select('id, account_id, account_name, token_encrypted')
    .eq('platform', 'facebook')
    .eq('status', 'connected')
    .is('deleted_at', null)
    .limit(3)

  let imported = 0
  let scanned = 0

  for (const account of accounts ?? []) {
    if (!account.account_id || String(account.account_id).startsWith('no-pages:')) continue
    const token = tryDecryptSecret(account.token_encrypted)
    if (!token) continue

    const postsUrl = new URL(`${META_GRAPH_BASE}/${account.account_id}/posts`)
    postsUrl.searchParams.set('fields', 'id,message,created_time')
    postsUrl.searchParams.set('limit', '8')
    postsUrl.searchParams.set('access_token', token)
    const postsRes = await fetch(postsUrl.toString())
    const postsJson = (await postsRes.json()) as {
      data?: Array<{ id: string; message?: string }>
      error?: { message?: string }
    }
    if (!postsRes.ok || postsJson.error) continue

    for (const post of postsJson.data ?? []) {
      scanned += 1
      const commentsUrl = new URL(`${META_GRAPH_BASE}/${post.id}/comments`)
      commentsUrl.searchParams.set('fields', 'id,from,message,created_time')
      commentsUrl.searchParams.set('filter', 'stream')
      commentsUrl.searchParams.set('limit', '25')
      commentsUrl.searchParams.set('access_token', token)
      const commentsRes = await fetch(commentsUrl.toString())
      const commentsJson = (await commentsRes.json()) as {
        data?: Array<{
          id: string
          message?: string
          from?: { name?: string; id?: string }
          created_time?: string
        }>
      }
      if (!commentsRes.ok) continue

      for (const c of commentsJson.data ?? []) {
        if (!c.message?.trim()) continue
        const externalId = `fb_comment:${c.id}`
        const { data: existing } = await admin
          .from('dm_comments')
          .select('id')
          .eq('external_id', externalId)
          .maybeSingle()
        if (existing) continue

        await admin.from('dm_comments').insert({
          platform: 'facebook',
          external_id: externalId,
          author_name: c.from?.name || 'Facebook commenter',
          body: c.message.trim(),
          category: 'question',
          sentiment: 'neutral',
          status: 'new',
          metadata: {
            source: 'facebook_page_comments',
            page_id: account.account_id,
            page_name: account.account_name,
            post_id: post.id,
            from_id: c.from?.id,
            created_time: c.created_time,
          },
        })
        imported += 1
      }
    }
  }

  revalidate()
  return { imported, scanned }
}

/** Sync website queues + Facebook Page comments in one action. */
export async function syncCommunityInbox() {
  const auth = await requireStaff()
  if ('error' in auth) return { error: auth.error }

  const web = await syncWebsiteCommunityInbox()
  if ('error' in web) return web

  let fbImported = 0
  const fb = await syncFacebookCommunityInbox()
  if (!('error' in fb)) fbImported = fb.imported

  return {
    imported: web.imported + fbImported,
    website: web.imported,
    facebook: fbImported,
    facebookError: 'error' in fb ? fb.error : undefined,
  }
}

export async function draftCommentReply(commentId: string) {
  const auth = await requireStaff()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const { data: comment } = await admin
    .from('dm_comments')
    .select('*')
    .eq('id', commentId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!comment) return { error: 'Comment not found' }

  const prompt = `You draft pastoral, warm replies for Kingdom Deliverance Centre (KDC) Uganda community inbox.
Never claim to be a pastor if unsure; invite to church/prayer team when appropriate.
Classify and reply.

Comment platform: ${comment.platform}
Author: ${comment.author_name}
Body:
${comment.body}

Return ONLY JSON:
{
  "category": "prayer|complaint|visitor|question|spam|volunteer|donation|salvation|counselling|other",
  "sentiment": "positive|neutral|negative|urgent",
  "ai_draft_reply": "reply text ready for admin approval"
}`

  const result = await generateGeminiJson<{
    category: string
    sentiment: string
    ai_draft_reply: string
  }>({
    prompt,
    agent: 'community_reply',
    userId: auth.id,
    inputType: 'dm_comment',
    inputRef: commentId,
  })

  if ('error' in result) return result

  const { error } = await admin
    .from('dm_comments')
    .update({
      category: result.data.category || comment.category,
      sentiment: result.data.sentiment || comment.sentiment,
      ai_draft_reply: result.data.ai_draft_reply,
      status: 'drafted',
      updated_at: new Date().toISOString(),
    })
    .eq('id', commentId)

  if (error) return { error: error.message }

  revalidate()
  return { draft: result.data.ai_draft_reply }
}

export async function updateCommentStatus(
  commentId: string,
  status: 'new' | 'drafted' | 'approved' | 'replied' | 'ignored',
  aiDraftReply?: string
) {
  const auth = await requireStaff()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const payload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (aiDraftReply !== undefined) payload.ai_draft_reply = aiDraftReply
  if (status === 'replied') payload.replied_at = new Date().toISOString()

  const { error } = await admin.from('dm_comments').update(payload).eq('id', commentId)
  if (error) return { error: error.message }

  revalidate()
  return { success: true }
}

export async function addManualComment(input: {
  platform: string
  authorName?: string
  body: string
}) {
  const auth = await requireStaff()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('dm_comments')
    .insert({
      platform: input.platform || 'manual',
      author_name: input.authorName || 'Anonymous',
      body: input.body.trim(),
      status: 'new',
      sentiment: 'neutral',
      category: 'other',
      metadata: { source: 'manual' },
    })
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'Failed' }
  revalidate()
  return { id: data.id as string }
}
