import 'server-only'

import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'
import { getAuthedGoogleClient } from '@/lib/google/client'

function normalizePagePath(path: string): string {
  if (!path || path === '/') return '/'
  const withoutQuery = path.split('?')[0] ?? path
  const trimmed = withoutQuery.endsWith('/') && withoutQuery.length > 1
    ? withoutQuery.slice(0, -1)
    : withoutQuery
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

/**
 * GA4 screen page views by path (last 28 days) for the connected admin Google property.
 * Returns an empty map when Analytics is not configured.
 */
export async function fetchPageVisitorsByPath(
  adminUserId: string
): Promise<Record<string, number>> {
  try {
    const supabase = createClient()
    const { data: config } = await supabase
      .from('analytics_config')
      .select('property_id')
      .eq('user_id', adminUserId)
      .maybeSingle()

    if (!config?.property_id?.startsWith('properties/')) {
      return {}
    }

    const auth = await getAuthedGoogleClient(adminUserId)
    const analyticsData = google.analyticsdata({ version: 'v1beta', auth })

    const { data: topPages } = await analyticsData.properties.runReport({
      property: config.property_id,
      requestBody: {
        dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
        metrics: [{ name: 'screenPageViews' }],
        dimensions: [{ name: 'pagePath' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: '200',
      },
    })

    const map: Record<string, number> = {}
    for (const row of topPages.rows ?? []) {
      const rawPath = row.dimensionValues?.[0]?.value
      const views = Number(row.metricValues?.[0]?.value ?? 0)
      if (!rawPath || !Number.isFinite(views)) continue
      const path = normalizePagePath(rawPath)
      map[path] = (map[path] ?? 0) + views
    }

    return map
  } catch (err) {
    console.error('[fetchPageVisitorsByPath]', err)
    return {}
  }
}
