import { parsePageContent } from '@/lib/cms/page-content'
import { buildPublicPageUrl } from '@/lib/seo/public-content-urls'
import type { CmsPage } from '@/lib/types'

export function isPageIndexable(page: CmsPage): boolean {
  if (page.status !== 'published') return false
  const content = parsePageContent(page.content_json)
  return content.seo?.noIndex !== true
}

export function getPageIndexUrl(page: CmsPage): string {
  const content = parsePageContent(page.content_json)
  const canonical = content.seo?.canonicalUrl?.trim()
  if (canonical) return canonical
  return buildPublicPageUrl(page.slug)
}

export function collectIndexablePageUrls(pages: CmsPage[]): string[] {
  const urls = pages.filter(isPageIndexable).map(getPageIndexUrl)
  return [...new Set(urls)]
}
