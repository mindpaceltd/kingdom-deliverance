import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  
  // Get all published posts, sermons, events, ministries
  const [posts, sermons, events, ministries] = await Promise.all([
    supabase.from('posts').select('slug, updated_at').eq('status', 'published'),
    supabase.from('sermons').select('slug, updated_at').eq('status', 'published'),
    supabase.from('events').select('slug, updated_at').eq('status', 'upcoming'),
    supabase.from('ministries').select('slug, updated_at').eq('is_active', true)
  ])

  const baseUrl = 'https://kdcuganda.org'
  
  const staticPages = [
    { url: '', lastmod: new Date().toISOString() },
    { url: '/about', lastmod: new Date().toISOString() },
    { url: '/sermons', lastmod: new Date().toISOString() },
    { url: '/events', lastmod: new Date().toISOString() },
    { url: '/ministries', lastmod: new Date().toISOString() },
    { url: '/blog', lastmod: new Date().toISOString() },
    { url: '/gallery', lastmod: new Date().toISOString() },
    { url: '/contact', lastmod: new Date().toISOString() },
    { url: '/donations', lastmod: new Date().toISOString() },
    { url: '/prayer', lastmod: new Date().toISOString() },
    { url: '/live', lastmod: new Date().toISOString() },
  ]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages.map(page => `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page.url === '' ? '1.0' : '0.8'}</priority>
  </url>`).join('')}
  
  ${posts.data?.map(post => `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${post.updated_at}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('') || ''}
  
  ${sermons.data?.map(sermon => `
  <url>
    <loc>${baseUrl}/sermons/${sermon.slug}</loc>
    <lastmod>${sermon.updated_at}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('') || ''}
  
  ${events.data?.map(event => `
  <url>
    <loc>${baseUrl}/events/${event.slug}</loc>
    <lastmod>${event.updated_at}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`).join('') || ''}
  
  ${ministries.data?.map(ministry => `
  <url>
    <loc>${baseUrl}/ministries/${ministry.slug}</loc>
    <lastmod>${ministry.updated_at}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('') || ''}
</urlset>`

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
