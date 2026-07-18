'use server'

import { google } from 'googleapis'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/authz'
import { encryptSecret, tryDecryptSecret } from '@/lib/digital-ministry/tokens'
import type { DmPlatform, DmSocialAccount } from '@/lib/digital-ministry/types'
import { revalidatePath } from 'next/cache'

export type UpsertDmAccountInput = {
  platform: DmPlatform
  accountId: string
  accountName?: string | null
  avatarUrl?: string | null
  status?: DmSocialAccount['status']
  healthStatus?: DmSocialAccount['health_status']
  healthMessage?: string | null
  scopes?: string[]
  accessToken?: string | null
  refreshToken?: string | null
  tokenExpiresAt?: string | null
  metadata?: Record<string, unknown>
  connectedBy?: string | null
}

export async function listDmSocialAccounts(): Promise<DmSocialAccount[]> {
  const auth = await requireStaff()
  if ('error' in auth) return []

  const supabase = createClient()
  const { data, error } = await supabase
    .from('dm_social_accounts')
    .select(
      'id, platform, account_name, account_id, avatar_url, status, scopes, token_expires_at, health_status, health_message, last_synced_at, metadata'
    )
    .is('deleted_at', null)
    .order('platform')

  if (error) {
    console.error('listDmSocialAccounts', error)
    return []
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    platform: row.platform as DmPlatform,
    account_name: row.account_name,
    account_id: row.account_id,
    avatar_url: row.avatar_url,
    status: row.status,
    scopes: row.scopes ?? [],
    token_expires_at: row.token_expires_at,
    health_status: row.health_status,
    health_message: row.health_message,
    last_synced_at: row.last_synced_at,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
  }))
}

export async function upsertDmSocialAccount(input: UpsertDmAccountInput) {
  const admin = createAdminClient()
  const now = new Date().toISOString()

  const payload: Record<string, unknown> = {
    platform: input.platform,
    account_id: input.accountId,
    account_name: input.accountName ?? null,
    avatar_url: input.avatarUrl ?? null,
    status: input.status ?? 'connected',
    health_status: input.healthStatus ?? 'healthy',
    health_message: input.healthMessage ?? null,
    scopes: input.scopes ?? [],
    token_expires_at: input.tokenExpiresAt ?? null,
    metadata: input.metadata ?? {},
    connected_by: input.connectedBy ?? null,
    last_synced_at: now,
    updated_at: now,
    deleted_at: null,
  }

  if (input.accessToken) {
    payload.token_encrypted = encryptSecret(input.accessToken)
  }
  if (input.refreshToken) {
    payload.refresh_token_encrypted = encryptSecret(input.refreshToken)
  }

  const { data, error } = await admin
    .from('dm_social_accounts')
    .upsert(payload, { onConflict: 'platform,account_id' })
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('upsertDmSocialAccount', error)
    return { error: error.message }
  }

  return { id: data?.id as string | undefined }
}

export async function disconnectDmPlatform(platform: DmPlatform, accountId?: string) {
  const auth = await requireStaff()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const now = new Date().toISOString()
  let query = admin
    .from('dm_social_accounts')
    .update({
      status: 'disconnected',
      health_status: 'unknown',
      health_message: 'Disconnected by admin',
      token_encrypted: null,
      refresh_token_encrypted: null,
      deleted_at: now,
      updated_at: now,
    })
    .eq('platform', platform)
    .is('deleted_at', null)

  if (accountId) query = query.eq('account_id', accountId)

  const { error } = await query
  if (error) return { error: error.message }

  await admin.from('dm_audit_logs').insert({
    actor_id: auth.id,
    action: 'dm.account.disconnect',
    entity_type: 'dm_social_accounts',
    metadata: { platform, accountId: accountId ?? null },
  })

  revalidatePath('/admin/digital-ministry/accounts')
  revalidatePath(`/admin/digital-ministry/accounts/${platform}`)
  return { success: true }
}

