import type { Metadata } from 'next'
import { AboutPageView } from '@/components/about/about-page-view'
import { loadAboutPageData } from '@/lib/cms/load-about-page-data'
import { parsePageContent } from '@/lib/cms/page-content'
import { getAboutHeroUrl } from '@/lib/seo/page-hero'
import { getOrgOgImageUrl, getSiteName } from '@/lib/seo/site-branding'
import { createClient } from '@/lib/supabase/server'
import { createSocialImageMetadata } from '@/lib/seo-image-utils'
import { createCanonicalMetadata } from '@/lib/seo/canonical-utils'

export async function generateMetadata(): Promise<Metadata> {
  const supabase = createClient()
  const [pageRes, heroImageUrl, orgOgImage, siteName] = await Promise.all([
    supabase
      .from('pages')
      .select('content_json')
      .eq('slug', 'about')
      .eq('status', 'published')
      .maybeSingle(),
    getAboutHeroUrl(),
    getOrgOgImageUrl(),
    getSiteName(),
  ])

  const content = pageRes.data?.content_json
    ? parsePageContent(pageRes.data.content_json)
    : null
  const ogTitle =
    content?.seo?.ogTitle?.trim() ||
    content?.seo?.metaTitle?.trim() ||
    'About Us'
  const description =
    content?.seo?.ogDescription?.trim() ||
    content?.seo?.metaDescription?.trim() ||
    'Learn about Kingdom Deliverance Centre Uganda — our history, vision, leadership, and mission under Bishop Climate Wiseman.'
  const pageUrl = 'https://kdcuganda.org/about'
  const socialImage = createSocialImageMetadata(
    ogTitle,
    description,
    content?.seo?.ogImageUrl || content?.hero?.imageUrl || heroImageUrl,
    'default',
    orgOgImage
  )

  return {
    title: ogTitle,
    description,
    ...createCanonicalMetadata('/about'),
    openGraph: {
      title: ogTitle,
      description,
      url: pageUrl,
      siteName,
      type: 'website',
      locale: 'en_UG',
      images: [socialImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images: [socialImage.url],
    },
  }
}

export default async function AboutPage() {
  const data = await loadAboutPageData()
  return <AboutPageView data={data} />
}
