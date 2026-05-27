import type { Metadata } from 'next'
import { AboutPageView } from '@/components/about/about-page-view'
import { loadAboutPageData } from '@/lib/cms/load-about-page-data'
import { parsePageContent } from '@/lib/cms/page-content'
import { buildCmsPageMetadata } from '@/lib/seo/cms-page-metadata'
import { getAboutHeroUrl } from '@/lib/seo/page-hero'
import { getOrgOgImageUrl } from '@/lib/seo/site-branding'
import { createClient } from '@/lib/supabase/server'

export async function generateMetadata(): Promise<Metadata> {
  const supabase = createClient()
  const [pageRes, heroImageUrl, orgOgImage] = await Promise.all([
    supabase
      .from('pages')
      .select('content_json')
      .eq('slug', 'about')
      .eq('status', 'published')
      .maybeSingle(),
    getAboutHeroUrl(),
    getOrgOgImageUrl(),
  ])

  const content = pageRes.data?.content_json
    ? parsePageContent(pageRes.data.content_json)
    : null

  const base = await buildCmsPageMetadata({
    slug: 'about',
    path: '/about',
    defaultTitle: 'About Us | Kingdom Deliverance Centre Uganda',
    defaultDescription:
      'Learn about Kingdom Deliverance Centre Uganda — our history, vision, leadership, and mission under Bishop Climate Wiseman.',
    content,
    heroImageUrl,
  })

  // Prefer the actual organization OG image so social cards match branding.
  // Keep a fallback same-origin endpoint for environments where org image is missing.
  const forcedOgImage = orgOgImage || `https://kdcuganda.org/og/about-image?v=7`

  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      images: [{ url: forcedOgImage, width: 1200, height: 630, alt: 'About Us | KDC Uganda' }],
    },
    twitter: {
      ...base.twitter,
      images: [forcedOgImage],
    },
  }
}

export default async function AboutPage() {
  const data = await loadAboutPageData()
  return <AboutPageView data={data} />
}