/** Manual / limited platforms: register handle or page URL without OAuth tokens. */
export async function manualConnectDmAccount(input: {
  platform: DmPlatform
  accountName: string
  accountHandleOrUrl?: string | null
  notes?: string | null
}) {
  const auth = await requireStaff()
  if ('error' in auth) return { error: auth.error }

  const name = input.accountName.trim()
  if (!name) return { error: 'Account name is required' }

  const handle = (input.accountHandleOrUrl || name).trim()
  const accountId = handle
    .replace(/^https?:\/\//i, '')
    .replace(/\/$/, '')
    .slice(0, 180)

  const result = await upsertDmSocialAccount({
    platform: input.platform,
    accountId: accountId || `manual:${auth.id}:${Date.now()}`,
    accountName: name,
    status: 'connected',
    healthStatus: 'healthy',
    healthMessage:
      'Manually connected for drafts, calendar, and analytics. Use Mark published for outbound posts where API write is unavailable.',
    scopes: ['manual'],
    connectedBy: auth.id,
    metadata: {
      source: 'manual_connect',
      handle_or_url: handle,
      notes: input.notes?.trim() || null,
      publish_mode: 'manual',
    },
  })

  if (result.error) return { error: result.error }

  const admin = createAdminClient()
  await admin.from('dm_audit_logs').insert({
    actor_id: auth.id,
    action: 'dm.account.manual_connect',
    entity_type: 'dm_social_accounts',
    entity_id: result.id ?? null,
    metadata: { platform: input.platform, accountId },
  })

  revalidatePath('/admin/digital-ministry/accounts')
  revalidatePath(`/admin/digital-ministry/accounts/${input.platform}`)
  return { success: true, id: result.id }
}

/**
 * After Google OAuth succeeds, sync YouTube channel (if scoped) + website marker into dm_social_accounts.
 */
export async function syncGoogleIntoDmAccounts(params: {
  userId: string
  accessToken: string
  refreshToken?: string | null
  expiryDate?: number | null
  scope: string
}) {
  const admin = createAdminClient()
  const scopes = params.scope.split(/\s+/).filter(Boolean)
  const expiresAt = params.expiryDate ? new Date(params.expiryDate).toISOString() : null

  // Always mark Google/website analytics connection for DM
  await upsertDmSocialAccount({
    platform: 'website',
    accountId: `google-user:${params.userId}`,
    accountName: 'Google Analytics / Search Console',
    status: 'connected',
    healthStatus: 'healthy',
    healthMessage: 'Connected via Google OAuth',
    scopes,
    accessToken: params.accessToken,
    refreshToken: params.refreshToken,
    tokenExpiresAt: expiresAt,
    connectedBy: params.userId,
    metadata: { source: 'users_google_integrations', user_id: params.userId },
  })

  const hasYoutube = scopes.some(
    (s) => s.includes('youtube') || s.includes('yt-analytics')
  )

  if (!hasYoutube) {
    await upsertDmSocialAccount({
      platform: 'youtube',
      accountId: `pending:${params.userId}`,
      accountName: 'YouTube (reconnect for channel access)',
      status: 'limited',
      healthStatus: 'degraded',
      healthMessage: 'Google connected, but YouTube scopes not granted yet. Reconnect to enable channel sync.',
      scopes,
      connectedBy: params.userId,
      metadata: { source: 'users_google_integrations', user_id: params.userId, needs_youtube_scope: true },
    })
    return { youtube: false }
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )
    oauth2Client.setCredentials({
      access_token: params.accessToken,
      refresh_token: params.refreshToken ?? undefined,
      expiry_date: params.expiryDate ?? undefined,
    })

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client })
    const channels = await youtube.channels.list({
      part: ['snippet', 'statistics', 'contentDetails'],
      mine: true,
      maxResults: 5,
    })

    const items = channels.data.items ?? []
    if (items.length === 0) {
      await upsertDmSocialAccount({
        platform: 'youtube',
        accountId: `no-channel:${params.userId}`,
        accountName: 'YouTube (no channel on this Google account)',
        status: 'limited',
        healthStatus: 'degraded',
        healthMessage: 'OAuth succeeded but no YouTube channel is linked to this Google account.',
        scopes,
        accessToken: params.accessToken,
        refreshToken: params.refreshToken,
        tokenExpiresAt: expiresAt,
        connectedBy: params.userId,
        metadata: { source: 'users_google_integrations', user_id: params.userId },
      })
      return { youtube: false }
    }

    for (const ch of items) {
      if (!ch.id) continue
      await upsertDmSocialAccount({
        platform: 'youtube',
        accountId: ch.id,
        accountName: ch.snippet?.title ?? 'YouTube Channel',
        avatarUrl: ch.snippet?.thumbnails?.default?.url ?? null,
        status: 'connected',
        healthStatus: 'healthy',
        healthMessage: 'YouTube channel synced',
        scopes,
        accessToken: params.accessToken,
        refreshToken: params.refreshToken,
        tokenExpiresAt: expiresAt,
        connectedBy: params.userId,
        metadata: {
          source: 'users_google_integrations',
          user_id: params.userId,
          custom_url: ch.snippet?.customUrl ?? null,
          subscriber_count: ch.statistics?.subscriberCount ?? null,
          view_count: ch.statistics?.viewCount ?? null,
          video_count: ch.statistics?.videoCount ?? null,
        },
      })
    }

    // Soft-remove pending placeholder rows for this user
    await admin
      .from('dm_social_accounts')
      .update({ deleted_at: new Date().toISOString(), status: 'disconnected' })
      .eq('platform', 'youtube')
      .like('account_id', `pending:%`)
      .eq('connected_by', params.userId)

    return { youtube: true, channels: items.length }
  } catch (err) {
    console.error('YouTube channel sync failed:', err)
    await upsertDmSocialAccount({
      platform: 'youtube',
      accountId: `error:${params.userId}`,
      accountName: 'YouTube (sync error)',
      status: 'error',
      healthStatus: 'error',
      healthMessage: err instanceof Error ? err.message : 'Channel sync failed',
      scopes,
      connectedBy: params.userId,
      metadata: { source: 'users_google_integrations', user_id: params.userId },
    })
    return { youtube: false, error: true }
  }
}

