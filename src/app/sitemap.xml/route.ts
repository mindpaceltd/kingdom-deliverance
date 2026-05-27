import { getCachedSitemapEntries, renderSitemapXml } from '@/lib/seo/sitemap'

export async function GET() {
  const entries = await getCachedSitemapEntries()
  const sitemap = renderSitemapXml(entries)

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
