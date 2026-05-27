import type { Metadata } from 'next'
import { AboutPageView } from '@/components/about/about-page-view'
import { loadAboutPageData } from '@/lib/cms/load-about-page-data'
import { createClient } from '@/lib/supabase/server'
import { parsePageContent } from '@/lib/cms/page-content'

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('pages')
    .select('content_json')
    .eq('slug', 'about')
    .eq('status', 'published')
    .maybeSingle()

  const content = data?.content_json ? parsePageContent(data.content_json) : null
  const seo = content?.seo

  return {
    title: seo?.metaTitle ?? 'About Us | Kingdom Deliverance Centre Uganda',
    description:
      seo?.metaDescription ??
      'Learn about Kingdom Deliverance Centre Uganda — our history, vision, leadership, and mission under Bishop Climate Wiseman.',
    ...(seo?.noIndex ? { robots: { index: false, follow: false } } : {}),
  }
}

export default async function AboutPage() {
  const data = await loadAboutPageData()
  return <AboutPageView data={data} />
}
