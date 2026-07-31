const CHANNEL_ID_PATTERN = /UC[\w-]{22}/
const VIDEO_ID_PATTERN = /[\w-]{11}/

/** Site origin sent to YouTube embeds (required for reliable playback). */
export const YOUTUBE_EMBED_ORIGIN = 'https://kdcuganda.org'

/** Unicode dash variants pasted from Word/docs break YouTube embed URLs. */
const UNICODE_DASHES = /[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g

const YOUTUBE_FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (compatible; KDCUgandaBot/1.0; +https://kdcuganda.org/live)',
} as const

export function sanitizeYouTubeChannelId(value?: string | null): string | null {
  if (!value?.trim()) return null
  const normalized = value.trim().replace(UNICODE_DASHES, '-')
  const match = normalized.match(CHANNEL_ID_PATTERN)
  return match?.[0] ?? null
}

export function parseYouTubeChannelId(value?: string | null): string | null {
  const input = value?.trim()
  if (!input) return null

  const sanitized = sanitizeYouTubeChannelId(input)
  if (sanitized) return sanitized

  const fromChannelPath = input.replace(UNICODE_DASHES, '-').match(/youtube\.com\/channel\/(UC[\w-]{22})/i)
  if (fromChannelPath) return fromChannelPath[1]

  const fromEmbed = input.replace(UNICODE_DASHES, '-').match(/[?&]channel=(UC[\w-]{22})/i)
  if (fromEmbed) return fromEmbed[1]

  return null
}

export function parseYouTubeHandle(value?: string | null): string | null {
  const input = value?.trim()
  if (!input) return null

  const match = input.match(/youtube\.com\/@([^/?#]+)/i) || input.match(/^@([^/?#]+)/)
  return match?.[1] ?? null
}

export async function resolveYouTubeChannelIdFromHandle(handle: string): Promise<string | null> {
  const normalized = handle.replace(/^@/, '').trim()
  if (!normalized) return null

  try {
    const response = await fetch(`https://www.youtube.com/@${normalized}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; KDCUgandaBot/1.0; +https://kdcuganda.org/live)',
      },
      next: { revalidate: 60 * 60 * 24 },
    })

    if (!response.ok) return null

    const html = await response.text()
    const externalId = html.match(/"externalId":"(UC[\w-]{22})"/)?.[1]
    if (externalId) return externalId

    const channelId = html.match(/"channelId":"(UC[\w-]{22})"/)?.[1]
    return channelId ?? null
  } catch {
    return null
  }
}

export function buildYouTubeVideoEmbedUrl(videoId: string): string {
  const params = new URLSearchParams({
    autoplay: '0',
    rel: '0',
    modestbranding: '1',
    origin: YOUTUBE_EMBED_ORIGIN,
  })
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`
}

export function buildYouTubeLiveEmbedUrl(channelId: string): string {
  const params = new URLSearchParams({
    channel: channelId,
    autoplay: '0',
    rel: '0',
    modestbranding: '1',
    origin: YOUTUBE_EMBED_ORIGIN,
  })
  return `https://www.youtube.com/embed/live_stream?${params.toString()}`
}

export function buildYouTubeChannelLiveUrl(channelId: string): string {
  return `https://www.youtube.com/channel/${channelId}/live`
}

export function buildYouTubeChannelUrl(channelId: string): string {
  return `https://www.youtube.com/channel/${channelId}`
}

export const DEFAULT_YOUTUBE_CHANNEL_ID = 'UChhdehWEPhFS7ebO8WDEjEA'
export const DEFAULT_YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@bishopclimateministries'

export async function validateYouTubeChannelId(channelId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`,
      { next: { revalidate: 86400 } },
    )
    if (!response.ok) return false
    const xml = await response.text()
    return xml.includes(`<yt:channelId>${channelId}</yt:channelId>`)
  } catch {
    return false
  }
}

function extractVideoIdsFromRss(xml: string, limit = 12): string[] {
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? []
  const ids: string[] = []
  const seen = new Set<string>()

  for (const entry of entries) {
    const watchLink = entry.match(
      /<link rel="alternate" href="https:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})"/,
    )?.[1]
    const videoId =
      watchLink ?? entry.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/)?.[1] ?? null
    if (!videoId || !VIDEO_ID_PATTERN.test(videoId) || seen.has(videoId)) continue

    const isShort = entry.includes('/shorts/') || entry.includes('#shorts')
    if (isShort) continue

    seen.add(videoId)
    ids.push(videoId)
    if (ids.length >= limit) break
  }

  if (ids.length) return ids

  const fallback = xml.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/)?.[1]
  return fallback ? [fallback] : []
}

/** Ended live streams often fail in embeds — skip them for the offline fallback player. */
export async function isEmbeddableChannelVideo(videoId: string): Promise<boolean> {
  try {
    const oembed = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(
        `https://www.youtube.com/watch?v=${videoId}`,
      )}&format=json`,
      { next: { revalidate: 300 } },
    )
    if (!oembed.ok) return false

    const watch = await fetch(`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`, {
      headers: YOUTUBE_FETCH_HEADERS,
      next: { revalidate: 300 },
    })
    if (!watch.ok) return false

    const html = await watch.text()
    if (html.includes('playabilityStatus":{"status":"ERROR"')) return false
    if (html.includes('LOGIN_REQUIRED')) return false
    if (html.includes('playabilityStatus":{"status":"UNPLAYABLE"')) return false

    // Ended live replays frequently show "Video unavailable" in iframes.
    if (html.includes('liveBroadcastDetails') && html.includes('"isLiveNow":false')) {
      return false
    }

    return true
  } catch {
    return false
  }
}

/** Latest playable upload from the channel RSS (skips Shorts and ended live streams). */
export async function fetchLatestChannelVideoId(channelId: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`,
      { next: { revalidate: 300 } },
    )
    if (!response.ok) return null

    const xml = await response.text()
    const candidates = extractVideoIdsFromRss(xml)

    for (const videoId of candidates) {
      if (await isEmbeddableChannelVideo(videoId)) return videoId
    }

    return candidates[0] ?? null
  } catch {
    return null
  }
}

/** Returns a video ID only when the channel is actively broadcasting live. */
export async function fetchActiveLiveVideoId(channelId: string): Promise<string | null> {
  try {
    const response = await fetch(`https://www.youtube.com/channel/${channelId}/live`, {
      headers: YOUTUBE_FETCH_HEADERS,
      next: { revalidate: 60 },
    })
    if (!response.ok) return null

    const html = await response.text()

    // YouTube marks offline channels explicitly — ignore stale video IDs on the page.
    if (html.includes('LIVE_STREAM_OFFLINE')) {
      return null
    }

    if (!html.includes('"isLiveNow":true')) {
      return null
    }

    const fromRedirect = html.match(/watch\?v=([\w-]{11})/)?.[1]
    if (fromRedirect) return fromRedirect

    return html.match(/"videoId":"([\w-]{11})"/)?.[1] ?? null
  } catch {
    return null
  }
}
