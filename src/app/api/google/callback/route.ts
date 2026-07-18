import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createAdminClient } from '@/lib/supabase/server'
import { hasGoogleIndexingScope, parseGoogleOAuthState } from '@/lib/google/scopes'
import { syncGoogleIntoDmAccounts } from '@/lib/digital-ministry/accounts'

export const dynamic = 'force-dynamic'

async function resolveGrantedScope(
  oauth2Client: InstanceType<typeof google.auth.OAuth2>,
  accessToken: string | null | undefined,
  scopeFromToken?: string | null
): Promise<string> {
  if (scopeFromToken?.trim()) return scopeFromToken.trim()

  if (!accessToken) return ''

  try {
    const info = await oauth2Client.getTokenInfo(accessToken)
    if (info.scopes?.length) return info.scopes.join(' ')
  } catch (err) {
    console.warn('Google tokeninfo scope lookup failed:', err)
  }

  return ''
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  const requestUrl = new URL(request.url)
  const siteUrl = `${requestUrl.protocol}//${requestUrl.host}`
  const defaultReturn = '/admin/analytics?tab=settings'

  if (!code || !state) {
    return NextResponse.redirect(`${siteUrl}${defaultReturn}&error=missing_code`)
  }

  const { userId, returnTo } = parseGoogleOAuthState(state)
  const successBase = returnTo ?? defaultReturn
  const joiner = successBase.includes('?') ? '&' : '?'

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${siteUrl}${successBase}${joiner}error=missing_credentials`)
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    `${siteUrl}/api/google/callback`
  )

  try {
    const { tokens } = await oauth2Client.getToken(code)
    const scope = await resolveGrantedScope(oauth2Client, tokens.access_token, tokens.scope)

    if (!hasGoogleIndexingScope(scope)) {
      console.error('Google OAuth completed without indexing scope:', scope)
      return NextResponse.redirect(`${siteUrl}${successBase}${joiner}error=missing_indexing_scope`)
    }

    const payload: {
      user_id: string
      access_token: string | null | undefined
      expiry_date: number | null | undefined
      scope: string
      updated_at: string
      refresh_token?: string
    } = {
      user_id: userId,
      access_token: tokens.access_token,
      expiry_date: tokens.expiry_date,
      scope,
      updated_at: new Date().toISOString(),
    }

    if (tokens.refresh_token) {
      payload.refresh_token = tokens.refresh_token
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from('users_google_integrations')
      .upsert(payload, { onConflict: 'user_id' })

    if (error) {
      console.error('Supabase Google Integration Save Error:', error)
      return NextResponse.redirect(`${siteUrl}${successBase}${joiner}error=db_save_failed`)
    }

    if (tokens.access_token) {
      try {
        await syncGoogleIntoDmAccounts({
          userId,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiryDate: tokens.expiry_date,
          scope,
        })
      } catch (syncErr) {
        console.error('DM Google account sync failed (non-fatal):', syncErr)
      }
    }

    return NextResponse.redirect(`${siteUrl}${successBase}${joiner}success=google_connected`)
  } catch (error) {
    console.error('Google Callback Error:', error)
    return NextResponse.redirect(`${siteUrl}${successBase}${joiner}error=auth_failed`)
  }
}
