import { stripHtml } from '@/lib/digital-ministry/gemini'
import type { NormalizedContentItem } from '@/lib/digital-ministry/competitor-intelligence/types'

export async function fetchWithTimeout(url: string, ms = 15000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'KDC-DigitalMinistry/1.0 (+https://kdcuganda.org)' },
      next: { revalidate: 0 },
    })
  } finally {
    clearTimeout(timer)
  }
}

export function parseCountText(text: string): number | null {
  const clean = text.replace(/,/g, '').trim().toLowerCase()
  const match = clean.match(/([\d.]+)\s*([kmb])?/)
  if (!match) return null
  let n = parseFloat(match[1])
  if (Number.isNaN(n)) return null
  const suffix = match[2]
  if (suffix === 'k') n *= 1_000
  if (suffix === 'm') n *= 1_000_000
  if (suffix === 'b') n *= 1_000_000_000
  return Math.round(n)
}

function hashId(input: string): string {
  let h = 0
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0
  return String(h)
}

export async function fetchRssFeed(url: string): Promise<{
  items: NormalizedContentItem[]
  error?: string
}> {
  try {
    const res = await fetchWithTimeout(url)
    const text = await res.text()
    const items: NormalizedContentItem[] = []

    const itemBlocks = text.match(/<item[\s\S]*?<\/item>/gi) ?? []
    const entryBlocks = itemBlocks.length ? [] : (text.match(/<entry[\s\S]*?<\/entry>/gi) ?? [])

    for (const block of [...itemBlocks, ...entryBlocks].slice(0, 40)) {
      const title = stripHtml(
        block.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1] ?? ''
      ).slice(0, 300)
      if (!title) continue

      const link =
        block.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1] ||
        block.match(/<link>([^<]+)<\/link>/i)?.[1] ||
        null

      const pub =
        block.match(/<pubDate>([^<]+)<\/pubDate>/i)?.[1] ||
        block.match(/<published>([^<]+)<\/published>/i)?.[1] ||
        block.match(/<updated>([^<]+)<\/updated>/i)?.[1] ||
        null

      const desc = stripHtml(
        block.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1] ??
          block.match(/<summary[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>/i)?.[1] ??
          ''
      ).slice(0, 2000)

      items.push({
        platform: 'rss',
        externalId: hashId(`${title}:${link ?? ''}`),
        url: link,
        title,
        description: desc || null,
        contentType: 'article',
        publishedAt: pub ? new Date(pub).toISOString() : null,
        mediaType: 'text',
      })
    }

    return { items }
  } catch (err) {
    return { items: [], error: err instanceof Error ? err.message : 'RSS fetch failed' }
  }
}

export async function fetchWebsiteArticles(url: string): Promise<{
  items: NormalizedContentItem[]
  excerpt: string
  error?: string
}> {
  try {
    const res = await fetchWithTimeout(url)
    const text = await res.text()
    const items: NormalizedContentItem[] = []
    const seen = new Set<string>()

    const linkRe = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
    let m: RegExpExecArray | null
    const base = new URL(url)

    while ((m = linkRe.exec(text)) && items.length < 25) {
      const href = m[1]
      const label = stripHtml(m[2]).trim()
      if (!label || label.length < 8 || label.length > 180) continue
      if (/^(home|about|contact|login|menu|search|privacy|terms)$/i.test(label)) continue

      let abs: string
      try {
        abs = new URL(href, base).toString()
      } catch {
        continue
      }
      if (!abs.startsWith(base.origin)) continue
      if (seen.has(abs)) continue
      seen.add(abs)

      items.push({
        platform: 'website',
        externalId: hashId(abs),
        url: abs,
        title: label,
        contentType: 'page',
        publishedAt: null,
        mediaType: 'text',
      })
    }

    const desc =
      text.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i)?.[1] ||
      text.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)/i)?.[1] ||
      ''

    return { items, excerpt: stripHtml(desc).slice(0, 400) }
  } catch (err) {
    return { items: [], excerpt: '', error: err instanceof Error ? err.message : 'Website fetch failed' }
  }
}

export async function fetchYouTubePublic(url: string): Promise<{
  items: NormalizedContentItem[]
  subscribers: number | null
  channelTitle: string | null
  error?: string
}> {
  try {
    const res = await fetchWithTimeout(url)
    const text = await res.text()
    const items: NormalizedContentItem[] = []

    const channelTitle =
      stripHtml(
        text.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i)?.[1] ||
          text.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ||
          ''
      ).replace(/\s*-\s*YouTube\s*$/i, '') || null

    const videoTitleRe = /"videoId":"([^"]{11})"[\s\S]{0,400}?"title":\{"(?:simpleText|runs)":"([^"]{4,140})"/g
    let vm: RegExpExecArray | null
    while ((vm = videoTitleRe.exec(text)) && items.length < 20) {
      items.push({
        platform: 'youtube',
        externalId: vm[1],
        url: `https://www.youtube.com/watch?v=${vm[1]}`,
        title: vm[2].replace(/\\u0026/g, '&'),
        contentType: 'video',
        publishedAt: null,
        mediaType: 'video',
      })
    }

    if (!items.length) {
      const altRe = /"title":\{"runs":\[\{"text":"([^"]{4,120})"/g
      while ((vm = altRe.exec(text)) && items.length < 15) {
        const t = vm[1].replace(/\\u0026/g, '&')
        if (t.toLowerCase().includes('youtube')) continue
        items.push({
          platform: 'youtube',
          externalId: hashId(t),
          url,
          title: t,
          contentType: 'video',
          publishedAt: null,
          mediaType: 'video',
        })
      }
    }

    const subMatch =
      text.match(/"subscriberCountText":\{"simpleText":"([^"]+)"/) ||
      text.match(/"subscriberCountText":\{"runs":\[\{"text":"([^"]+)"/)

    return {
      items,
      subscribers: subMatch?.[1] ? parseCountText(subMatch[1]) : null,
      channelTitle,
    }
  } catch (err) {
    return { items: [], subscribers: null, channelTitle: null, error: err instanceof Error ? err.message : 'YouTube fetch failed' }
  }
}

export async function fetchSocialProfileMetadata(
  platform: string,
  url: string
): Promise<{ title: string | null; description: string | null; error?: string }> {
  try {
    const res = await fetchWithTimeout(url)
    const text = await res.text()
    const title = stripHtml(
      text.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i)?.[1] ||
        text.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ||
        ''
    ).slice(0, 200)
    const description = stripHtml(
      text.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)/i)?.[1] ||
        text.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i)?.[1] ||
        ''
    ).slice(0, 500)
    return { title: title || null, description: description || null }
  } catch (err) {
    return {
      title: null,
      description: null,
      error: err instanceof Error ? err.message : `${platform} fetch failed`,
    }
  }
}
