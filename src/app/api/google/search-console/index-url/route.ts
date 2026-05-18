import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthedGoogleClient } from '@/lib/google/client'

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { urls } = await request.json()
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: 'An array of urls is required' }, { status: 400 })
    }

    const auth = await getAuthedGoogleClient(user.id)
    const results = []

    for (const url of urls) {
      try {
        // Validate URL format
        new URL(url)

        const response = await auth.request({
          url: 'https://indexing.googleapis.com/v3/urlNotifications:publish',
          method: 'POST',
          data: {
            url: url,
            type: 'URL_UPDATED',
          },
        })

        results.push({
          url,
          success: true,
          status: response.status,
          message: 'Successfully submitted for indexing.'
        })
      } catch (err: any) {
        console.error(`Indexing error for ${url}:`, err)
        
        let friendlyMessage = err.message || 'Submission failed'
        if (friendlyMessage.includes('403') || friendlyMessage.toLowerCase().includes('permission')) {
          friendlyMessage = 'Google Indexing API is either disabled or permissions are missing. Please enable it in the Google Cloud Console.'
        }

        results.push({
          url,
          success: false,
          error: friendlyMessage
        })
      }
    }

    return NextResponse.json({ results })
  } catch (err: any) {
    console.error('Indexing API global error:', err)
    const status = err.message?.includes('Google account not connected') || err.message?.includes('Unauthorized')
      ? 401
      : 500
    return NextResponse.json({ error: err.message || 'Failed to submit indexing request' }, { status })
  }
}
