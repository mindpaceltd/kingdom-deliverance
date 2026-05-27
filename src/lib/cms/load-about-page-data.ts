import { createClient } from '@/lib/supabase/server'
import { parsePageContent } from '@/lib/cms/page-content'
import { resolveAboutPage, type ResolvedAboutPage } from '@/lib/cms/about-page-defaults'
import { getAboutHeroUrl } from '@/lib/seo/page-hero'

export type { ResolvedAboutPage }

export async function loadAboutPageData(): Promise<ResolvedAboutPage> {
  const supabase = await createClient()

  const [pageRes, orgHeroUrl] = await Promise.all([
    supabase
      .from('pages')
      .select('content_json')
      .eq('slug', 'about')
      .eq('status', 'published')
      .maybeSingle(),
    getAboutHeroUrl(),
  ])

  const cms = pageRes.data?.content_json
    ? parsePageContent(pageRes.data.content_json)
    : null

  return resolveAboutPage(cms, orgHeroUrl)
}
