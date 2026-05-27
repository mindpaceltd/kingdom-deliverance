import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'
import { getAuthedGoogleClient } from '@/lib/google/client'
import {
  getGscReportingDateRange,
  hasSearchAnalyticsRows,
  isValidSearchConsoleSiteUrl,
  resolveSearchConsoleSiteUrls,
  type GscSiteEntry,
} from '@/lib/google/search-console-analytics'

export const dynamic = 'force-dynamic'

type SearchAnalyticsResult = {
  rows?: Array<{
    keys?: string[]
    clicks?: number
    impressions?: number
    ctr?: number
    position?: number
  }>
}

async function querySearchAnalytics(
  searchconsole: ReturnType<typeof google.searchconsole>,
  siteUrl: string,
  startDate: string,
  endDate: string,
  dimensions: string[],
  rowLimit: number
): Promise<SearchAnalyticsResult> {
  const { data } = await searchconsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions,
      rowLimit,
      dataState: 'all',
      searchType: 'web',
      aggregationType: 'auto',
    },
  })
  return data ?? {}
}

// GET /api/google/data/search-console
export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: config } = await supabase
      .from('search_console_config')
      .select('site_url')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!config?.site_url) {
      return NextResponse.json({ error: 'Search Console site not configured.' }, { status: 404 })
    }

    if (!isValidSearchConsoleSiteUrl(config.site_url)) {
      return NextResponse.json({ error: 'Invalid site URL format.' }, { status: 400 })
    }

    const requestUrl = new URL(request.url)
    const dateRangeStr = requestUrl.searchParams.get('range') || '28'
    const dateRange = parseInt(dateRangeStr, 10) || 28
    const { startDate, endDate } = getGscReportingDateRange(dateRange)

    const auth = await getAuthedGoogleClient(user.id)
    const searchconsole = google.searchconsole({ version: 'v1', auth })

    let siteEntries: GscSiteEntry[] = []
    try {
      const { data: sitesList } = await searchconsole.sites.list()
      siteEntries = (sitesList.siteEntry ?? []) as GscSiteEntry[]
    } catch (listErr) {
      console.warn('[search-console] sites.list failed:', listErr)
    }

    const siteUrlCandidates = resolveSearchConsoleSiteUrls(config.site_url, siteEntries)
    let siteUrlUsed = siteUrlCandidates[0] ?? config.site_url.trim()
    let summary: SearchAnalyticsResult = {}
    let topQueries: SearchAnalyticsResult = {}
    let topPages: SearchAnalyticsResult = {}
    let lastError: string | null = null

    for (const candidate of siteUrlCandidates) {
      try {
        const [summaryRes, queriesRes, pagesRes] = await Promise.all([
          querySearchAnalytics(searchconsole, candidate, startDate, endDate, ['date'], dateRange),
          querySearchAnalytics(searchconsole, candidate, startDate, endDate, ['query'], 25),
          querySearchAnalytics(searchconsole, candidate, startDate, endDate, ['page'], 10),
        ])

        const hasData =
          hasSearchAnalyticsRows(summaryRes) ||
          hasSearchAnalyticsRows(queriesRes) ||
          hasSearchAnalyticsRows(pagesRes)

        if (hasData || !hasSearchAnalyticsRows(summary)) {
          siteUrlUsed = candidate
          summary = summaryRes
          topQueries = queriesRes
          topPages = pagesRes
        }

        if (hasData) break
      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : String(err)
        console.warn('[search-console] query failed for', candidate, lastError)
      }
    }

    if (
      !hasSearchAnalyticsRows(summary) &&
      !hasSearchAnalyticsRows(topQueries) &&
      !hasSearchAnalyticsRows(topPages) &&
      lastError
    ) {
      const status =
        lastError.includes('Google account not connected') || lastError.includes('Unauthorized')
          ? 401
          : 500
      return NextResponse.json(
        {
          error: lastError,
          hint: 'Confirm the Search Console property in Admin → Analytics → Settings matches a verified property (e.g. https://kdcuganda.org/ or sc-domain:kdcuganda.org).',
        },
        { status }
      )
    }

    return NextResponse.json({
      summary,
      topQueries,
      topPages,
      meta: {
        siteUrlUsed,
        configuredSiteUrl: config.site_url,
        startDate,
        endDate,
        dateRangeDays: dateRange,
        dataLagDays: 3,
        verifiedSites: siteEntries
          .filter((s) => s.siteUrl)
          .map((s) => ({ siteUrl: s.siteUrl, permissionLevel: s.permissionLevel })),
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch search console data'
    console.error('Search Console API error:', err)
    const status =
      message.includes('Google account not connected') || message.includes('Unauthorized')
        ? 401
        : 500
    return NextResponse.json(
      {
        error: message,
        details: process.env.NODE_ENV === 'development' && err instanceof Error ? err.stack : undefined,
      },
      { status }
    )
  }
}
