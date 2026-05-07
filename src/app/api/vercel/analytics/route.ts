import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/vercel/analytics
 * Fetch analytics data from Vercel Web Analytics API
 */
export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch Vercel config from database
    const { data: tokenRow } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'vercel_access_token')
      .single()

    const accessToken = tokenRow?.value || process.env.VERCEL_ACCESS_TOKEN || ''

    if (!accessToken) {
      return NextResponse.json({
        error: 'Vercel Access Token not configured. Add it in Admin Settings > Integrations.',
      }, { status: 404 })
    }

    const projectId = process.env.VERCEL_PROJECT_ID || ''
    if (!projectId) {
      return NextResponse.json({
        error: 'VERCEL_PROJECT_ID environment variable is not set.',
      }, { status: 400 })
    }

    // Calculate date range (last 28 days)
    const today = new Date()
    const endDate = today.toISOString().split('T')[0]
    const startDate = new Date(today.setDate(today.getDate() - 28))
      .toISOString()
      .split('T')[0]

    // Fetch analytics data from Vercel Web Analytics API
    const analyticsUrl = `https://api.vercel.com/v1/web/analytics?projectId=${projectId}&limit=50`

    const res = await fetch(analyticsUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      const message = errorData.error || `Vercel API error: ${res.statusText}`
      throw new Error(message)
    }

    const data = await res.json()

    // Transform Vercel data to dashboard format
    const analytics = {
      pageViews: data.pageViews || 0,
      visitors: data.visitors || 0,
      averageSessionDuration: data.averageSessionDuration || 0,
      bounceRate: data.bounceRate || 0,
      topPages: data.topPages || [],
      topReferrers: data.topReferrers || [],
      topCountries: data.topCountries || [],
      events: data.events || [],
    }

    return NextResponse.json({ analytics, raw: data })
  } catch (err: any) {
    console.error('Vercel analytics error:', err)
    return NextResponse.json({
      error: err.message || 'Failed to fetch Vercel analytics',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    }, { status: 500 })
  }
}
