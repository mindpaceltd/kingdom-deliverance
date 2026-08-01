import type { CompetitorPlatformKey } from '@/lib/digital-ministry/competitor-platforms'

export interface DiscoveredSource {
  platform: CompetitorPlatformKey | string
  profileUrl: string
  feedUrl?: string | null
  sourceType: 'profile' | 'feed' | 'website'
}

const SOCIAL_PATTERNS: Array<{ platform: CompetitorPlatformKey; re: RegExp }> = [
  { platform: 'facebook', re: /https?:\/\/(?:www\.)?facebook\.com\/[^\s"'<>]+/gi },
  { platform: 'instagram', re: /https?:\/\/(?:www\.)?instagram\.com\/[^\s"'<>]+/gi },
  { platform: 'youtube', re: /https?:\/\/(?:www\.)?(?:youtube\.com\/(?:channel|c|@)[^\s"'<>]+|youtu\.be\/[^\s"'<>]+)/gi },
  { platform: 'tiktok', re: /https?:\/\/(?:www\.)?tiktok\.com\/@[^\s"'<>]+/gi },
  { platform: 'x', re: /https?:\/\/(?:www\.)?(?:x\.com|twitter\.com)\/[^\s"'<>]+/gi },
  { platform: 'linkedin', re: /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[^\s"'<>]+/gi },
  { platform: 'telegram', re: /https?:\/\/(?:t\.me|telegram\.me)\/[^\s"'<>]+/gi },
]

export function discoverSourcesFromHtml(html: string, websiteUrl: string): DiscoveredSource[] {
  const found: DiscoveredSource[] = []
  const seen = new Set<string>()

  function add(source: DiscoveredSource) {
    const key = `${source.platform}:${source.profileUrl}`
    if (seen.has(key)) return
    seen.add(key)
    found.push(source)
  }

  for (const { platform, re } of SOCIAL_PATTERNS) {
    re.lastIndex = 0
    const matches = html.match(re) ?? []
    for (const url of matches.slice(0, 2)) {
      const clean = url.replace(/[\\"'<>]+$/, '')
      add({ platform, profileUrl: clean, sourceType: 'profile' })
    }
  }

  const rssLinkRe =
    /<link[^>]+type=["']application\/(?:rss|atom)\+xml["'][^>]+href=["']([^"']+)["']/gi
  let rm: RegExpExecArray | null
  while ((rm = rssLinkRe.exec(html))) {
    try {
      const feedUrl = new URL(rm[1], websiteUrl).toString()
      add({ platform: 'rss', profileUrl: feedUrl, feedUrl, sourceType: 'feed' })
    } catch {
      /* ignore bad URLs */
    }
  }

  const commonFeeds = ['/feed', '/feed/', '/rss', '/rss.xml', '/atom.xml', '/blog/feed']
  for (const path of commonFeeds) {
    try {
      const feedUrl = new URL(path, websiteUrl).toString()
      add({ platform: 'rss', profileUrl: feedUrl, feedUrl, sourceType: 'feed' })
    } catch {
      /* ignore */
    }
  }

  return found
}

export async function discoverSourcesFromWebsite(websiteUrl: string): Promise<DiscoveredSource[]> {
  const res = await fetch(websiteUrl, {
    headers: { 'User-Agent': 'KDC-DigitalMinistry/1.0 (+https://kdcuganda.org)' },
    next: { revalidate: 0 },
  })
  const html = await res.text()
  return discoverSourcesFromHtml(html, websiteUrl)
}
