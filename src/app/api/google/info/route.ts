import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'
import { getAuthedGoogleClient } from '@/lib/google/client'
import { hasGoogleIndexingScope } from '@/lib/google/scopes'

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: integration } = await supabase
      .from('users_google_integrations')
      .select('scope')
      .eq('user_id', user.id)
      .maybeSingle()

    const oauth2Client = await getAuthedGoogleClient(user.id)
    const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' })
    const { data } = await oauth2.userinfo.get()

    return NextResponse.json({
      email: data.email || null,
      name: data.name || null,
      picture: data.picture || null,
      hasIndexingScope: hasGoogleIndexingScope(integration?.scope),
    })
  } catch (error: any) {
    console.error('Google profile fetch failed:', error)

    const status =
      error.message?.includes('Google account not connected') ||
      error.message?.includes('Unauthorized')
        ? 401
        : 500

    return NextResponse.json({ error: 'Unable to fetch Google profile.' }, { status })
  }
}
