import type { SupabaseClient } from '@supabase/supabase-js'
import { parsePageContent, type CmsPageContent } from '@/lib/cms/page-content'

export interface PublishedPageRow {
  content_json: Record<string, unknown>
  status: string
  updated_at: string
}

/** Load a published CMS page by slug (`home` also matches legacy empty slug). */
export async function getPublishedPageBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<{ content: CmsPageContent; row: PublishedPageRow } | null> {
  let query = supabase
    .from('pages')
    .select('content_json, status, updated_at')
    .eq('status', 'published')
    .order('updated_at', { ascending: false })
    .limit(1)

  if (slug === 'home') {
    query = query.in('slug', ['home', ''])
  } else {
    query = query.eq('slug', slug)
  }

  const { data, error } = await query.maybeSingle()
  if (error || !data?.content_json) return null

  return {
    row: data as PublishedPageRow,
    content: parsePageContent(data.content_json),
  }
}
