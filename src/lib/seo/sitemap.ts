import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { getSitemapOrigin, buildPublicPageUrl } from '@/lib/seo/public-content-urls'
import { SITEMAP_CACHE_TAG } from '@/lib/seo/revalidate-sitemap'

export type SitemapChangeFreq =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never'

export interface SitemapEntry {
  loc: string
  lastmod: string
  changefreq: SitemapChangeFreq
  priority: number
}

const STATIC_ROUTES: Array<{
  path: string
  changefreq: SitemapChangeFreq
  priority: number
}> = [
  { path: '', changefreq: 'weekly', priority: 1 },
  { path: '/about', changefreq: 'monthly', priority: 0.8 },
  { path: '/sermons', changefreq: 'weekly', priority: 0.9 },
  { path: '/events', changefreq: 'weekly', priority: 0.9 },
  { path: '/ministries', changefreq: 'weekly', priority: 0.8 },
  { path: '/blog', changefreq: 'daily', priority: 0.9 },
  { path: '/gallery', changefreq: 'weekly', priority: 0.7 },
  { path: '/shop', changefreq: 'daily', priority: 0.8 },
  { path: '/contact', changefreq: 'monthly', priority: 0.7 },
  { path: '/give', changefreq: 'monthly', priority: 0.7 },
  { path: '/donations', changefreq: 'monthly', priority: 0.7 },
  { path: '/prayer', changefreq: 'monthly', priority: 0.7 },
  { path: '/live', changefreq: 'daily', priority: 0.8 },
  { path: '/testimonies', changefreq: 'weekly', priority: 0.7 },
  { path: '/fire-service', changefreq: 'monthly', priority: 0.6 },
  { path: '/terms', changefreq: 'yearly', priority: 0.3 },
  { path: '/privacy', changefreq: 'yearly', priority: 0.3 },
  { path: '/faq', changefreq: 'monthly', priority: 0.5 },
]

function toLastmod(value: string | null | undefined): string {
  if (!value) return new Date().toISOString()
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
}

function entry(
  baseUrl: string,
  path: string,
  lastmod: string,
  changefreq: SitemapChangeFreq,
  priority: number
): SitemapEntry {
  const loc = path === '' || path === '/' ? `${baseUrl}/` : `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
  return { loc, lastmod: toLastmod(lastmod), changefreq, priority }
}

function pagePathFromSlug(slug: string): string {
  const normalized = slug.trim().toLowerCase()
  if (!normalized || normalized === 'home' || normalized === '/') return '/'
  return `/${normalized.replace(/^\/+/, '')}`
}

export async function buildSitemapEntries(): Promise<SitemapEntry[]> {
  const baseUrl = getSitemapOrigin()
  const admin = createAdminClient()
  const now = new Date().toISOString()

  const [posts, sermons, events, ministries, products, pages] = await Promise.all([
    admin.from('posts').select('slug, updated_at').eq('status', 'published'),
    admin.from('sermons').select('slug, updated_at').eq('status', 'published'),
    admin
      .from('events')
      .select('slug, updated_at')
      .in('status', ['published', 'upcoming', 'ongoing']),
    admin
      .from('ministries')
      .select('slug, updated_at')
      .eq('is_active', true)
      .eq('status', 'published'),
    admin
      .from('products')
      .select('slug, updated_at')
      .eq('status', 'published')
      .eq('is_active', true),
    admin.from('pages').select('slug, updated_at').eq('status', 'published'),
  ])

  const byLoc = new Map<string, SitemapEntry>()

  function add(e: SitemapEntry) {
    const existing = byLoc.get(e.loc)
    if (!existing || e.lastmod > existing.lastmod) {
      byLoc.set(e.loc, e)
    }
  }

  for (const route of STATIC_ROUTES) {
    add(entry(baseUrl, route.path, now, route.changefreq, route.priority))
  }

  for (const post of posts.data ?? []) {
    if (!post.slug) continue
    add(
      entry(baseUrl, `/blog/${post.slug}`, post.updated_at, 'monthly', 0.7)
    )
  }

  for (const sermon of sermons.data ?? []) {
    if (!sermon.slug) continue
    add(
      entry(baseUrl, `/sermons/${sermon.slug}`, sermon.updated_at, 'monthly', 0.8)
    )
  }

  for (const event of events.data ?? []) {
    if (!event.slug) continue
    add(
      entry(baseUrl, `/events/${event.slug}`, event.updated_at, 'weekly', 0.9)
    )
  }

  for (const ministry of ministries.data ?? []) {
    if (!ministry.slug) continue
    add(
      entry(
        baseUrl,
        `/ministries/${ministry.slug}`,
        ministry.updated_at,
        'monthly',
        0.6
      )
    )
  }

  for (const product of products.data ?? []) {
    if (!product.slug) continue
    add(
      entry(baseUrl, `/shop/${product.slug}`, product.updated_at, 'weekly', 0.7)
    )
  }

  for (const page of pages.data ?? []) {
    if (!page.slug) continue
    const path = pagePathFromSlug(page.slug)
    const loc = buildPublicPageUrl(page.slug, baseUrl)
    add({
      loc,
      lastmod: toLastmod(page.updated_at),
      changefreq: path === '/' ? 'weekly' : 'monthly',
      priority: path === '/' ? 1 : 0.75,
    })
  }

  return [...byLoc.values()].sort((a, b) => a.loc.localeCompare(b.loc))
}

export const getCachedSitemapEntries = unstable_cache(
  buildSitemapEntries,
  ['sitemap-entries-v3-kdcuganda'],
  { tags: [SITEMAP_CACHE_TAG], revalidate: 3600 }
)

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function renderSitemapXml(entries: SitemapEntry[]): string {
  const body = entries
    .map(
      (e) => `
  <url>
    <loc>${escapeXml(e.loc)}</loc>
    <lastmod>${escapeXml(e.lastmod)}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority.toFixed(1)}</priority>
  </url>`
    )
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}
</urlset>`
}
