import { computeSeoScore } from '@/lib/seo-scorer'
import type { CmsPage } from '@/lib/types'
import { parsePageContent } from '@/lib/cms/page-content'

/** Live SEO score (0–100) from CMS fields — same rules as the page editor SEO panel. */
export function computePageSeoScore(page: CmsPage): number {
  const content = parsePageContent(page.content_json)
  const seo = content.seo

  const { score } = computeSeoScore({
    focusKeyword: seo?.focusKeyword ?? '',
    seoTitle: seo?.metaTitle ?? page.title,
    metaDescription: seo?.metaDescription ?? content.excerpt ?? '',
    content: content.bodyHtml ?? '',
    slug: page.slug === 'home' ? '' : page.slug,
    featuredImage: seo?.ogImageUrl || content.hero?.imageUrl || '',
  })

  return score
}
