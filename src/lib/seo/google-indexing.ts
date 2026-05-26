import { createClient } from '@/lib/supabase/server'
import { getAuthedGoogleClient } from '@/lib/google/client'
import {
  buildPublicContentUrl,
  type PublicContentKind,
} from '@/lib/seo/public-content-urls'

export type { PublicContentKind } from '@/lib/seo/public-content-urls'
export { buildPublicContentUrl } from '@/lib/seo/public-content-urls'

function shouldAutoIndex(
  kind: PublicContentKind,
  status: string | undefined | null,
  extra?: { is_active?: boolean }
): boolean {
  if (!status) return false
  switch (kind) {
    case 'post':
    case 'sermon':
      return status === 'published'
    case 'ministry':
      return status === 'published' && extra?.is_active !== false
    case 'event':
      return ['published', 'upcoming', 'ongoing'].includes(status)
    case 'product':
      return status === 'published' && extra?.is_active !== false
    default:
      return false
  }
}

/** Submit URLs to Google Indexing API (requires connected Google account). */
export async function requestGoogleIndexing(
  urls: string[]
): Promise<{ submitted: number; skipped?: boolean; error?: string }> {
  const unique = [...new Set(urls.filter(Boolean))]
  if (unique.length === 0) return { submitted: 0 }

  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { submitted: 0, error: 'Not authenticated' }
    }

    const auth = await getAuthedGoogleClient(user.id)
    let submitted = 0

    for (const url of unique) {
      try {
        new URL(url)
        await auth.request({
          url: 'https://indexing.googleapis.com/v3/urlNotifications:publish',
          method: 'POST',
          data: { url, type: 'URL_UPDATED' },
        })
        submitted++
      } catch (err) {
        console.warn('[google-indexing] URL failed:', url, err)
      }
    }

    return { submitted }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (
      message.includes('Google account not connected') ||
      message.includes('Failed to load Google integration')
    ) {
      return { submitted: 0, skipped: true, error: message }
    }
    console.warn('[google-indexing]', message)
    return { submitted: 0, error: message }
  }
}

/** Fire-and-forget indexing after publish (no-op if Google is not connected). */
export async function indexOnPublish(
  kind: PublicContentKind,
  slug: string,
  status: string | undefined | null,
  extra?: { is_active?: boolean }
): Promise<void> {
  if (!slug?.trim() || !shouldAutoIndex(kind, status, extra)) return
  const url = buildPublicContentUrl(kind, slug.trim())
  await requestGoogleIndexing([url]).catch(() => {})
}
