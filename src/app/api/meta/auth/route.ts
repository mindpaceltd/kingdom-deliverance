import { NextResponse } from 'next/server'
import { requireStaff } from '@/lib/authz'
import {
  encodeMetaOAuthState,
  getMetaAppCredentials,
  META_GRAPH_VERSION,
  META_OAUTH_SCOPES,
  metaConfigured,
} from '@/lib/meta/oauth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = await requireStaff()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }
  const user = { id: auth.id }

  if (!metaConfigured()) {
    return NextResponse.json(
      { error: 'Meta OAuth is not configured. Set META_APP_ID and META_APP_SECRET.' },
      { status: 500 }
    )
  }

  const requestUrl = new URL(request.url)
  const returnTo =
    requestUrl.searchParams.get('returnTo') || '/admin/digital-ministry/accounts'
  const siteUrl = `${requestUrl.protocol}//${requestUrl.host}`
  const { appId } = getMetaAppCredentials()

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: `${siteUrl}/api/meta/callback`,
    state: encodeMetaOAuthState(user.id, returnTo),
    scope: META_OAUTH_SCOPES.join(','),
    response_type: 'code',
  })

  return NextResponse.redirect(
    `https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth?${params.toString()}`
  )
}
