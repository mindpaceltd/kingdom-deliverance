import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'
import { getAuthedGoogleClient } from '@/lib/google/client'

export async function POST(request: Request) {
  try {
    const { siteUrl } = await request.json()
    if (!siteUrl) {
      return NextResponse.json({ error: 'siteUrl is required' }, { status: 400 })
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const auth = await getAuthedGoogleClient(user.id)
    const siteVerification = google.siteVerification({ version: 'v1', auth })

    try {
      const { data: verified } = await siteVerification.webResource.insert({
        verificationMethod: 'META',
        requestBody: {
          site: {
            type: 'SITE',
            identifier: siteUrl,
          },
        },
      })

      return NextResponse.json({ verified: true, resource: verified })
    } catch (verifyError: any) {
      const { data: token } = await siteVerification.webResource.getToken({
        requestBody: {
          site: {
            type: 'SITE',
            identifier: siteUrl,
          },
          verificationMethod: 'META',
        },
      })

      return NextResponse.json({ verified: false, token })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
