import {
  buildPublicContentUrl,
  type PublicContentKind,
} from '@/lib/seo/public-content-urls'

export interface IndexableRecord {
  status: string
  slug: string
}

export function isPublishedForIndexing(item: IndexableRecord): boolean {
  return item.status === 'published' && Boolean(item.slug?.trim())
}

export function getPublicIndexUrl(kind: PublicContentKind, slug: string): string {
  return buildPublicContentUrl(kind, slug.trim())
}

export function collectPublishedUrls(
  kind: PublicContentKind,
  items: IndexableRecord[]
): string[] {
  const urls = items
    .filter(isPublishedForIndexing)
    .map((item) => getPublicIndexUrl(kind, item.slug))
  return [...new Set(urls)]
}
