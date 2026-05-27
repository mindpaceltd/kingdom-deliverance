import { revalidatePath, revalidateTag } from 'next/cache'

/** Cache tag for dynamic sitemap entries (see `getCachedSitemapEntries`). */
export const SITEMAP_CACHE_TAG = 'sitemap'

/** Invalidate sitemap after CMS content is created, updated, or deleted. */
export function revalidateSitemap(): void {
  revalidateTag(SITEMAP_CACHE_TAG)
  revalidatePath('/sitemap.xml')
}
