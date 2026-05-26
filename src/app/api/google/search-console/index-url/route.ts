import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { publishUrlsToGoogleIndexing } from '@/lib/google/publish-indexing'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { urls } = await request.json()
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: 'An array of urls is required' }, { status: 400 })
    }

    const outcome = await publishUrlsToGoogleIndexing(user.id, urls)

    if (outcome.needsReauth) {
      return NextResponse.json(outcome, { status: 403 })
    }

    if (outcome.submitted === 0) {
      return NextResponse.json(
        {
          ...outcome,
          error: outcome.error || outcome.results[0]?.error || 'No URLs were accepted by Google.',
        },
        { status: 422 }
      )
    }

    return NextResponse.json(outcome)
  } catch (err: unknown) {
    console.error('Indexing API global error:', err)
    const message = err instanceof Error ? err.message : 'Failed to submit indexing request'
    const status =
      message.includes('Google account not connected') || message.includes('Unauthorized')
        ? 401
        : 500
    return NextResponse.json({ error: message, submitted: 0, failed: 0, total: 0, results: [] }, { status })
  }
}
