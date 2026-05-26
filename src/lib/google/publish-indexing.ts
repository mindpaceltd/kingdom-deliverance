import { createClient } from '@/lib/supabase/server'
import { getAuthedGoogleClient } from '@/lib/google/client'
import { hasGoogleIndexingScope } from '@/lib/google/scopes'
import { GOOGLE_ANALYTICS_SETTINGS_PATH, GOOGLE_RECONNECT_AUTH_PATH } from '@/lib/google/reconnect'
import { alignUrlToSiteOrigin, siteUrlToOrigin } from '@/lib/seo/public-content-urls'

export type IndexingResultItem = {
  url: string
  success: boolean
  message?: string
  error?: string
}

export type PublishIndexingResponse = {
  submitted: number
  failed: number
  total: number
  results: IndexingResultItem[]
  needsReauth?: boolean
  error?: string
  hint?: string
}

function parseIndexingError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err)
  if (raw.includes('403') || raw.toLowerCase().includes('permission')) {
    return (
      'Google rejected the request (403). Enable the Indexing API in Google Cloud, ' +
      'reconnect Google under Admin → Analytics → Settings, and ensure the URL is owned in Search Console.'
    )
  }
  if (raw.toLowerCase().includes('ownership') || raw.toLowerCase().includes('verify')) {
    return 'Google could not verify URL ownership. Use the same site URL as in Search Console (e.g. https://kdcuganda.org).'
  }
  return raw || 'Submission failed'
}

export async function publishUrlsToGoogleIndexing(
  userId: string,
  urls: string[]
): Promise<PublishIndexingResponse> {
  const unique = [...new Set(urls.map((u) => u.trim()).filter(Boolean))]
  if (unique.length === 0) {
    return { submitted: 0, failed: 0, total: 0, results: [] }
  }

  const supabase = createClient()

  const { data: integration } = await supabase
    .from('users_google_integrations')
    .select('scope')
    .eq('user_id', userId)
    .maybeSingle()

  if (!hasGoogleIndexingScope(integration?.scope)) {
    return {
      submitted: 0,
      failed: unique.length,
      total: unique.length,
      results: [],
      needsReauth: true,
      error:
        'Google Indexing permission missing. Reconnect Google to approve URL indexing access.',
      hint: `Open ${GOOGLE_ANALYTICS_SETTINGS_PATH}, click Reconnect Google (or visit ${GOOGLE_RECONNECT_AUTH_PATH}), and approve all permissions. In Google Cloud Console, enable the Indexing API and add its scope to your OAuth consent screen.`,
    }
  }

  const { data: scConfig } = await supabase
    .from('search_console_config')
    .select('site_url')
    .eq('user_id', userId)
    .maybeSingle()

  const origin = scConfig?.site_url
    ? siteUrlToOrigin(scConfig.site_url)
    : null

  const normalized = origin
    ? unique.map((url) => alignUrlToSiteOrigin(url, origin))
    : unique

  const auth = await getAuthedGoogleClient(userId)
  const results: IndexingResultItem[] = []
  let submitted = 0
  let failed = 0

  for (const url of normalized) {
    try {
      new URL(url)
      await auth.request({
        url: 'https://indexing.googleapis.com/v3/urlNotifications:publish',
        method: 'POST',
        data: { url, type: 'URL_UPDATED' },
      })
      submitted++
      results.push({ url, success: true, message: 'Accepted by Google Indexing API.' })
    } catch (err) {
      failed++
      results.push({ url, success: false, error: parseIndexingError(err) })
    }
  }

  const hint =
    submitted === 0 && scConfig?.site_url
      ? `Submitted URLs must belong to Search Console property: ${scConfig.site_url}`
      : submitted === 0 && !scConfig?.site_url
        ? 'Configure Search Console site URL under Admin → Analytics → Settings.'
        : undefined

  return { submitted, failed, total: unique.length, results, hint }
}
