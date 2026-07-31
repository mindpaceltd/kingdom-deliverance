import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { revalidateSitemap } from '@/lib/seo/revalidate-sitemap'

export interface AutoPublishResult {
  published: number
  slugs: string[]
  error?: string
}

/**
 * Flip sermons whose scheduled time has passed to published.
 *
 * Uses the service role because it runs from a cron with no user session, and
 * because RLS hides non-published sermons from anonymous requests.
 */
export async function publishDueSermons(): Promise<AutoPublishResult> {
  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const { data: due, error } = await supabase
    .from('sermons')
    .select('id, slug')
    .eq('status', 'scheduled')
    .not('scheduled_at', 'is', null)
    .lte('scheduled_at', now)
    .is('deleted_at', null)

  if (error) {
    console.error('[auto-publish] failed to load due sermons', error)
    return { published: 0, slugs: [], error: error.message }
  }

  if (!due?.length) return { published: 0, slugs: [] }

  const ids = due.map((s) => s.id as string)
  const { error: updateError } = await supabase
    .from('sermons')
    .update({ status: 'published', published_at: now, updated_at: now })
    .in('id', ids)

  if (updateError) {
    console.error('[auto-publish] failed to publish sermons', updateError)
    return { published: 0, slugs: [], error: updateError.message }
  }

  const slugs = due.map((s) => s.slug as string)

  revalidatePath('/sermons')
  for (const slug of slugs) revalidatePath(`/sermons/${slug}`)
  revalidatePath('/')
  revalidateSitemap()

  return { published: slugs.length, slugs }
}
