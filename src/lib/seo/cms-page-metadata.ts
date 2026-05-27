import type { Metadata } from 'next'
import type { CmsPageContent } from '@/lib/cms/page-content'
import { createCanonicalMetadata } from '@/lib/seo/canonical-utils'
import { buildPublicPageUrl } from '@/lib/seo/public-content-urls'
import { getOrgOgImageUrl, getSiteName } from '@/lib/seo/site-branding'
import { createSocialImageMetadata } from '@/lib/seo-image-utils'
import { normalizeMediaUrl } from '@/lib/media-url'

export async function buildCmsPageMetadata(options: {
  slug: string
  path: string
  defaultTitle: string
  defaultDescription: string
  content?: CmsPageContent | null
  /** Resolved hero URL (org photos, etc.) when CMS hero is empty */
  heroImageUrl?: string | null
}): Promise<Metadata> {
  const seo = options.content?.seo
  const title = seo?.metaTitle ?? options.defaultTitle
  const description = seo?.metaDescription ?? options.defaultDescription
  const ogTitle = seo?.ogTitle?.trim() || title
  const ogDescription = seo?.ogDescription?.trim() || description

  const [orgOgImage, siteName] = await Promise.all([getOrgOgImageUrl(), getSiteName()])

  const shareImageCandidate =
    seo?.ogImageUrl ||
    options.content?.hero?.imageUrl ||
    options.heroImageUrl ||
    null

  const socialImage = createSocialImageMetadata(
    ogTitle,
    ogDescription,
    normalizeMediaUrl(shareImageCandidate),
    'default',
    orgOgImage
  )

  const pageUrl = buildPublicPageUrl(options.slug)

  return {
    title,
    description,
    ...(seo?.noIndex ? { robots: { index: false, follow: false } } : {}),
    ...createCanonicalMetadata(options.path),
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: pageUrl,
      siteName,
      type: 'website',
      locale: 'en_US',
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
