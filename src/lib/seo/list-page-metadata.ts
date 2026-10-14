import { resolveListQuerySeo } from '@/lib/seo/list-query-metadata'
import { createClient } from '@/lib/supabase/server'
import { getPublishedPageBySlug } from '@/lib/cms/get-published-page'
import { stripHtmlExcerpt } from '@/lib/seo-image-utils'
import { seoPageTitle } from '@/lib/seo-image-utils'
import type { Metadata } from 'next'
import { createCanonicalMetadata } from '@/lib/seo/canonical-utils'
import { getOrgOgImageUrl, getSiteName } from '@/lib/seo/site-branding'
import { createSocialImageMetadata } from '@/lib/seo-image-utils'

export type ListPageSeoType =
  | 'default'
  | 'blog'
  | 'sermon'
  | 'event'
  | 'ministry'
  | 'product'

export interface ListPageMetadataOptions {
  /** Short page title — root layout template appends the site name once. */
  title: string
  description: string
  path: string
  searchParams?: Record<string, string | undefined>
  keywords?: string
  ogType?: ListPageSeoType
  locale?: 'en_UG' | 'en_US'
}

/**
 * Full metadata for index/list pages: canonical, Open Graph, Twitter, and social image.
 */
export async function buildListPageMetadata(
  options: ListPageMetadataOptions
): Promise<Metadata> {
  const [orgOgImage, siteName] = await Promise.all([getOrgOgImageUrl(), getSiteName()])
  const slug = options.path === '/' ? 'home' : options.path.slice(1)
  const page = !slug.includes('/') ? await getPublishedPageBySlug(createClient(), slug) : null
  const seo = page?.content?.seo
  const querySeo = resolveListQuerySeo(options.path, options.searchParams)
  const title = (seo?.metaTitle?.trim() || options.title) + querySeo.suffix
  const description = stripHtmlExcerpt(seo?.metaDescription || options.description, 160)
  const ogTitle = seo?.ogTitle?.trim() ? seo.ogTitle.trim() + querySeo.suffix : title
  const ogDescription = stripHtmlExcerpt(seo?.ogDescription || description, 160)
  const ogType = options.ogType ?? 'default'
  const locale = options.locale ?? 'en_UG'
  const pageUrl = `https://kdcuganda.org${querySeo.path === '/' ? '' : querySeo.path}`

  const socialImage = createSocialImageMetadata(
    ogTitle,
    ogDescription,
    seo?.ogImageUrl || null,
    ogType,
    orgOgImage
  )

  return {
    title: seoPageTitle(title),
    description,
    ...(options.keywords ? { keywords: options.keywords } : {}),
    ...((seo?.noIndex || querySeo.noIndex) ? { robots: { index: false, follow: true } } : {}),
    ...createCanonicalMetadata(querySeo.path),
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: pageUrl,
      siteName,
      type: 'website',
      locale,
      images: [socialImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: [socialImage.url],
    },
  }
}
