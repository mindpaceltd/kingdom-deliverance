import { NextResponse } from 'next/server'
import {
  getMetaAppCredentials,
  META_GRAPH_BASE,
  parseMetaOAuthState,
} from '@/lib/meta/oauth'
import { syncMetaIntoDmAccounts } from '@/lib/digital-ministry/accounts'

export const dynamic = 'force-dynamic'

type TokenResponse = {
  access_token?: string
  token_type?: string
  expires_in?: number
  error?: { message?: string }
}

async function exchangeCode(code: string, redirectUri: string): Promise<TokenResponse> {
  const { appId, appSecret } = getMetaAppCredentials()
  const url = new URL(`${META_GRAPH_BASE}/oauth/access_token`)
  url.searchParams.set('client_id', appId)
  url.searchParams.set('client_secret', appSecret)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('code', code)
  const res = await fetch(url.toString())
  return res.json() as Promise<TokenResponse>
}

async function exchangeLongLived(shortToken: string): Promise<TokenResponse> {
  const { appId, appSecret } = getMetaAppCredentials()
  const url = new URL(`${META_GRAPH_BASE}/oauth/access_token`)
  url.searchParams.set('grant_type', 'fb_exchange_token')
  url.searchParams.set('client_id', appId)
  url.searchParams.set('client_secret', appSecret)
  url.searchParams.set('fb_exchange_token', shortToken)
  const res = await fetch(url.toString())
  return res.json() as Promise<TokenResponse>
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const siteUrl = `${requestUrl.protocol}//${requestUrl.host}`
  const code = requestUrl.searchParams.get('code')
  const state = requestUrl.searchParams.get('state')
  const oauthError = requestUrl.searchParams.get('error')
  const defaultReturn = '/admin/digital-ministry/accounts'

  const parsed = state ? parseMetaOAuthState(state) : null
  const returnTo = parsed?.returnTo ?? defaultReturn
  const joiner = returnTo.includes('?') ? '&' : '?'

  if (oauthError) {
    return NextResponse.redirect(
      `${siteUrl}${returnTo}${joiner}error=meta_${encodeURIComponent(oauthError)}`
    )
  }

  if (!code || !parsed?.userId) {
    return NextResponse.redirect(`${siteUrl}${returnTo}${joiner}error=missing_code`)
  }

  try {
    const redirectUri = `${siteUrl}/api/meta/callback`
    const short = await exchangeCode(code, redirectUri)
    if (!short.access_token) {
      console.error('Meta short token error:', short)
      return NextResponse.redirect(`${siteUrl}${returnTo}${joiner}error=token_exchange`)
    }

    const long = await exchangeLongLived(short.access_token)
    const userToken = long.access_token || short.access_token
    const expiresIn = long.expires_in ?? short.expires_in ?? 60 * 60 * 24 * 60
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    await syncMetaIntoDmAccounts({
      userId: parsed.userId,
      userAccessToken: userToken,
      tokenExpiresAt: expiresAt,
    })

    return NextResponse.redirect(`${siteUrl}${returnTo}${joiner}success=meta_connected`)
  } catch (err) {
    console.error('Meta OAuth callback error:', err)
    return NextResponse.redirect(`${siteUrl}${returnTo}${joiner}error=auth_failed`)
  }
}
