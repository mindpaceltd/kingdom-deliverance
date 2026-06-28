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
  const ogType = options.ogType ?? 'default'
  const locale = options.locale ?? 'en_UG'
  const pageUrl = `https://kdcuganda.org${options.path === '/' ? '' : options.path}`

  const socialImage = createSocialImageMetadata(
    options.title,
    options.description,
    null,
    ogType,
    orgOgImage
  )

  return {
    title: options.title,
    description: options.description,
    ...(options.keywords ? { keywords: options.keywords } : {}),
    ...createCanonicalMetadata(options.path),
    openGraph: {
      title: options.title,
      description: options.description,
      url: pageUrl,
      siteName,
      type: 'website',
      locale,
      images: [socialImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: options.title,
      description: options.description,
      images: [socialImage.url],
    },
  }
}
