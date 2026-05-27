import { createClient } from '@/lib/supabase/server'
import { parsePageContent } from '@/lib/cms/page-content'
import { resolveContactPage, type ResolvedContactPage } from '@/lib/cms/contact-page-defaults'

export type { ResolvedContactPage }

export async function loadContactPageData(): Promise<ResolvedContactPage> {
  const supabase = await createClient()

  const [pageRes, settingsRes, heroRes] = await Promise.all([
    supabase
      .from('pages')
      .select('content_json')
      .eq('slug', 'contact')
      .eq('status', 'published')
      .maybeSingle(),
    supabase.from('site_settings').select('key, value'),
    supabase
      .from('organization_images')
      .select('url')
      .eq('type', 'hero')
      .eq('is_active', true)
      .maybeSingle(),
  ])

  const settings = Object.fromEntries(
    (settingsRes.data ?? []).map((row) => [row.key, row.value])
  )

  const cms = pageRes.data?.content_json
    ? parsePageContent(pageRes.data.content_json)
    : null

  return resolveContactPage(cms, settings, heroRes.data?.url ?? null)
}