/** Pull latest YouTube stats for connected channels owned by current staff session. */
export async function refreshYouTubeStats() {
  const auth = await requireStaff()
  if ('error' in auth) return { error: auth.error }

  const supabase = createClient()
  const { data: integration } = await supabase
    .from('users_google_integrations')
    .select('*')
    .eq('user_id', auth.id)
    .maybeSingle()

  if (!integration?.access_token) {
    return { error: 'Connect Google / YouTube first.' }
  }

  const result = await syncGoogleIntoDmAccounts({
    userId: auth.id,
    accessToken: integration.access_token,
    refreshToken: integration.refresh_token,
    expiryDate: integration.expiry_date,
    scope: integration.scope ?? '',
  })

  revalidatePath('/admin/digital-ministry/accounts')
  revalidatePath('/admin/digital-ministry/accounts/youtube')
  revalidatePath('/admin/digital-ministry')
  return { success: true, ...result }
}

export async function getDecryptedAccountTokens(accountRowId: string) {
  const auth = await requireStaff()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('dm_social_accounts')
    .select('token_encrypted, refresh_token_encrypted, platform, account_id')
    .eq('id', accountRowId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !data) return { error: 'Account not found' }

  return {
    accessToken: tryDecryptSecret(data.token_encrypted),
    refreshToken: tryDecryptSecret(data.refresh_token_encrypted),
    platform: data.platform as DmPlatform,
    accountId: data.account_id as string,
  }
}

