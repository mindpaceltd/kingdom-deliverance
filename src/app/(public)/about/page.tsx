import type { Metadata } from 'next'
import { AboutPageView } from '@/components/about/about-page-view'
import { loadAboutPageData } from '@/lib/cms/load-about-page-data'
import { parsePageContent } from '@/lib/cms/page-content'
import { buildCmsPageMetadata } from '@/lib/seo/cms-page-metadata'
import { getAboutHeroUrl } from '@/lib/seo/page-hero'
import { createClient } from '@/lib/supabase/server'

export async function generateMetadata(): Promise<Metadata> {
  const supabase = createClient()
  const [pageRes, heroImageUrl] = await Promise.all([
    supabase
      .from('pages')
      .select('content_json')
      .eq('slug', 'about')
      .eq('status', 'published')
      .maybeSingle(),
    getAboutHeroUrl(),
  ])

  const content = pageRes.data?.content_json
    ? parsePageContent(pageRes.data.content_json)
    : null

  return buildCmsPageMetadata({
    slug: 'about',
    path: '/about',
    defaultTitle: 'About Us | Kingdom Deliverance Centre Uganda',
    defaultDescription:
      'Learn about Kingdom Deliverance Centre Uganda — our history, vision, leadership, and mission under Bishop Climate Wiseman.',
    content,
    heroImageUrl,
  })
}

export default async function AboutPage() {
  const data = await loadAboutPageData()
  return <AboutPageView data={data} />
}
