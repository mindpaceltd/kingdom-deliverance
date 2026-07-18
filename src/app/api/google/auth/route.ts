import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'
import { encodeGoogleOAuthState, GOOGLE_OAUTH_SCOPES } from '@/lib/google/scopes'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const requestUrl = new URL(request.url)
  const reconnect = requestUrl.searchParams.get('reconnect') === '1'
  const returnTo = requestUrl.searchParams.get('returnTo')

  if (reconnect) {
    await supabase.from('users_google_integrations').delete().eq('user_id', user.id)
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const siteUrl = `${requestUrl.protocol}//${requestUrl.host}`

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Google OAuth credentials not configured.' }, { status: 500 })
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    `${siteUrl}/api/google/callback`
  )

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [...GOOGLE_OAUTH_SCOPES],
    prompt: 'consent',
    include_granted_scopes: true,
    state: encodeGoogleOAuthState(user.id, returnTo),
  })

  return NextResponse.redirect(url)
}