type MetaPage = {
  id: string
  name?: string
  access_token?: string
  picture?: { data?: { url?: string } }
  instagram_business_account?: { id: string; username?: string; name?: string; profile_picture_url?: string }
}

/**
 * After Meta OAuth, list Pages + linked Instagram Business accounts into dm_social_accounts.
 */
export async function syncMetaIntoDmAccounts(params: {
  userId: string
  userAccessToken: string
  tokenExpiresAt: string
}) {
  const { META_GRAPH_BASE, META_OAUTH_SCOPES } = await import('@/lib/meta/oauth')
  const scopes = [...META_OAUTH_SCOPES]

  const pagesUrl = new URL(`${META_GRAPH_BASE}/me/accounts`)
  pagesUrl.searchParams.set('fields', [
    'id',
    'name',
    'access_token',
    'picture',
    'instagram_business_account{id,username,name,profile_picture_url}',
  ].join(','))
  pagesUrl.searchParams.set('access_token', params.userAccessToken)

  const pagesRes = await fetch(pagesUrl.toString())
  const pagesJson = (await pagesRes.json()) as {
    data?: MetaPage[]
    error?: { message?: string }
  }

  if (pagesJson.error) {
    throw new Error(pagesJson.error.message || 'Failed to list Facebook Pages')
  }

  const pages = pagesJson.data ?? []

  if (pages.length === 0) {
    await upsertDmSocialAccount({
      platform: 'facebook',
      accountId: `no-pages:${params.userId}`,
      accountName: 'Facebook (no Pages found)',
      status: 'limited',
      healthStatus: 'degraded',
      healthMessage:
        'OAuth succeeded but this user has no Facebook Pages. Create a Page or grant Page access, then reconnect.',
      scopes,
      accessToken: params.userAccessToken,
      tokenExpiresAt: params.tokenExpiresAt,
      connectedBy: params.userId,
      metadata: { source: 'meta_oauth', user_id: params.userId },
    })
    return { pages: 0, instagram: 0 }
  }

  let igCount = 0

  for (const page of pages) {
    if (!page.id) continue
    const pageToken = page.access_token || params.userAccessToken

    await upsertDmSocialAccount({
      platform: 'facebook',
      accountId: page.id,
      accountName: page.name ?? `Facebook Page ${page.id}`,
      avatarUrl: page.picture?.data?.url ?? null,
      status: 'connected',
      healthStatus: 'healthy',
      healthMessage: 'Facebook Page connected',
      scopes,
      accessToken: pageToken,
      tokenExpiresAt: params.tokenExpiresAt,
      connectedBy: params.userId,
      metadata: {
        source: 'meta_oauth',
        user_id: params.userId,
        page_id: page.id,
        has_page_token: Boolean(page.access_token),
      },
    })

    const ig = page.instagram_business_account
    if (ig?.id) {
      igCount += 1
      await upsertDmSocialAccount({
        platform: 'instagram',
        accountId: ig.id,
        accountName: ig.username ? `@${ig.username}` : ig.name ?? 'Instagram',
        avatarUrl: ig.profile_picture_url ?? null,
        status: 'connected',
        healthStatus: 'healthy',
        healthMessage: 'Instagram Business account linked via Facebook Page',
        scopes,
        accessToken: pageToken,
        tokenExpiresAt: params.tokenExpiresAt,
        connectedBy: params.userId,
        metadata: {
          source: 'meta_oauth',
          user_id: params.userId,
          facebook_page_id: page.id,
          username: ig.username ?? null,
        },
      })
    }
  }

  // Soft-remove no-pages placeholders for this user
  const admin = createAdminClient()
  await admin
    .from('dm_social_accounts')
    .update({
      deleted_at: new Date().toISOString(),
      status: 'disconnected',
      updated_at: new Date().toISOString(),
    })
    .eq('platform', 'facebook')
    .like('account_id', 'no-pages:%')
    .eq('connected_by', params.userId)

  return { pages: pages.length, instagram: igCount }
}
