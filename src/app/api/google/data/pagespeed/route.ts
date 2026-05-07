import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/google/data/pagespeed
export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kdcuganda.org'
    
    // Try to fetch API key from database first, then fallback to env
    let apiKey = process.env.GOOGLE_PAGESPEED_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PAGESPEED_API_KEY || ''
    
    if (!apiKey) {
      const { data: dbKey } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'google_pagespeed_api_key')
        .single()
      
      if (dbKey?.value) {
        apiKey = dbKey.value
      }
    }

    const apiUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed')
    apiUrl.searchParams.set('url', siteUrl)
    apiUrl.searchParams.set('category', 'ACCESSIBILITY')
    apiUrl.searchParams.append('category', 'BEST_PRACTICES')
    apiUrl.searchParams.append('category', 'PERFORMANCE')
    apiUrl.searchParams.append('category', 'SEO')
    apiUrl.searchParams.set('strategy', 'mobile')
    if (apiKey) apiUrl.searchParams.set('key', apiKey)

    const res = await fetch(apiUrl.toString())
    const data = await res.json()

    if (!res.ok) {
      const message = data.error?.message || 'Failed to fetch PageSpeed data'
      throw new Error(message)
    }

    const lighthouse = data.lighthouseResult
    const scores = {
      performance: (lighthouse.categories.performance.score || 0) * 100,
      accessibility: (lighthouse.categories.accessibility.score || 0) * 100,
      bestPractices: (lighthouse.categories['best-practices'].score || 0) * 100,
      seo: (lighthouse.categories.seo.score || 0) * 100,
    }

    return NextResponse.json({ scores, lighthouse })
  } catch (err: any) {
    console.error('PageSpeed API error:', err)

    const message = err.message || 'Failed to fetch PageSpeed data'
    const quotaMessage = message.includes('Quota exceeded')
      ? 'PageSpeed quota has been exceeded for the configured Google Cloud project.'
      : message

    return NextResponse.json({
      error: quotaMessage,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    }, { status: 500 })
  }
}
